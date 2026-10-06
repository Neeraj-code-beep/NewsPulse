import { Router } from 'express';
import authRouter from './auth.routes.js';
import newsRouter from './news.routes.js';
import aiRouter from './ai.routes.js';

const router = Router();

/**
 * Root API endpoint
 * GET /api/v1
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'NewsPulse API',
      version: 'v1'
    }
  });
});

/**
 * Health check endpoint
 * GET /api/v1/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'newspulse-api',
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * News routes
 * Mounts under /api/v1/news
 */
router.use('/news', newsRouter);

/**
 * Authentication routes
 * Mounts under /api/v1/auth
 */
router.use('/auth', authRouter);

/** AI routes */
router.use('/ai', aiRouter);

export default router;
