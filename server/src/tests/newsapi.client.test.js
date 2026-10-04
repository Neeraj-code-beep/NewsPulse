import test from 'node:test';
import assert from 'node:assert/strict';
import { NewsApiClient } from '../integrations/newsapi/newsapi.client.js';

const silentLogger = { error() {} };
const apiConfig = {
  baseUrl: 'https://provider.invalid/v2',
  apiKey: '',
  validate() {}
};
const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body
});

test('NewsAPI client requests the configured endpoint and returns provider data', async () => {
  let requestedUrl;
  let requestOptions;
  const client = new NewsApiClient({
    apiConfig,
    logger: silentLogger,
    fetchImpl: async (url, options) => {
      requestedUrl = new URL(url);
      requestOptions = options;
      return response(200, { status: 'ok', totalResults: 1, articles: [{ title: 'Example' }] });
    }
  });

  const data = await client.search({ q: 'world', page: 2 });
  assert.equal(requestedUrl.pathname, '/v2/everything');
  assert.equal(requestedUrl.searchParams.get('q'), 'world');
  assert.equal(requestedUrl.searchParams.get('page'), '2');
  assert.equal(requestOptions.method, 'GET');
  assert.deepEqual(data.articles, [{ title: 'Example' }]);
});

test('NewsAPI client maps provider HTTP errors to safe application errors', async (t) => {
  const cases = [
    [401, 500, 'NEWS_PROVIDER_UNAUTHORIZED'],
    [429, 429, 'NEWS_PROVIDER_RATE_LIMITED'],
    [503, 502, 'NEWS_PROVIDER_UNAVAILABLE'],
    [400, 400, 'NEWS_PROVIDER_ERROR']
  ];

  for (const [providerStatus, expectedStatus, expectedCode] of cases) {
    await t.test(String(providerStatus), async () => {
      const client = new NewsApiClient({
        apiConfig,
        logger: silentLogger,
        fetchImpl: async () => response(providerStatus, { status: 'error', code: 'private provider detail' })
      });
      await assert.rejects(client.request('/everything'), (error) => {
        assert.equal(error.statusCode, expectedStatus);
        assert.equal(error.code, expectedCode);
        assert.doesNotMatch(error.message, /private provider detail/);
        return true;
      });
    });
  }
});

test('NewsAPI client maps network failures safely', async () => {
  const client = new NewsApiClient({
    apiConfig,
    logger: silentLogger,
    fetchImpl: async () => { throw new Error('private network detail'); }
  });
  await assert.rejects(client.request('/everything'), (error) => {
    assert.equal(error.statusCode, 502);
    assert.equal(error.code, 'NEWS_PROVIDER_UNAVAILABLE');
    assert.doesNotMatch(error.message, /private network detail/);
    return true;
  });
});

test('NewsAPI client aborts requests at its configured timeout', async () => {
  const client = new NewsApiClient({
    apiConfig,
    timeoutMs: 10,
    logger: silentLogger,
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    })
  });
  await assert.rejects(client.request('/everything'), (error) => {
    assert.equal(error.statusCode, 504);
    assert.equal(error.code, 'NEWS_PROVIDER_TIMEOUT');
    return true;
  });
});
