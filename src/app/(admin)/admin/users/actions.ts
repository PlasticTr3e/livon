"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUsersAction() {
  try {
    const users = await prisma.user.findMany({
      include: {
        citizenProfile: true,
        agencyProfile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: users };
  } catch (error: unknown) {
    console.error("Get users error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return { success: false, message };
  }
}

export async function toggleUserVerificationAction(
  userId: string,
  isVerified: boolean,
) {
  try {
    // Determine which profile the user has
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { citizenProfile: true, agencyProfile: true },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.citizenProfile) {
      await prisma.citizenProfile.update({
        where: { id: user.citizenProfile.id },
        data: { isVerified },
      });
    }

    if (user.agencyProfile) {
      await prisma.agencyProfile.update({
        where: { id: user.agencyProfile.id },
        data: { isVerified },
      });
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    console.error("Toggle user verification error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update verification status";
    return { success: false, message };
  }
}

export async function updateUserProfileAction(
  userId: string,
  data: { name: string; address: string },
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { citizenProfile: true, agencyProfile: true },
    });

    if (!user) return { success: false, message: "User not found" };

    if (user.citizenProfile) {
      await prisma.citizenProfile.update({
        where: { id: user.citizenProfile.id },
        data: {
          fullName: data.name,
          blockHouse: data.address,
        },
      });
    } else if (user.agencyProfile) {
      await prisma.agencyProfile.update({
        where: { id: user.agencyProfile.id },
        data: {
          agencyName: data.name,
          address: data.address,
        },
      });
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    console.error("Update user error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return { success: false, message };
  }
}
