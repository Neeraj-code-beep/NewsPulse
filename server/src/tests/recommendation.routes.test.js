import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createRecommendationRouter } from '../routes/recommendation.routes.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

logger.error = () => {};

const withServer = async (app, run) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
};

const createApp = (service = async () => ({ articles: [] })) => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/news/related', createRecommendationRouter({
    controller: { getRelated: async (req, res, next) => {
      try { res.status(200).json({ success: true, data: await service(req.recommendationInput) }); }
      catch (error) { next(error); }
    } }
  }));
  app.use(errorMiddleware);
  return app;
};

test('valid request returns standard response shape and default controlled limit', async () => {
  let input;
  await withServer(createApp(async (value) => { input = value; return { articles: [{ title: 'Related', score: 0.8 }] }; }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/news/related`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article: {
        id: 'known-hash', title: 'Current story', description: null, content: null, author: null,
        source: { id: null, name: 'Example' }, url: 'https://example.test/current', urlToImage: null, publishedAt: null
      } })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, data: { articles: [{ title: 'Related', score: 0.8 }] } });
    assert.equal(input.limit, 5);
  });
});

test('invalid fields, malformed URLs, and unbounded result limits are rejected', async () => {
  await withServer(createApp(async () => assert.fail('invalid request reached service')), async (baseUrl) => {
    for (const body of [
      { article: {} },
      { article: { title: 'Title', extra: 'query override' } },
      { article: { title: 'Title', url: 'javascript:alert(1)' } },
      { article: { title: 'Title' }, limit: 11 },
      { article: { title: 'Title' }, query: 'arbitrary NewsAPI query' }
    ]) {
      const response = await fetch(`${baseUrl}/api/v1/news/related`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const result = await response.json();
      assert.equal(response.status, 400);
      assert.equal(result.error.code, 'RECOMMENDATION_VALIDATION_ERROR');
    }
  });
});

test('empty recommendations use successful empty response contract', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/news/related`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article: { title: 'Current story' }, limit: 2 })
    });
    assert.deepEqual(await response.json(), { success: true, data: { articles: [] } });
  });
});

test('provider failures return safe recommendation error envelope', async () => {
  const app = createApp(async () => { throw new AppError('Related stories are temporarily unavailable.', 502, 'RECOMMENDATION_PROVIDER_ERROR'); });
  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/news/related`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article: { title: 'Current story' } })
    });
    const body = await response.json();
    assert.equal(response.status, 502);
    assert.equal(body.error.code, 'RECOMMENDATION_PROVIDER_ERROR');
    assert.doesNotMatch(JSON.stringify(body), /provider/);
  });
});
