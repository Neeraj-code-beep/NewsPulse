import { aiService } from '../services/ai.service.js';

export class AIController {
  constructor({ service = aiService } = {}) {
    this.service = service;
  }

  async summarize(req, res, next) {
    try {
      const data = await this.service.summarize(req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
