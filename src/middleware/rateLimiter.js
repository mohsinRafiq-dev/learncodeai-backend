// Lightweight in-memory rate limiter (no external deps).
// For multi-instance deployments swap the store for Redis.

const buckets = new Map();

function getKey(req, scope) {
  const userId = req.user?._id?.toString();
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  return `${scope}:${userId || ip}`;
}

export function rateLimit({ windowMs = 60_000, max = 30, scope = "default" } = {}) {
  // Periodic cleanup so the map doesn't grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }, windowMs).unref?.();

  return (req, res, next) => {
    const key = getKey(req, scope);
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - bucket.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        success: false,
        message: `Too many requests. Try again in ${retryAfterSec}s.`,
      });
    }
    next();
  };
}

// Pre-baked limiters for common scopes
export const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, scope: "auth" });
export const codeExecLimiter = rateLimit({ windowMs: 60_000, max: 30, scope: "code-exec" });
export const aiLimiter = rateLimit({ windowMs: 60_000, max: 20, scope: "ai" });
export const expensiveAiLimiter = rateLimit({ windowMs: 60 * 60_000, max: 30, scope: "ai-expensive" });
