import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError } from "@/lib/api-response";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback__dev_key";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return badRequest("Validation failed", result.error.flatten());
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
