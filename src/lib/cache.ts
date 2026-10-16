import { getRedis } from "@/lib/redis";

export type CacheNamespace =
  | "projects"
  | "priority"
  | "news"
  | "categories"
  | "dashboard";

const versionKey = (namespace: CacheNamespace) => `cache:version:${namespace}`;

/**
 * Read-through cache for API response data. Values round-trip through JSON,
 * so only cache what is about to be serialized into the response anyway.
 */
export async function cached<T>(
  namespace: CacheNamespace,
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return load();

  let entryKey: string | null = null;
  try {
    const version = (await redis.get(versionKey(namespace))) ?? "0";
    entryKey = `cache:${namespace}:v${version}:${key}`;
    const hit = await redis.get(entryKey);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch (error) {
    console.warn(`Cache read failed for ${namespace}:${key}`, error);
  }

  const value = await load();

  if (entryKey && value !== undefined) {
    redis
      .set(entryKey, JSON.stringify(value), "EX", ttlSeconds)
      .catch((error) =>
        console.warn(`Cache write failed for ${namespace}:${key}`, error),
      );
  }

  return value;
}

/**
 * Bumping the namespace version orphans every entry under it; they expire on their own TTL.
 */
export async function invalidate(...namespaces: CacheNamespace[]) {
  const redis = getRedis();
  if (!redis) return;

  try {
    await Promise.all(namespaces.map((ns) => redis.incr(versionKey(ns))));
  } catch (error) {
    console.warn(
      `Cache invalidation failed for ${namespaces.join(",")}`,
      error,
    );
  }
}
