import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

const VALID_ERROR_STATUSES = new Set([400, 401, 403, 404, 408, 409, 413, 415, 422, 429, 502, 503, 504]);

export const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const isAiSummaryRequest = req.originalUrl.startsWith('/api/v1/ai/summarize');
  const isOversizedBody = err.type === 'entity.too.large';
  const isExcessiveParameters = err.type === 'parameters.too.many';
  const isMalformedJson = err instanceof SyntaxError
    && err.status === 400
    && Object.prototype.hasOwnProperty.call(err, 'body');
  const isUnsupportedBody = ['charset.unsupported', 'encoding.unsupported'].includes(err.type);
  const isAppError = err instanceof AppError;
  const candidateStatus = isOversizedBody || isExcessiveParameters ? 413
    : isMalformedJson ? 400
      : isUnsupportedBody ? 415
        : isAppError ? err.statusCode
          : err.statusCode;
  const statusCode = VALID_ERROR_STATUSES.has(candidateStatus) ? candidateStatus : 500;
  const code = isOversizedBody
    ? (isAiSummaryRequest ? 'AI_VALIDATION_ERROR' : 'PAYLOAD_TOO_LARGE')
    : isExcessiveParameters ? 'PAYLOAD_TOO_LARGE'
    : isMalformedJson ? 'VALIDATION_ERROR'
      : isUnsupportedBody ? 'UNSUPPORTED_MEDIA_TYPE'
        : isAppError && typeof err.code === 'string' ? err.code
          : statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
  const message = isOversizedBody
    ? isAiSummaryRequest ? 'Article summary request is too large.' : 'Request body is too large.'
    : isExcessiveParameters ? 'Too many form parameters.'
    : isMalformedJson ? 'Malformed JSON request body'
      : isUnsupportedBody ? 'Unsupported request encoding.'
        : statusCode >= 500 && config.isProduction ? 'Service temporarily unavailable.'
          : isAppError ? err.message : config.isProduction ? 'Something went wrong' : (err.message || 'Something went wrong');

  logger.error('Request failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode,
    code,
    errorType: typeof err?.name === 'string' ? err.name : 'Error'
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(req.requestId ? { requestId: req.requestId } : {})
    }
  });
};
