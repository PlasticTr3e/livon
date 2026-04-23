import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError } from "@/lib/api-response";
import midtransClient from "midtrans-client";

// Setup Midtrans Core API untuk verifikasi
const core = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

/**
 * @swagger
 * /api/donations/notification:
 * post:
 * summary: Handle Midtrans payment notification
 * tags: [Donations]
 */
export async function POST(req: NextRequest) {
  try {
    const notificationJson = await req.json();
    const coreApi = core as unknown as {
      transaction: {
        notification: (json: unknown) => Promise<unknown>;
      };
    };
    // Verifikasi signature
    const isValidSignature =
      await coreApi.transaction.notification(notificationJson);
    if (!isValidSignature) {
      return badRequest("Invalid signature");
    }

    const { order_id, transaction_status, fraud_status, payment_type } =
      notificationJson;

    // Cari donasi berdasarkan order_id
    const donation = await prisma.donation.findUnique({
      where: { orderId: order_id },
    });

    if (!donation) {
      return badRequest("Donation not found");
    }

    // Update status berdasarkan transaction_status
    let status: string = "";
    let paidAt: Date | null = null;

    switch (transaction_status) {
      case "capture":
        if (fraud_status === "challenge") {
          status = "PENDING";
        } else if (fraud_status === "accept") {
          status = "SUCCESS";
          paidAt = new Date();
        }
        break;
      case "settlement":
        status = "SUCCESS";
        paidAt = new Date();
        break;
      case "deny":
      case "cancel":
      case "expire":
        status = "FAILED";
        break;
      case "pending":
        status = "PENDING";
        break;
      default:
        status = "PENDING";
    }

    // Update donasi
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: status as "PENDING" | "SUCCESS" | "FAILED", // Cast to enum type
        paymentMethod: payment_type,
        paidAt: paidAt,
        gatewayTransactionId: notificationJson.transaction_id,
      },
    });

    // Jika paid, update currentFunding di project
    if (status === "SUCCESS") {
      await prisma.project.update({
        where: { id: donation.projectId },
        data: {
          currentFunding: {
            increment: donation.amount,
          },
        },
      });
    }

    return ok("Notification processed successfully");
  } catch (error) {
    console.error("Midtrans Notification Error:", error);
    return internalError("An error occurred processing notification");
  }
}
