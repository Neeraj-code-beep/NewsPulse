import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const cacheTtlValue = process.env.NEWS_CACHE_TTL_MS || '';
const cacheTtlMs = /^\d+$/.test(cacheTtlValue) && Number.isSafeInteger(Number(cacheTtlValue)) && Number(cacheTtlValue) > 0
  ? Number(cacheTtlValue)
  : 900000;

export const config = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: isNaN(port) ? 5000 : port,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  firebase: Object.freeze({
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : ''
  }),
  newsApi: Object.freeze({
    apiKey: process.env.NEWS_API_KEY || '',
    baseUrl: process.env.NEWS_API_BASE_URL || 'https://newsapi.org/v2',
    cacheTtlMs
  }),
  isProduction: (process.env.NODE_ENV || 'development') === 'production'
});
