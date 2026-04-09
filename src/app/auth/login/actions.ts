"use server";

import prisma from "@/lib/prisma";

export async function checkUserVerification(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { citizenProfile: true, agencyProfile: true },
    });

    if (!user) return false;

    if (user.citizenProfile) {
      return user.citizenProfile.isVerified === true;
    }

    if (user.agencyProfile) {
      return user.agencyProfile.isVerified === true;
    }

    // If neither profile exists, let them pass (could be Admin or internal testing)
    return true;
  } catch (e) {
    console.error("Check user verification error:", e);
    return false;
  }
}
