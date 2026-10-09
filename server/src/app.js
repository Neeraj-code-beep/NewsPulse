import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { AppError } from './utils/errors.js';
import { createCorsOptions } from './config/cors.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import v1Router from './routes/index.routes.js';

const app = express();

if (config.TRUST_PROXY_HOPS > 0) app.set('trust proxy', config.TRUST_PROXY_HOPS);

// Security headers
app.use(helmet());

app.use(requestIdMiddleware);

// CORS configuration
app.use(
  cors(createCorsOptions(config.CLIENT_URL))
);


// Body parsing
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb', parameterLimit: 100 }));
app.set('query parser', (query) => {
  const parsed = new URLSearchParams(query);
  const result = Object.create(null);
  let count = 0;
  for (const [key, value] of parsed) {
    if (++count > 50) throw new AppError('Too many query parameters.', 400, 'VALIDATION_ERROR');
    if (Object.hasOwn(result, key)) {
      result[key] = Array.isArray(result[key]) ? [...result[key], value] : [result[key], value];
    } else {
      result[key] = value;
    }
  }
  return result;
});

// Rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api/v1', v1Router);

// 404 handler
app.use(notFoundMiddleware);

// Centralized error handler
app.use(errorMiddleware);

export default app;
