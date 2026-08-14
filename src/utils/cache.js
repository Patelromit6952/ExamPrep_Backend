import { getRedisClient } from "../config/redis.js";

const DEFAULT_TTL_SECONDS = 60;

/** Reads a JSON value from cache. Returns null on any failure or cache miss - never throws. */
export const cacheGet = async (key) => {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error(`Cache GET failed for "${key}":`, err.message);
    return null;
  }
};

/** Writes a JSON value to cache with a TTL. Silently no-ops on failure. */
export const cacheSet = async (
  key,
  value,
  ttlSeconds = DEFAULT_TTL_SECONDS
) => {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error(`Cache SET failed for "${key}":`, err.message);
  }
};

/** Deletes one or more exact keys. Silently no-ops on failure or if Redis is unavailable. */
export const cacheDel = async (...keys) => {
  const redis = getRedisClient();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.error("Cache DEL failed:", err.message);
  }
};

/**
 * Deletes every key matching a glob pattern (e.g. "exams:list:*"). Uses
 * SCAN rather than KEYS so it stays safe (non-blocking) even if the
 * dataset grows large.
 */
export const cacheDelPattern = async (pattern) => {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const keysToDelete = [];
    for await (const keys of stream) {
      keysToDelete.push(...keys);
    }
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (err) {
    console.error(`Cache DEL pattern failed for "${pattern}":`, err.message);
  }
};

/**
 * Read-through cache wrapper: returns the cached value if present,
 * otherwise calls `fetchFn`, caches its result, and returns it.
 * If Redis is unavailable, this transparently just calls `fetchFn` every
 * time - correctness NEVER depends on the cache being up; it's purely a
 * speed optimization layered on top of MongoDB, not a replacement for it.
 */
export const withCache = async (key, ttlSeconds, fetchFn) => {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const fresh = await fetchFn();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
};
