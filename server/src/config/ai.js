import { AppError } from '../utils/errors.js';

const DEFAULTS = Object.freeze({
  model: 'gemini-3.5-flash-lite',
  cacheTtlMs: 24 * 60 * 60 * 1000,
  maxInputLength: 12000,
  timeoutMs: 30000
});

const positiveInteger = (value, fallback, name, maximum) => {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) {
    throw new AppError(`Invalid ${name} configuration`, 500, 'AI_CONFIGURATION_ERROR');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > maximum) {
    throw new AppError(`Invalid ${name} configuration`, 500, 'AI_CONFIGURATION_ERROR');
  }
  return parsed;
};

export const getAIConfig = (env = process.env) => {
  const model = typeof env.AI_MODEL === 'string' && env.AI_MODEL.trim()
    ? env.AI_MODEL.trim()
    : DEFAULTS.model;
  if (model.length > 100) {
    throw new AppError('Invalid AI_MODEL configuration', 500, 'AI_CONFIGURATION_ERROR');
  }

  return Object.freeze({
    apiKey: typeof env.GEMINI_API_KEY === 'string' ? env.GEMINI_API_KEY.trim() : '',
    model,
    cacheTtlMs: positiveInteger(env.AI_SUMMARY_CACHE_TTL_MS, DEFAULTS.cacheTtlMs, 'AI_SUMMARY_CACHE_TTL_MS', 30 * 24 * 60 * 60 * 1000),
    maxInputLength: positiveInteger(env.AI_SUMMARY_MAX_INPUT_LENGTH, DEFAULTS.maxInputLength, 'AI_SUMMARY_MAX_INPUT_LENGTH', 50000),
    timeoutMs: positiveInteger(env.AI_SUMMARY_TIMEOUT_MS, DEFAULTS.timeoutMs, 'AI_SUMMARY_TIMEOUT_MS', 120000)
  });
};

export const requireGeminiApiKey = (config = getAIConfig()) => {
  if (!config.apiKey) {
    throw new AppError('AI summarization is not configured', 503, 'AI_CONFIGURATION_ERROR');
  }
  return config.apiKey;
};
