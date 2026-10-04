import test from 'node:test';
import assert from 'node:assert/strict';
import { NewsService } from '../services/news.service.js';
import { CacheService } from '../services/cache.service.js';

const silentLogger = { error() {}, info() {}, warn() {} };
const article = { title: 'Example story', url: 'https://news.example/story', publishedAt: '2026-10-01T00:00:00Z' };

test('news service forwards requested pagination and preserves pagination metadata', async () => {
  let received;
  const client = {
    search: async (params) => {
      received = params;
      return { status: 'ok', totalResults: 80, articles: [article] };
    }
  };
  const service = new NewsService({ client, cache: new CacheService(), logger: silentLogger });
  const result = await service.searchNews({ q: 'world', page: 3, pageSize: 7, sortBy: 'popularity' });

  assert.deepEqual(received, { q: 'world', sortBy: 'popularity', page: 3, pageSize: 7 });
  assert.equal(result.page, 3);
  assert.equal(result.pageSize, 7);
  assert.equal(result.totalResults, 80);
  assert.equal(result.articles[0].url, article.url);
});

test('news service normalizes article identity deterministically', async () => {
  const service = new NewsService({ cache: new CacheService(), logger: silentLogger });
  const normalizedA = service.normalizeArticle(article);
  const normalizedB = service.normalizeArticle({ ...article });
  assert.equal(normalizedA.id, normalizedB.id);
  assert.equal(normalizedA.id.length, 64);
  assert.equal(normalizedA.title, article.title);
});

test('news service isolates cached responses by pagination parameters', async () => {
  const receivedPages = [];
  const client = {
    getTopHeadlines: async ({ page, pageSize }) => {
      receivedPages.push([page, pageSize]);
      return { status: 'ok', articles: [{ ...article, title: `Page ${page}` }] };
    }
  };
  const service = new NewsService({ client, cache: new CacheService(), logger: silentLogger });
  const first = await service.getTopHeadlines({ country: 'us', page: 1, pageSize: 5 });
  const second = await service.getTopHeadlines({ country: 'us', page: 2, pageSize: 5 });
  assert.deepEqual(receivedPages, [[1, 5], [2, 5]]);
  assert.equal(first.articles[0].title, 'Page 1');
  assert.equal(second.articles[0].title, 'Page 2');
});

test('concurrent identical requests share one provider call and a successful result', async () => {
  let providerCalls = 0;
  let releaseProvider;
  const client = {
    search: async () => {
      providerCalls += 1;
      await new Promise((resolve) => { releaseProvider = resolve; });
      return { status: 'ok', articles: [article] };
    }
  };
  const service = new NewsService({ client, cache: new CacheService(), logger: silentLogger });
  const request = { q: 'shared', page: 1, pageSize: 10 };
  const results = [service.searchNews(request), service.searchNews(request), service.searchNews(request)];
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(providerCalls, 1);
  releaseProvider();
  const values = await Promise.all(results);
  assert.deepEqual(values[0], values[1]);
  assert.deepEqual(values[1], values[2]);
});

test('provider failures are not cached and later requests retry the provider', async () => {
  let providerCalls = 0;
  const client = {
    search: async () => {
      providerCalls += 1;
      if (providerCalls === 1) throw new Error('provider failed');
      return { status: 'ok', articles: [article] };
    }
  };
  const service = new NewsService({ client, cache: new CacheService(), logger: silentLogger });
  await assert.rejects(service.searchNews({ q: 'retry-me' }), /provider failed/);
  const recovered = await service.searchNews({ q: 'retry-me' });
  assert.equal(providerCalls, 2);
  assert.equal(recovered.articles.length, 1);
});
