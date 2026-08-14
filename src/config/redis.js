import Redis from "ioredis";

let client = null;
let connectionAttempted = false;

/**
 * Lazily creates a single reusable Redis client from REDIS_URL. Returns
 * null if REDIS_URL isn't set, or if a prior connection attempt already
 * failed to construct - every caller (cache.js, rate limiter) MUST treat a
 * null return as "no cache available right now, just hit the database".
 * Redis is purely a performance layer here, never a hard dependency: the
 * app is fully functional with REDIS_URL unset.
 */
export const getRedisClient = () => {
  if (client) return client;
  if (connectionAttempted) return null;
  connectionAttempted = true;

  if (!process.env.REDIS_URL) {
    console.log(
      "REDIS_URL not set - running without a cache layer (everything still works, just uncached)."
    );
    return null;
  }

  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000)
  });

  client.on("connect", () => {
    console.log("Redis connected - response caching is active.");
  });

  client.on("error", (err) => {
    // ioredis retries connection errors on its own; just log, never crash
    // the request that triggered this - cache.js already wraps every call
    // in try/catch so a Redis outage degrades to "uncached", not downtime.
    console.error("Redis error:", err.message);
  });

  return client;
};

/** Used on graceful shutdown so the process doesn't hang on an open socket. */
export const closeRedisClient = async () => {
  if (client) {
    await client.quit().catch(() => {});
    client = null;
  }
};
