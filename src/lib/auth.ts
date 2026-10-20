import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Role } from "@/generated/prisma/enums";
import { getRedis } from "@/lib/redis";

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
  jti?: string;
  iat?: number;
  exp?: number;
}

// Longest lifetime of any issued token; bounds how long revocation markers must live.
const MAX_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return "fallback_dev_key";
}

export function signAuthToken(
  user: { id: string; email: string; role: Role | null },
  expiresIn: SignOptions["expiresIn"],
) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn, jwtid: randomUUID() },
  );
}

async function isRevoked(payload: AuthPayload) {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const [revokedToken, revokedBefore] = await redis.mget(
      `auth:revoked:${payload.jti ?? ""}`,
      `auth:revoked-before:${payload.userId}`,
    );
    if (payload.jti && revokedToken) return true;
    return (
      revokedBefore !== null && (payload.iat ?? 0) <= Number(revokedBefore)
    );
  } catch (error) {
    // Fail open: a Redis outage should not log every user out.
    console.warn("Token revocation check failed", error);
    return false;
  }
}

export async function getAuthUser(
  req: NextRequest,
): Promise<AuthPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
  } catch {
    return null;
  }

  return (await isRevoked(payload)) ? null : payload;
}

export async function revokeToken(payload: AuthPayload) {
  const redis = getRedis();
  if (!redis || !payload.jti || !payload.exp) return;

  const ttl = payload.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await redis.set(`auth:revoked:${payload.jti}`, "1", "EX", ttl);
}

/** Invalidates every token issued to the user up to now. */
export async function revokeAllUserTokens(userId: string) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(
      `auth:revoked-before:${userId}`,
      String(Math.floor(Date.now() / 1000)),
      "EX",
      MAX_TOKEN_TTL_SECONDS,
    );
  } catch (error) {
    console.warn(`Failed to revoke tokens for user ${userId}`, error);
  }
}
