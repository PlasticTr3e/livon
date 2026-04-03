import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { Role } from "@/generated/prisma/enums";

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

export function getAuthUser(req: NextRequest): AuthPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_super_secret_dev_key",
    ) as AuthPayload;
  } catch {
    return null;
  }
}
