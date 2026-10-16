import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import type { ApiError } from "@/lib/api-types";

type RateLimitRule = {
  name: string;
  limit: number;
  windowSeconds: number;
};

export const RATE_LIMITS = {
  login: { name: "login", limit: 10, windowSeconds: 300 },
  register: { name: "register", limit: 5, windowSeconds: 3600 },
  forgotPassword: { name: "forgot-password", limit: 5, windowSeconds: 3600 },
  resetPassword: { name: "reset-password", limit: 10, windowSeconds: 3600 },
  upload: { name: "upload", limit: 30, windowSeconds: 600 },
  comment: { name: "comment", limit: 10, windowSeconds: 60 },
  vote: { name: "vote", limit: 30, windowSeconds: 60 },
  donation: { name: "donation", limit: 10, windowSeconds: 600 },
} satisfies Record<string, RateLimitRule>;

// Nginx overwrites X-Real-IP, so it can be trusted; the app port is not exposed directly.
export function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/**
 * Fixed-window limiter. Returns a 429 response when the caller is over the
 * limit, or null to continue. Allows the request if Redis is unavailable.
 */
export async function rateLimit(
  rule: RateLimitRule,
  identifier: string,
): Promise<NextResponse | null> {
  const redis = getRedis();
  if (!redis) return null;

  const window = Math.floor(Date.now() / 1000 / rule.windowSeconds);
  const key = `ratelimit:${rule.name}:${identifier}:${window}`;

  try {
    const [[, count]] = (await redis
      .multi()
      .incr(key)
      .expire(key, rule.windowSeconds)
      .exec()) as [[Error | null, number]];

    if (count <= rule.limit) return null;
  } catch (error) {
    console.warn(`Rate limit check failed for ${rule.name}`, error);
    return null;
  }

  const retryAfter =
    (window + 1) * rule.windowSeconds - Math.floor(Date.now() / 1000);
  const payload: ApiError = {
    success: false,
    message: "Too many requests. Please try again later.",
  };
  return NextResponse.json(payload, {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}
