/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later.', details = null) {
    super(message, 429, 'RATE_LIMITED', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details = null) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}
