import { Router } from 'express';
import { recommendationController } from '../controllers/recommendation.controller.js';
import { validateRecommendationRequest } from '../middleware/recommendationValidation.middleware.js';

export const createRecommendationRouter = ({ controller = recommendationController, validate = validateRecommendationRequest } = {}) => {
  const router = Router();
  router.post('/', validate, (req, res, next) => controller.getRelated(req, res, next));
  return router;
};

export default createRecommendationRouter();
