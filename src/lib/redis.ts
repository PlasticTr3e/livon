import Redis from "ioredis";

const globalForRedis = global as unknown as { redis?: Redis | null };

/**
 * Returns null when REDIS_URL is unset. Callers treat Redis as optional and
 * fall back to the database or skip the check when a command fails.
 */
export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRedis.redis = null;
    return null;
  }

  const client = new Redis(url, {
    // Fail fast instead of queueing commands while Redis is unreachable.
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
  });
  client.on("error", (error) => console.warn("Redis error:", error.message));

  globalForRedis.redis = client;
  return client;
}
