import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError } from "@/lib/api-response";

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_key";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful with Token
 *       400:
 *         description: Invalid credentials or validation failed
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return badRequest("Validation failed", z.treeifyError(result.error));
    }

    const { email, password } = result.data;

    // Find User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return badRequest("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return badRequest("Invalid credentials");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    return ok("Login successful", {
      data: {
        token,
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return internalError("An error occurred during login");
  }
}
