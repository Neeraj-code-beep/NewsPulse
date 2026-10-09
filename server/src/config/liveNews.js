const DEFAULTS = Object.freeze({
  enabled: true,
  pollIntervalMs: 900_000,
  pageSize: 20,
  seenLimit: 500
});

const parseBoundedInteger = (value, name, fallback, minimum, maximum) => {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) throw new AppError(`Invalid ${name} configuration.`, 500, 'CONFIGURATION_ERROR');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new AppError(`Invalid ${name} configuration.`, 500, 'CONFIGURATION_ERROR');
  }
  return parsed;
};

export const getLiveNewsConfig = (env = process.env) => {
  const enabledValue = String(env.LIVE_NEWS_ENABLED ?? 'true').trim().toLowerCase();
  if (!['true', 'false', '1', '0', 'yes', 'no'].includes(enabledValue)) {
    throw new AppError('Invalid LIVE_NEWS_ENABLED configuration.', 500, 'CONFIGURATION_ERROR');
  }
  return Object.freeze({
    enabled: !['false', '0', 'no'].includes(enabledValue),
    pollIntervalMs: parseBoundedInteger(env.LIVE_NEWS_POLL_INTERVAL_MS, 'LIVE_NEWS_POLL_INTERVAL_MS', DEFAULTS.pollIntervalMs, 60_000, 3_600_000),
    pageSize: parseBoundedInteger(env.LIVE_NEWS_PAGE_SIZE, 'LIVE_NEWS_PAGE_SIZE', DEFAULTS.pageSize, 1, 50),
    seenLimit: parseBoundedInteger(env.LIVE_NEWS_SEEN_LIMIT, 'LIVE_NEWS_SEEN_LIMIT', DEFAULTS.seenLimit, 50, 5_000)
  });
};

export const liveNewsConfig = getLiveNewsConfig();
import { AppError } from '../utils/errors.js';
