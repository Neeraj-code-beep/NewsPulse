import test from 'node:test';
import assert from 'node:assert/strict';
import { CacheService } from '../services/cache.service.js';
import { config } from '../config/env.js';
import { RecommendationService, scoreArticleSimilarity } from '../services/recommendation.service.js';

const current = {
  id: 'current-id',
  title: 'NASA discovers water on Mars',
  description: 'Scientists find evidence of ancient water beneath the Martian surface',
  content: 'The discovery could help explain the planet climate and history.',
  source: { name: 'Space Daily' },
  url: 'https://example.test/current',
  publishedAt: '2026-10-01T00:00:00.000Z'
};
const closeCandidate = {
  title: 'Scientists discover water beneath Mars surface',
  description: 'NASA researchers report ancient water evidence on the Martian planet',
  content: 'The finding helps explain Mars climate and history.',
  source: { name: 'Space Daily' },
  url: 'https://example.test/related',
  publishedAt: '2026-10-02T00:00:00.000Z'
};
const unrelatedCandidate = {
  title: 'Local football team wins championship',
  description: 'Fans celebrate the season finale',
  source: { name: 'Space Daily' },
  url: 'https://example.test/unrelated',
  publishedAt: '2026-01-01T00:00:00.000Z'
};
const silentCache = () => new CacheService(60_000);

test('identical content scores highly while unrelated content scores low', () => {
  assert.ok(scoreArticleSimilarity(current, { ...current, url: 'https://example.test/copy' }) > 0.9);
  assert.ok(scoreArticleSimilarity(current, unrelatedCandidate) < 0.1);
});

test('title overlap contributes more than description overlap', () => {
  const titleMatch = { title: current.title, source: current.source };
  const descriptionMatch = { title: 'A completely different title', description: current.description, source: current.source };
  assert.ok(scoreArticleSimilarity(current, titleMatch) > scoreArticleSimilarity(current, descriptionMatch));
});

test('freshness cannot overwhelm strong relevance', () => {
  const oldRelated = { ...closeCandidate, publishedAt: '2025-01-01T00:00:00.000Z' };
  const newUnrelated = { ...unrelatedCandidate, publishedAt: '2026-10-03T00:00:00.000Z' };
  assert.ok(scoreArticleSimilarity(current, oldRelated) > scoreArticleSimilarity(current, newUnrelated));
});

test('query is compact and derived from article title and description', () => {
  const service = new RecommendationService({ news: {}, cache: silentCache() });
  const query = service.buildQuery(current);
  assert.ok(query.length <= 120);
  assert.match(query, /mars/);
  assert.match(query, /nasa/);
  assert.ok(query.split(' ').length <= 6);
});

test('current article and duplicate IDs, URLs, and title/source fallbacks are removed', () => {
  const service = new RecommendationService({ news: {}, cache: silentCache() });
  const candidates = [
    { ...current },
    { ...closeCandidate, id: 'duplicate-id', url: 'https://example.test/one' },
    { ...closeCandidate, id: 'duplicate-id', url: 'https://example.test/two' },
    { ...closeCandidate, id: 'other-id', url: 'https://example.test/one' },
    { ...closeCandidate, id: 'other-id-2', url: 'https://example.test/other' }
  ];
  const unique = service.deduplicateAndExclude(current, candidates);
  assert.equal(unique.length, 1);
  assert.equal(unique[0].url, 'https://example.test/one');
});

test('cache identity is deterministic, versioned, and isolated by requested limit', () => {
  const service = new RecommendationService({ news: {}, cache: silentCache() });
  const key = service.createCacheKey(current, 5);
  assert.match(key, /^related:v1:[a-f0-9]{64}:5$/);
  assert.equal(key, service.createCacheKey(current, 5));
  assert.notEqual(service.createCacheKey(current, 5), service.createCacheKey(current, 6));
});

test('service ranks, filters by threshold, limits results, and returns normalized articles', async () => {
  const strongest = { ...closeCandidate, title: `${current.title} research update`, description: current.description, url: 'https://example.test/strongest' };
  const news = { searchNews: async () => ({ articles: [unrelatedCandidate, closeCandidate, strongest] }) };
  const service = new RecommendationService({ news, cache: silentCache() });
  const result = await service.getRelatedNews(current, 1);
  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].url, strongest.url);
  assert.equal(typeof result.articles[0].score, 'number');
  assert.equal(Object.hasOwn(result.articles[0], 'content'), false);
  assert.equal(Object.hasOwn(result.articles[0], 'author'), false);
  assert.ok(result.articles[0].score >= 0.14);
});

test('minimum relevance threshold returns an empty list for weak candidates', async () => {
  const service = new RecommendationService({ news: { searchNews: async () => ({ articles: [unrelatedCandidate] }) }, cache: silentCache() });
  assert.deepEqual(await service.getRelatedNews(current), { articles: [] });
});

test('cache hit avoids another NewsAPI service call and cache expiry refreshes results', async () => {
  const originalNow = Date.now;
  let now = 10_000;
  Date.now = () => now;
  try {
    let calls = 0;
    const service = new RecommendationService({
      news: { searchNews: async () => { calls += 1; return { articles: [closeCandidate] }; } },
      cache: new CacheService()
    });
    await service.getRelatedNews(current);
    await service.getRelatedNews(current);
    assert.equal(calls, 1);
    now += config.newsApi.cacheTtlMs + 1;
    await service.getRelatedNews(current);
    assert.equal(calls, 2);
  } finally {
    Date.now = originalNow;
  }
});

test('concurrent requests share one candidate generation and clean up after success', async () => {
  let calls = 0;
  let release;
  const service = new RecommendationService({
    news: { searchNews: async () => { calls += 1; await new Promise((resolve) => { release = resolve; }); return { articles: [closeCandidate] }; } },
    cache: silentCache()
  });
  const requests = [service.getRelatedNews(current), service.getRelatedNews(current)];
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  release();
  const values = await Promise.all(requests);
  assert.deepEqual(values[0], values[1]);
  assert.equal(service.inFlightRequests.size, 0);
});

test('provider failure is mapped safely and in-flight entry is cleaned for retry', async () => {
  let calls = 0;
  const news = { searchNews: async () => { calls += 1; throw new Error('provider credential detail'); } };
  const service = new RecommendationService({ news, cache: silentCache() });
  await assert.rejects(service.getRelatedNews(current), (error) => {
    assert.equal(error.code, 'RECOMMENDATION_PROVIDER_ERROR');
    assert.doesNotMatch(error.message, /credential/);
    return true;
  });
  assert.equal(service.inFlightRequests.size, 0);
  news.searchNews = async () => ({ articles: [closeCandidate] });
  assert.equal((await service.getRelatedNews(current)).articles.length, 1);
  assert.equal(calls, 1);
});
