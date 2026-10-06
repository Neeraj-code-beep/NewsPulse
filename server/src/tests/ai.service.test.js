import test from 'node:test';
import assert from 'node:assert/strict';
import { AIService } from '../services/ai.service.js';
import { CacheService } from '../services/cache.service.js';
import { getAIConfig, requireGeminiApiKey } from '../config/ai.js';

const config = (overrides = {}) => ({
  apiKey: 'test-key',
  model: 'gemini-test',
  cacheTtlMs: 1000,
  maxInputLength: 100,
  timeoutMs: 100,
  ...overrides
});
const article = { title: '  A story  ', description: 'A useful description', content: 'More details', url: 'https://example.test/story' };

test('AI configuration uses defaults and validates positive bounded numeric values', () => {
  assert.deepEqual(getAIConfig({}), {
    apiKey: '', model: 'gemini-3.5-flash-lite', cacheTtlMs: 86400000, maxInputLength: 12000, timeoutMs: 30000
  });
  assert.equal(getAIConfig({ AI_SUMMARY_TIMEOUT_MS: '2500' }).timeoutMs, 2500);
  for (const env of [
    { AI_SUMMARY_TIMEOUT_MS: '0' },
    { AI_SUMMARY_TIMEOUT_MS: '12ms' },
    { AI_SUMMARY_MAX_INPUT_LENGTH: '-2' },
    { AI_SUMMARY_CACHE_TTL_MS: '999999999999999999999' },
    { AI_SUMMARY_MAX_INPUT_LENGTH: '50001' }
  ]) {
    assert.throws(() => getAIConfig(env), { code: 'AI_CONFIGURATION_ERROR' });
  }
});

test('Gemini API key is required only when generation needs the provider', () => {
  assert.throws(() => requireGeminiApiKey(getAIConfig({})), {
    code: 'AI_CONFIGURATION_ERROR', statusCode: 503
  });
  assert.equal(requireGeminiApiKey(config()), 'test-key');
});

test('AI service calls provider on cache miss and returns a cached result without another call', async () => {
  let calls = 0;
  const cache = new CacheService();
  const service = new AIService({
    provider: { summarize: async () => { calls += 1; return '  A concise summary.  '; } },
    cache,
    configProvider: () => config()
  });
  assert.deepEqual(await service.summarize(article), { summary: 'A concise summary.', cached: false });
  assert.deepEqual(await service.summarize(article), { summary: 'A concise summary.', cached: true });
  assert.equal(calls, 1);
});

test('AI cache key is deterministic and changes with meaningful content', () => {
  const service = new AIService({ provider: {}, cache: new CacheService(), configProvider: () => config() });
  const a = service.normalizeArticle(article).normalized;
  const b = service.normalizeArticle({ ...article }).normalized;
  const changed = service.normalizeArticle({ ...article, description: 'Changed description' }).normalized;
  assert.match(service.createCacheKey(a), /^ai:summary:[a-f0-9]{64}$/);
  assert.equal(service.createCacheKey(a), service.createCacheKey(b));
  assert.notEqual(service.createCacheKey(a), service.createCacheKey(changed));
  assert.ok(!service.createCacheKey(a).includes(article.content));
});

test('AI input is bounded by preserving title and description and safely truncating content', () => {
  const service = new AIService({ provider: {}, cache: new CacheService(), configProvider: () => config({ maxInputLength: 30 }) });
  const { normalized, text } = service.normalizeArticle({ title: 'Title', description: 'Description', content: 'x'.repeat(100) });
  assert.equal(text.length, 30);
  assert.equal(normalized.title, 'Title');
  assert.equal(normalized.description, 'Description');
  assert.equal(normalized.content.length, 12);
  assert.throws(() => service.normalizeArticle({ title: 'x'.repeat(101), description: 'More' }), { code: 'AI_VALIDATION_ERROR' });
});

test('AI service regenerates summaries after cache expiry using configured TTL', async () => {
  let calls = 0;
  const originalNow = Date.now;
  let now = 1000;
  Date.now = () => now;
  try {
    const service = new AIService({
      provider: { summarize: async () => `Summary ${++calls}` },
      cache: new CacheService(),
      configProvider: () => config({ cacheTtlMs: 50 })
    });
    assert.equal((await service.summarize(article)).summary, 'Summary 1');
    now += 51;
    assert.equal((await service.summarize(article)).summary, 'Summary 2');
    assert.equal(calls, 2);
  } finally {
    Date.now = originalNow;
  }
});

test('concurrent identical AI requests share one provider generation', async () => {
  let calls = 0;
  let release;
  const service = new AIService({
    provider: { summarize: async () => { calls += 1; await new Promise((resolve) => { release = resolve; }); return 'Shared summary'; } },
    cache: new CacheService(),
    configProvider: () => config()
  });
  const first = service.summarize(article);
  const second = service.summarize({ ...article });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  release();
  assert.deepEqual(await Promise.all([first, second]), [
    { summary: 'Shared summary', cached: false },
    { summary: 'Shared summary', cached: false }
  ]);
  assert.equal(service.inFlightRequests.size, 0);
});

test('AI in-flight entry is removed after provider failure and can be retried', async () => {
  let calls = 0;
  const service = new AIService({
    provider: { summarize: async () => { calls += 1; throw new Error('private provider detail'); } },
    cache: new CacheService(),
    configProvider: () => config()
  });
  await assert.rejects(service.summarize(article), /private provider detail/);
  assert.equal(service.inFlightRequests.size, 0);
  service.provider.summarize = async () => { calls += 1; return 'Recovered'; };
  assert.equal((await service.summarize(article)).summary, 'Recovered');
  assert.equal(calls, 2);
});
