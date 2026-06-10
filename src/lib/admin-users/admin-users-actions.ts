"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export type AdminUserActionState = {
  message: string;
  status: "idle" | "success" | "error";
};

export async function verifyAdminUser(
  _previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const userId = String(formData.get("userId") || "");
  const verifierUserId = String(formData.get("verifierUserId") || "");
  if (!userId) {
    return { message: "User ID is missing.", status: "error" };
  }

  try {
    const agencyProfile = verifierUserId
      ? await prisma.agencyProfile.findUnique({
          where: { userId: verifierUserId },
          select: { id: true },
        })
      : null;

    await prisma.$transaction([
      prisma.citizenProfile.updateMany({
        where: { userId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          ...(agencyProfile?.id ? { verifiedBy: agencyProfile.id } : {}),
        },
      }),
      prisma.agencyProfile.updateMany({
        where: { userId },
        data: { isVerified: true },
      }),
    ]);

    revalidatePath("/admin/users");
    return { message: "User verified.", status: "success" };
  } catch {
    return { message: "Failed to verify user.", status: "error" };
  }
}

export async function toggleAdminUserBlock(
  _previousState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const userId = String(formData.get("userId") || "");
  const isBlocked = formData.get("isBlocked") === "true";
  if (!userId) {
    return { message: "User ID is missing.", status: "error" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: isBlocked ? null : new Date() },
    });

    revalidatePath("/admin/users");
    return {
      message: isBlocked ? "User unblocked." : "User blocked.",
      status: "success",
    };
  } catch {
    return {
      message: isBlocked ? "Failed to unblock user." : "Failed to block user.",
      status: "error",
    };
  }
}
