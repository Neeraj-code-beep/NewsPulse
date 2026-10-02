import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

export default router;
