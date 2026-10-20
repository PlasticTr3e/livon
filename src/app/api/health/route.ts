import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// Used by the container healthcheck. Redis is reported but never fails the check, since the app runs without it.
export async function GET() {
  const checks: Record<string, "ok" | "down" | "disabled"> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "down";
  }

  const redis = getRedis();
  if (!redis) {
    checks.redis = "disabled";
  } else {
    try {
      await redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "down";
    }
  }

  const healthy = checks.database === "ok";
  return NextResponse.json(
    { status: healthy ? "ok" : "error", checks },
    { status: healthy ? 200 : 503 },
  );
}
