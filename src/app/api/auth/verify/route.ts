import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { badRequest, notFound } from "@/lib/api-response";

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify user email
 *     description: Verifies a user's email address using a verification token sent to their email.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token
 *     responses:
 *       302:
 *         description: Redirects to the login page on success with a `verified=true` query parameter.
 *       400:
 *         description: Bad Request. Returned if the token is missing, invalid, or expired.
 *       404:
 *         description: Internal Server Error occurred.
 */
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
