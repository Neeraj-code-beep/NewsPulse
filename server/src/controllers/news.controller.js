import { newsService } from '../services/news.service.js';

class NewsController {
  /**
   * Controller for GET /api/v1/news/top-headlines
   */
  async getTopHeadlines(req, res, next) {
    try {
      const data = await newsService.getTopHeadlines(req.query);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller for GET /api/v1/news/search
   */
  async searchNews(req, res, next) {
    try {
      const data = await newsService.searchNews(req.query);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

export const newsController = new NewsController();
export { NewsController };
