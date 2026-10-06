import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { AppError } from '../utils/errors.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import { createAIRouter } from '../routes/ai.routes.js';
import { aiLimiter } from '../middleware/aiRateLimit.middleware.js';
import { AIController } from '../controllers/ai.controller.js';
import { AIService } from '../services/ai.service.js';
import { CacheService } from '../services/cache.service.js';
import { GeminiClient } from '../integrations/ai/gemini.client.js';
import app from '../app.js';
import { logger } from '../utils/logger.js';

logger.error = () => {};
const noLimit = (req, res, next) => next();
const createTestApp = (service) => {
  const serverApp = express();
  serverApp.use(express.json());
  serverApp.use('/api/v1/ai', createAIRouter({
    controller: { summarize: async (req, res, next) => {
      try { res.status(200).json({ success: true, data: await service.summarize(req.body, req.user) }); }
      catch (error) { next(error); }
    } },
    auth: (req, res, next) => { req.user = { uid: 'verified-test-user' }; next(); },
    limiter: noLimit
  }));
  serverApp.use(errorMiddleware);
  return serverApp;
};
const withServer = async (serverApp, run) => {
  const server = serverApp.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
};

test('mounted AI endpoint rejects unauthenticated requests using existing auth envelope', async () => {
  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/ai/summarize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Article', description: 'Text' })
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'AUTH_REQUIRED');
  });
});

test('authenticated valid request reaches service and returns normalized response contract', async () => {
  let received;
  const serverApp = createTestApp({ summarize: async (article, user) => {
    received = { article, user };
    return { summary: 'A concise summary.', cached: false };
  } });
  await withServer(serverApp, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/ai/summarize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Article', description: 'Text', url: 'https://example.test/story' })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true, data: { summary: 'A concise summary.', cached: false }
    });
    assert.equal(received.user.uid, 'verified-test-user');
    assert.equal(received.article.url, 'https://example.test/story');
  });
});

test('AI validation rejects missing fields, invalid types, unknown fields, and oversized request fields', async () => {
  const serverApp = createTestApp({ summarize: async () => assert.fail('invalid request reached service') });
  await withServer(serverApp, async (baseUrl) => {
    const bodies = [
      {},
      { title: 'Title' },
      { title: 5, description: 'Text' },
      { title: 'Title', description: [] },
      { title: 'Title', description: 'Text', firebaseUid: 'attacker' },
      { title: 'x'.repeat(1001), description: 'Text' },
      { title: 'Title', description: 'Text', content: 'x'.repeat(50001) },
      { title: 'Title', description: 'Text', url: 'javascript:alert(1)' }
    ];
    for (const body of bodies) {
      const response = await fetch(`${baseUrl}/api/v1/ai/summarize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const result = await response.json();
      assert.equal(response.status, 400);
      assert.equal(result.error.code, 'AI_VALIDATION_ERROR');
    }
  });
});

test('AI errors use safe application errors and never return provider details', async () => {
  const serverApp = createTestApp({ summarize: async () => {
    throw new AppError('Unable to generate article summary.', 503, 'AI_PROVIDER_ERROR');
  } });
  await withServer(serverApp, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/ai/summarize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Article', description: 'Text' })
    });
    const result = await response.json();
    assert.equal(response.status, 503);
    assert.equal(result.error.code, 'AI_PROVIDER_ERROR');
    assert.equal(JSON.stringify(result).includes('secret-provider-error'), false);
  });
});

test('provider credentials and raw provider failures never appear in API responses', async () => {
  class FailingGenAI {
    constructor() {
      this.models = { generateContent: async () => { throw new Error('test-server-secret raw sdk response'); } };
    }
  }
  const provider = new GeminiClient({
    configProvider: () => ({ apiKey: 'test-server-secret', model: 'test-model', timeoutMs: 100 }),
    GoogleGenAI: FailingGenAI
  });
  const controller = new AIController({
    service: new AIService({ provider, cache: new CacheService(), configProvider: () => ({ maxInputLength: 1000, cacheTtlMs: 1000 }) })
  });
  const serverApp = express();
  serverApp.use(express.json());
  serverApp.use('/api/v1/ai', createAIRouter({ controller, auth: (req, res, next) => { req.user = { uid: 'test-user' }; next(); }, limiter: noLimit }));
  serverApp.use(errorMiddleware);
  await withServer(serverApp, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/ai/summarize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Article', description: 'Text' })
    });
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error.code, 'AI_PROVIDER_ERROR');
    assert.equal(JSON.stringify(body).includes('test-server-secret'), false);
    assert.equal(JSON.stringify(body).includes('raw sdk response'), false);
  });
});

test('AI route only accepts POST at the dedicated summarize endpoint', async () => {
  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/ai/summarize`, { method: 'GET' });
    assert.equal(response.status, 404);
  });
});

test('AI endpoint maps body-parser oversized payloads to a stable validation error', async () => {
  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/ai/summarize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Article', description: 'x'.repeat(110000) })
    });
    const body = await response.json();
    assert.equal(response.status, 413);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'AI_VALIDATION_ERROR');
    assert.equal(body.error.message, 'Article summary request is too large.');
  });
});

test('AI-specific limiter caps authenticated generation traffic with its stable error envelope', async () => {
  let serviceCalls = 0;
  const serverApp = express();
  serverApp.use(express.json());
  serverApp.use('/api/v1/ai', createAIRouter({
    controller: { summarize: async (req, res) => {
      serviceCalls += 1;
      res.status(200).json({ success: true, data: { summary: 'ok', cached: false } });
    } },
    auth: (req, res, next) => { req.user = { uid: 'rate-limit-test-user' }; next(); },
    limiter: aiLimiter
  }));
  await withServer(serverApp, async (baseUrl) => {
    let last;
    for (let index = 0; index < 21; index += 1) {
      last = await fetch(`${baseUrl}/api/v1/ai/summarize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Article', description: 'Text' })
      });
    }
    const body = await last.json();
    assert.equal(last.status, 429);
    assert.equal(body.error.code, 'AI_RATE_LIMITED');
    assert.equal(serviceCalls, 20);
  });
});
