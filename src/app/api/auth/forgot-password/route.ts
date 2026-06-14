// src/app/api/auth/forgot-password/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError } from "@/lib/api-response";

export const runtime = "nodejs";

const forgotPasswordSchema = z.object({
  email: z.email(),
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset link to the user's email if the account exists.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset request processed. The response is the same whether or not the email exists.
 *       400:
 *         description: Validation failed.
 *       500:
 *         description: Internal server error.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return badRequest("Validation failed", z.treeifyError(result.error));
    }

    const { email } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return ok("If the email exists, a password reset link has been sent");
    }

    const identifier = `password-reset:${email}`;
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Livon App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset your Livon password",
      html: `
        <h2>Reset your password</h2>
        <p>Click the link below to create a new password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return ok("If the email exists, a password reset link has been sent");
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return internalError("An error occurred while requesting password reset");
  }
}
