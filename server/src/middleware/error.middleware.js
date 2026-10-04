import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export const errorMiddleware = (err, req, res, next) => {
  const isMalformedJson = err instanceof SyntaxError
    && err.status === 400
    && Object.prototype.hasOwnProperty.call(err, 'body');
  const isAppError = err instanceof AppError;
  const statusCode = isMalformedJson ? 400 : (isAppError && err.statusCode ? err.statusCode : (err.statusCode || 500));
  const code = isMalformedJson ? 'VALIDATION_ERROR' : (isAppError && err.code ? err.code : (err.code || 'INTERNAL_ERROR'));
  const message = isMalformedJson
    ? 'Malformed JSON request body'
    : (isAppError || !config.isProduction ? (err.message || 'Something went wrong') : 'Something went wrong');

  // Log error details on server
  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} [${code}]: ${err.message}`, err.stack || '');

  const responseBody = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (isAppError && err.details) {
    responseBody.error.details = err.details;
  }

  res.status(statusCode).json(responseBody);
};
