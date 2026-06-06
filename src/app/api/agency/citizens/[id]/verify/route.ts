import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError, notFound } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";

const verifySchema = z.object({
  isVerified: z.boolean(),
});

/**
 * @swagger
 * /api/agency/citizens/{id}/verify:
 *   patch:
 *     summary: Verify a Citizen's NIK/KK
 *     description: Approves a citizen account to allow them to participate (Vote).
 *     tags: [Agency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The User ID of the Citizen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Citizen verified successfully
 *       400:
 *         description: Forbidden or validation failed
 *       404:
 *         description: Citizen profile not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return badRequest("Unauthorized: Invalid or missing token");
    if (authUser.role !== Role.AGENCY)
      return badRequest("Forbidden: Only Agencies can verify citizens");

    const agencyProfile = await prisma.agencyProfile.findUnique({
      where: { userId: authUser.userId },
      select: { id: true },
    });

    if (!agencyProfile) {
      return badRequest("Forbidden: Agency profile not found");
    }

    const body = await req.json();
    const result = verifySchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", z.treeifyError(result.error));

    const { id: citizenUserId } = await params;

    const citizen = await prisma.citizenProfile.findUnique({
      where: { userId: citizenUserId },
    });

    if (!citizen) return notFound("Citizen profile not found");

    const isVerified = result.data.isVerified;

    const updatedCitizen = await prisma.citizenProfile.update({
      where: { userId: citizenUserId },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedBy: isVerified ? agencyProfile.id : null,
      },
    });

    return ok(`Citizen verification status updated to ${isVerified}`, {
      data: updatedCitizen,
    });
  } catch (error) {
    console.error("Verification Error:", error);
    return internalError("An error occurred during verification");
  }
}
