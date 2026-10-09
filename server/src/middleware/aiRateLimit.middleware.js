import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('AI rate limit reached', { requestId: req.requestId, path: req.path });
    return res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMITED',
        message: 'Too many summary requests. Please try again later.',
        ...(req.requestId ? { requestId: req.requestId } : {})
      }
    });
  }
});
