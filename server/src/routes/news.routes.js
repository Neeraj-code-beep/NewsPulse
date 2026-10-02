import { Router } from 'express';
import { newsController } from '../controllers/news.controller.js';
import { validateTopHeadlines, validateSearch } from '../middleware/validate.middleware.js';

const router = Router();

/**
 * GET /api/v1/news/top-headlines
 */
router.get('/top-headlines', validateTopHeadlines, (req, res, next) => {
  newsController.getTopHeadlines(req, res, next);
});

/**
 * GET /api/v1/news/search
 */
router.get('/search', validateSearch, (req, res, next) => {
  newsController.searchNews(req, res, next);
});

export default router;
