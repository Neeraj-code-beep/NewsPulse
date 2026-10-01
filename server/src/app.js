import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import v1Router from './routes/index.routes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api/v1', v1Router);

// 404 handler
app.use(notFoundMiddleware);

// Centralized error handler
app.use(errorMiddleware);

export default app;
