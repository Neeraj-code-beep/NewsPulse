import { recommendationService } from '../services/recommendation.service.js';

export class RecommendationController {
  constructor({ service = recommendationService } = {}) {
    this.service = service;
  }

  async getRelated(req, res, next) {
    try {
      const { article, limit } = req.recommendationInput;
      const data = await this.service.getRelatedNews(article, limit);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const recommendationController = new RecommendationController();
