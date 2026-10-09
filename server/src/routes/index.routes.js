import { Router } from 'express';
import { config } from '../config/env.js';
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

router.get('/health/ready', (req, res) => {
  const checks = {
    newsProviderConfigured: Boolean(config.newsApi.apiKey),
    firebaseAdminConfigured: Boolean(config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey),
    aiProviderConfigured: Boolean(config.ai.apiKey)
  };
  const ready = Object.values(checks).every(Boolean);
  const response = {
    success: ready,
    ...(ready
      ? { data: { status: 'ready', service: 'newspulse-api', checks, timestamp: new Date().toISOString() } }
      : { error: { code: 'NOT_READY', message: 'Required service configuration is incomplete.', details: { checks } } })
  };
  res.status(ready ? 200 : 503).json(response);
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
