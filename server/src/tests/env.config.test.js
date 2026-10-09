import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConfig, validateProductionConfig } from '../config/env.js';

const productionEnv = {
  NODE_ENV: 'production',
  PORT: '8080',
  CLIENT_URL: 'https://news.example.com',
  TRUST_PROXY_HOPS: '1',
  FIREBASE_PROJECT_ID: 'newspulse-production',
  FIREBASE_CLIENT_EMAIL: 'firebase-admin@newspulse-production.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nvalid-private-key\\n-----END PRIVATE KEY-----',
  NEWS_API_KEY: 'test-news-key',
  NEWS_API_BASE_URL: 'https://newsapi.org/v2',
  NEWS_CACHE_TTL_MS: '60000',
  GEMINI_API_KEY: 'test-gemini-key',
  AI_MODEL: 'gemini-test',
  AI_SUMMARY_CACHE_TTL_MS: '3600000',
  AI_SUMMARY_MAX_INPUT_LENGTH: '12000',
  AI_SUMMARY_TIMEOUT_MS: '30000',
  LIVE_NEWS_ENABLED: 'false',
  LIVE_NEWS_POLL_INTERVAL_MS: '900000',
  LIVE_NEWS_PAGE_SIZE: '20',
  LIVE_NEWS_SEEN_LIMIT: '500',
  SHUTDOWN_TIMEOUT_MS: '10000',
  CACHE_MAX_ENTRIES: '1000'
};

test('central configuration normalizes production settings and accepts complete production credentials', () => {
  const config = buildConfig(productionEnv);
  assert.equal(config.PORT, 8080);
  assert.equal(config.CLIENT_URL, 'https://news.example.com');
  assert.equal(config.TRUST_PROXY_HOPS, 1);
  assert.equal(config.firebase.privateKey.includes('\\n'), false);
  assert.equal(config.liveNews.enabled, false);
  assert.equal(config.ai.timeoutMs, 30000);
  assert.equal(validateProductionConfig(config, productionEnv), true);
});

test('production startup validation rejects each missing server secret without revealing values', () => {
  const env = { ...productionEnv };
  delete env.GEMINI_API_KEY;
  delete env.NEWS_API_KEY;
  delete env.FIREBASE_PRIVATE_KEY;
  const config = buildConfig(env);
  assert.throws(() => validateProductionConfig(config, env), (error) => {
    assert.equal(error.code, 'PRODUCTION_CONFIGURATION_ERROR');
    assert.match(error.message, /NEWS_API_KEY/);
    assert.match(error.message, /GEMINI_API_KEY/);
    assert.match(error.message, /FIREBASE_PRIVATE_KEY/);
    assert.doesNotMatch(error.message, /test-news-key|test-gemini-key|valid-private-key/);
    return true;
  });
});

test('configuration rejects invalid modes, ports, URLs, TTLs, proxy hops, and live polling values', () => {
  for (const env of [
    { NODE_ENV: 'staging' },
    { PORT: '5000abc' },
    { PORT: '65536' },
    { CLIENT_URL: 'https://example.test/path' },
    { NEWS_API_BASE_URL: 'http://newsapi.org/v2' },
    { NEWS_CACHE_TTL_MS: '0' },
    { TRUST_PROXY_HOPS: 'true' },
    { LIVE_NEWS_POLL_INTERVAL_MS: '1000' },
    { AI_SUMMARY_TIMEOUT_MS: '0' }
  ]) {
    assert.throws(() => buildConfig(env), { statusCode: 500 });
  }
});

test('production requires an HTTPS frontend origin', () => {
  const env = { ...productionEnv, CLIENT_URL: 'http://news.example.com' };
  assert.throws(() => validateProductionConfig(buildConfig(env), env), {
    code: 'CONFIGURATION_ERROR'
  });
  const emptyOriginEnv = { ...productionEnv, CLIENT_URL: '' };
  assert.throws(() => validateProductionConfig(buildConfig(emptyOriginEnv), emptyOriginEnv), {
    code: 'PRODUCTION_CONFIGURATION_ERROR'
  });
});
