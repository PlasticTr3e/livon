import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  created,
  badRequest,
  internalError,
  notFound,
} from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { DonationStatus, Role } from "@/generated/prisma/enums";
import { snap } from "@/lib/midtrans";

const donationSchema = z.object({
  projectId: z.uuid(),
  amount: z.number().positive().min(10000, "Minimum donation is Rp. 10.000"),
});

/**
 * @swagger
 * /api/donations:
 *   post:
 *     summary: Initiate a donation (Midtrans)
 *     description: Creates a pending donation and generates a Midtrans Snap Payment URL.
 *     Req: Citizen (WARGA).
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - amount
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 10000
 *     responses:
 *       201:
 *         description: Midtrans payment URL generated
 *       400:
 *         description: Validation failed or Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== Role.WARGA) {
      return badRequest("Forbidden: Only Citizens can donate");
    }

    const body = await req.json();
    const result = donationSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", z.treeifyError(result.error));

    const { projectId, amount } = result.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return notFound("Project not found");

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { citizenProfile: true },
    });

    const orderId = `LIVON-${Date.now()}-${authUser.userId.slice(0, 5)}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: user?.citizenProfile?.fullName || "Citizen",
        email: user?.email,
        phone: user?.citizenProfile?.phone || "",
      },
    };

    const transaction = await snap.createTransaction(parameter);
    const paymentUrl = transaction.redirect_url;
    const token = transaction.token;

    const donation = await prisma.donation.create({
      data: {
        orderId,
        projectId,
        userId: authUser.userId,
        amount,
        status: DonationStatus.PENDING,
        paymentUrl,
      },
    });

    return created("Donation initiated successfully", {
      data: {
        donationId: donation.id,
        paymentUrl,
        token,
      },
    });
  } catch (error) {
    console.error("POST Donation Error:", error);
    return internalError(
      "An internal server error occurred processing the donation",
    );
  }
}
