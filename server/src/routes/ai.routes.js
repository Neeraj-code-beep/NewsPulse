import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { aiLimiter } from '../middleware/aiRateLimit.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateSummaryRequest } from '../middleware/aiValidation.middleware.js';

export const createAIRouter = ({ controller = aiController, auth = requireAuth, limiter = aiLimiter } = {}) => {
  const router = Router();
  router.post('/summarize', auth, limiter, validateSummaryRequest, (req, res, next) => {
    controller.summarize(req, res, next);
  });
  return router;
};

export default createAIRouter();
