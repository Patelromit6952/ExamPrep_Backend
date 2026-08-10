import rateLimit from "express-rate-limit";

/**
 * General API limiter: generous, protects against basic abuse/DoS.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    data: null,
  },
});

/**
 * Stricter limiter for auth routes to slow down brute-force login/register attempts.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    data: null,
  },
});
