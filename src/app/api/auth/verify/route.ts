import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { badRequest, notFound } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return badRequest("Mising verification token");
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return badRequest("Invalid or expired token");
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return badRequest(
        "Token has expired. Please register again or request a new link",
      );
    }

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: { token },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/login?verified=true`);
  } catch (error) {
    console.error("Verification Error:", error);
    return notFound("An internal server error occurred");
  }
}
