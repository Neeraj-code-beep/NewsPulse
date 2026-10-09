import dotenv from 'dotenv';
import { AppError } from '../utils/errors.js';
import { getAIConfig } from './ai.js';
import { getLiveNewsConfig } from './liveNews.js';

dotenv.config();

const DEFAULT_CLIENT_URL = 'http://localhost:5173';
const DEFAULT_NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const DEFAULT_NEWS_CACHE_TTL_MS = 900_000;
const DEFAULT_CACHE_MAX_ENTRIES = 1_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

const invalid = (name) => new AppError(`Invalid ${name} configuration.`, 500, 'CONFIGURATION_ERROR');
const integer = (value, name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(String(value))) throw invalid(name);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw invalid(name);
  return parsed;
};
const url = (value, name, fallback, { httpsOnly = false, originOnly = false } = {}) => {
  const candidate = value === undefined || value === '' ? fallback : String(value).trim();
  let parsed;
  try { parsed = new URL(candidate); } catch { throw invalid(name); }
  if (!['http:', 'https:'].includes(parsed.protocol) || (httpsOnly && parsed.protocol !== 'https:')) throw invalid(name);
  if ((originOnly && (parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password))
    || (!originOnly && (parsed.search || parsed.hash || parsed.username || parsed.password))) throw invalid(name);
  return originOnly ? parsed.origin : parsed.toString().replace(/\/$/, '');
};

export const buildConfig = (env = process.env) => {
  const NODE_ENV = env.NODE_ENV?.trim() || 'development';
  if (!['development', 'test', 'production'].includes(NODE_ENV)) throw invalid('NODE_ENV');
  const isProduction = NODE_ENV === 'production';
  const clientUrl = url(env.CLIENT_URL, 'CLIENT_URL', DEFAULT_CLIENT_URL, {
    originOnly: true
  });
  const newsApiBaseUrl = url(env.NEWS_API_BASE_URL, 'NEWS_API_BASE_URL', DEFAULT_NEWS_API_BASE_URL, { httpsOnly: true });
  const cacheTtlMs = integer(env.NEWS_CACHE_TTL_MS, 'NEWS_CACHE_TTL_MS', DEFAULT_NEWS_CACHE_TTL_MS, { min: 1_000, max: 30 * 24 * 60 * 60 * 1000 });
  const cacheMaxEntries = integer(env.CACHE_MAX_ENTRIES, 'CACHE_MAX_ENTRIES', DEFAULT_CACHE_MAX_ENTRIES, { min: 100, max: 10_000 });
  const port = integer(env.PORT, 'PORT', 5000, { min: 1, max: 65_535 });
  const trustProxyHops = integer(env.TRUST_PROXY_HOPS, 'TRUST_PROXY_HOPS', 0, { min: 0, max: 5 });
  const shutdownTimeoutMs = integer(env.SHUTDOWN_TIMEOUT_MS, 'SHUTDOWN_TIMEOUT_MS', DEFAULT_SHUTDOWN_TIMEOUT_MS, { min: 1_000, max: 60_000 });
  const ai = getAIConfig(env);
  const liveNews = getLiveNewsConfig(env);
  const config = {
    NODE_ENV,
    PORT: port,
    CLIENT_URL: clientUrl,
    TRUST_PROXY_HOPS: trustProxyHops,
    SHUTDOWN_TIMEOUT_MS: shutdownTimeoutMs,
    firebase: Object.freeze({
      projectId: env.FIREBASE_PROJECT_ID?.trim() || '',
      clientEmail: env.FIREBASE_CLIENT_EMAIL?.trim() || '',
      privateKey: env.FIREBASE_PRIVATE_KEY ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim() : ''
    }),
    newsApi: Object.freeze({
      apiKey: env.NEWS_API_KEY?.trim() || '',
      baseUrl: newsApiBaseUrl,
      cacheTtlMs
    }),
    cacheMaxEntries,
    ai,
    liveNews,
    isProduction
  };
  return Object.freeze(config);
};

export const validateProductionConfig = (config, env = process.env) => {
  if (!config.isProduction) return true;
  const missing = [];
  if (!config.CLIENT_URL || !env.CLIENT_URL?.trim()) missing.push('CLIENT_URL');
  if (env.CLIENT_URL?.trim() && new URL(config.CLIENT_URL).protocol !== 'https:') throw invalid('CLIENT_URL');
  if (!config.firebase.projectId) missing.push('FIREBASE_PROJECT_ID');
  if (config.firebase.projectId && !/^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$/i.test(config.firebase.projectId)) throw invalid('FIREBASE_PROJECT_ID');
  if (config.firebase.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.firebase.clientEmail)) throw invalid('FIREBASE_CLIENT_EMAIL');
  if (!config.firebase.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!config.firebase.privateKey) missing.push('FIREBASE_PRIVATE_KEY');
  else if (!config.firebase.privateKey.includes('-----BEGIN PRIVATE KEY-----') || !config.firebase.privateKey.includes('-----END PRIVATE KEY-----')) throw invalid('FIREBASE_PRIVATE_KEY');
  if (!config.newsApi.apiKey) missing.push('NEWS_API_KEY');
  if (!config.ai.apiKey) missing.push('GEMINI_API_KEY');
  if (missing.length) {
    throw new AppError(`Missing required production configuration: ${missing.join(', ')}.`, 500, 'PRODUCTION_CONFIGURATION_ERROR');
  }
  return true;
};

export const config = buildConfig();
