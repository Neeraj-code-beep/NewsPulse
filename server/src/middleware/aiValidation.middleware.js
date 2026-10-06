import { AppError } from '../utils/errors.js';

const invalidRequest = (message = 'Invalid article summary request.') =>
  new AppError(message, 400, 'AI_VALIDATION_ERROR');

export const validateSummaryRequest = (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalidRequest();

  const allowed = new Set(['title', 'description', 'content', 'url']);
  if (Object.keys(body).some((key) => !allowed.has(key))) throw invalidRequest('Unexpected article summary field.');
  if (typeof body.title !== 'string' || !body.title.trim()) throw invalidRequest();
  if (body.description !== undefined && typeof body.description !== 'string') throw invalidRequest();
  if (body.content !== undefined && typeof body.content !== 'string') throw invalidRequest();
  if (body.url !== undefined && typeof body.url !== 'string') throw invalidRequest();
  if (!(body.description?.trim() || body.content?.trim())) throw invalidRequest();

  if (body.title.length > 1000 || body.description?.length > 10000 || body.content?.length > 50000) {
    throw invalidRequest('Article text exceeds the request size limit.');
  }
  if (body.url !== undefined) {
    if (body.url.length > 2048) throw invalidRequest('Article URL is too long.');
    try {
      const url = new URL(body.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL protocol');
    } catch {
      throw invalidRequest('Article URL must be a valid HTTP or HTTPS URL.');
    }
  }

  next();
};
