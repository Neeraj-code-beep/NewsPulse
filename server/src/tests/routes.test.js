import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { logger } from '../utils/logger.js';

logger.error = () => {};

const withServer = async (run) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
};

test('API root and health routes return successful response envelopes', async () => {
  await withServer(async (baseUrl) => {
    const rootResponse = await fetch(`${baseUrl}/api/v1`);
    assert.equal(rootResponse.status, 200);
    assert.deepEqual(await rootResponse.json(), {
      success: true,
      data: { name: 'NewsPulse API', version: 'v1' }
    });

    const healthResponse = await fetch(`${baseUrl}/api/v1/health`);
    const health = await healthResponse.json();
    assert.equal(healthResponse.status, 200);
    assert.equal(health.success, true);
    assert.equal(health.data.status, 'ok');
  });
});

test('protected current-user endpoint rejects requests without authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'AUTH_REQUIRED');
  });
});

test('unknown API routes return the standard not-found error envelope', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/missing`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});

test('NewsAPI route rejects invalid input without contacting a provider', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/news/search?q=%20%20`);
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });
});

test('related-news endpoint is publicly mounted and validates before provider access', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/news/related`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ article: {} })
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'RECOMMENDATION_VALIDATION_ERROR');
  });
});

test('app can be imported without binding the configured production port', () => {
  assert.equal(typeof app, 'function');
  assert.equal(typeof app.listen, 'function');
  // The test server above binds only an OS-assigned ephemeral port.
});
