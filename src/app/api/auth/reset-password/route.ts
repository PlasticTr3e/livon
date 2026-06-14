import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError } from "@/lib/api-response";

export const runtime = "nodejs";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets a user's password using a valid password reset token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token from the reset link.
 *               password:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Validation failed, passwords do not match, or reset token is invalid or expired.
 *       500:
 *         description: Internal server error.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return badRequest("Validation failed", z.treeifyError(result.error));
    }

    const { token, password, confirmPassword } = result.data;

    if (password !== confirmPassword) {
      return badRequest("Password and confirmation do not match");
    }

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken || !resetToken.identifier.startsWith("password-reset:")) {
      return badRequest("Invalid or expired reset token");
    }

    if (resetToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return badRequest("Reset token has expired");
    }

    const email = resetToken.identifier.replace("password-reset:", "");
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await prisma.verificationToken.delete({
      where: { token },
    });

    return ok("Password reset successfully");
  } catch (error) {
    console.error("Reset Password Error:", error);
    return internalError("An error occurred while resetting password");
  }
}
