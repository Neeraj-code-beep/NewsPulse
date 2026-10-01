import { Router } from 'express';

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

export default router;
