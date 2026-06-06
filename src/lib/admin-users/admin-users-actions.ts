"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function verifyAdminUser(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  await prisma.$transaction([
    prisma.citizenProfile.updateMany({
      where: { userId },
      data: { isVerified: true },
    }),
    prisma.agencyProfile.updateMany({
      where: { userId },
      data: { isVerified: true },
    }),
  ]);

  revalidatePath("/admin/users");
}

export async function toggleAdminUserBlock(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  const isBlocked = formData.get("isBlocked") === "true";
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: isBlocked ? null : new Date() },
  });

  revalidatePath("/admin/users");
}
