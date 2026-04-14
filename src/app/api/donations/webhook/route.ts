import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { DonationStatus } from "@/generated/prisma/enums";
import { internalError, notFound, ok } from "@/lib/api-response";

/**
 * @swagger
 * /api/donations/webhook:
 *   post:
 *     summary: Midtrans Webhook Callback
 *     description: Secret endpoint called automatically by Midtrans backend upon payment state changes.
 *     tags: [Donations]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      //   status_code,
      //   gross_amount,
      //   signature_key,
      transaction_status,
      transaction_id,
      payment_type,
    } = body;

    const donation = await prisma.donation.findUnique({
      where: { orderId: order_id },
      include: { project: true },
    });

    if (!donation?.orderId) {
      return notFound("Order Not Found");
    }

    if (donation.status === DonationStatus.SUCCESS) {
      return ok("Donation already processed");
    }

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      const currentAmount = donation.project.currentFunding
        ? Number(donation.project.currentFunding)
        : 0;
      const addedAmount = Number(donation.amount);
      const newTotalFunding = currentAmount + addedAmount;

      await prisma.$transaction([
        prisma.donation.update({
          where: { orderId: order_id },
          data: {
            status: DonationStatus.SUCCESS,
            gatewayTransactionId: transaction_id,
            paymentMethod: payment_type,
            paidAt: new Date(),
          },
        }),

        prisma.project.update({
          where: { id: donation.projectId },
          data: {
            currentFunding: newTotalFunding,
          },
        }),
      ]);
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      await prisma.donation.update({
        where: { orderId: order_id },
        data: {
          status: DonationStatus.FAILED,
          gatewayTransactionId: transaction_id,
          paymentMethod: payment_type,
        },
      });
    }

    return ok("Webhook acknowledged");
  } catch (error) {
    console.error(error);
    return internalError("Webhook processing error");
  }
}
