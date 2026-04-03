import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError, notFound } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";

const verifySchema = z.object({
  isVerified: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return badRequest("Unauthorized: Invalid or missing token");
    if (authUser.role !== Role.AGENCY)
      return badRequest("Forbidden: Only Agencies can verify citizens");

    const body = await req.json();
    const result = verifySchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", result.error.flatten());

    const { id: citizenUserId } = await params;

    const citizen = await prisma.citizenProfile.findUnique({
      where: { userId: citizenUserId },
    });

    if (!citizen) return notFound("Citizen profile not found");

    const updatedCitizen = await prisma.citizenProfile.update({
      where: { userId: citizenUserId },
      data: { isVerified: result.data.isVerified },
    });

    return ok(
      `Citizen verification status updated to ${result.data.isVerified}`,
      { data: updatedCitizen },
    );
  } catch (error) {
    console.error("Verification Error:", error);
    return internalError("An error occurred during verification");
  }
}
