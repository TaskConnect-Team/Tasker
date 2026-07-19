import { rateLimit } from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  max: parseInt(process.env.AI_RATE_LIMIT_MAX) || 10,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait before trying again.',
    retryAfter: Math.ceil((parseInt(process.env.AI_RATE_LIMIT_WINDOW) || 900000) / 1000 / 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for embedding (more expensive)
export const embeddingRateLimiter = rateLimit({
  windowMs: 300000, // 5 minutes
  max: 25, // Only 25 embedding requests per window
  message: {
    success: false,
    message: 'Too many AI embedding requests. Please wait.',
  },
});
