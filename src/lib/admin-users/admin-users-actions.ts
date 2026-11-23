"use server";

import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { canManage } from "@/lib/permissions";

async function getManager(token: string) {
  const actor = await getAuthUser({
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  });
  return actor && canManage(actor.role) ? actor : null;
}

export type AdminUserActionState = {
  message: string;
  status: "idle" | "success" | "error";
};

export async function verifyAdminUser(
  _previousState: AdminUserActionState,
  formData: FormData,
  token: string,
): Promise<AdminUserActionState> {
  const actor = await getManager(token);
  if (!actor) return { message: "Forbidden", status: "error" };
  const userId = String(formData.get("userId") || "");
  if (!userId) {
    return { message: "User ID is missing.", status: "error" };
  }

  try {
    const agencyProfile = await prisma.agencyProfile.findUnique({
      where: { userId: actor.userId },
      select: { id: true },
    });

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

    return { message: "User verified.", status: "success" };
  } catch {
    return { message: "Failed to verify user.", status: "error" };
  }
}

export async function toggleAdminUserBlock(
  _previousState: AdminUserActionState,
  formData: FormData,
  token: string,
): Promise<AdminUserActionState> {
  if (!(await getManager(token)))
    return { message: "Forbidden", status: "error" };
  const userId = String(formData.get("userId") || "");
  const isBlocked = formData.get("isBlocked") === "true";
  if (!userId) {
    return { message: "User ID is missing.", status: "error" };
  }

  try {
    await prisma.user.update({
      where: { id: userId, role: "WARGA" },
      data: { deletedAt: isBlocked ? null : new Date() },
    });

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
