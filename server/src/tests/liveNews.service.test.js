import test from 'node:test';
import assert from 'node:assert/strict';
import { getLiveNewsConfig } from '../config/liveNews.js';
import { generateArticleId } from '../utils/articleHash.js';
import { LiveNewsService } from '../services/liveNews.service.js';

const baseline = [
  { title: 'Existing story', url: 'https://news.example/existing', source: { name: 'Example' }, publishedAt: '2026-10-07T10:00:00.000Z' }
];
const fresh = {
  title: 'New live story', description: 'A new article', url: 'https://news.example/new',
  urlToImage: 'https://news.example/image.jpg', source: { name: 'Example', id: 'provider-id' },
  publishedAt: '2026-10-07T10:01:00.000Z', author: 'Private provider metadata', content: 'Provider content'
};
const testConfig = (overrides = {}) => ({ enabled: true, pollIntervalMs: 900_000, pageSize: 20, seenLimit: 500, ...overrides });
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

const createHarness = ({ responses = [], config = testConfig(), broadcast, setIntervalFn, clearIntervalFn, now } = {}) => {
  let intervalCallback;
  let intervalCalls = 0;
  let clearCalls = 0;
  const calls = [];
  const emitted = [];
  const news = {
    normalizeArticle: (article) => ({ ...article, id: article.id || generateArticleId(article) }),
    getTopHeadlines: async (params) => {
      calls.push(params);
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response || { articles: [] };
    }
  };
  const service = new LiveNewsService({
    news,
    config,
    broadcast: broadcast || ((payload) => emitted.push(payload)),
    logger: { info() {}, error() {} },
    setIntervalFn: setIntervalFn || ((callback, interval) => { intervalCallback = callback; intervalCalls += 1; assert.equal(interval, config.pollIntervalMs); return 'timer'; }),
    clearIntervalFn: clearIntervalFn || ((timer) => { clearCalls += 1; assert.equal(timer, 'timer'); }),
    now: now || (() => new Date('2026-10-07T10:02:00.000Z'))
  });
  return {
    service, news, calls, emitted,
    get intervalCallback() { return intervalCallback; },
    get intervalCalls() { return intervalCalls; },
    get clearCalls() { return clearCalls; }
  };
};

test('live news configuration uses conservative defaults and bounds custom values', () => {
  assert.deepEqual(getLiveNewsConfig({}), testConfig());
  assert.deepEqual(getLiveNewsConfig({
    LIVE_NEWS_ENABLED: 'false', LIVE_NEWS_POLL_INTERVAL_MS: '120000',
    LIVE_NEWS_PAGE_SIZE: '10', LIVE_NEWS_SEEN_LIMIT: '100'
  }), testConfig({ enabled: false, pollIntervalMs: 120_000, pageSize: 10, seenLimit: 100 }));
  assert.equal(getLiveNewsConfig({ LIVE_NEWS_POLL_INTERVAL_MS: '1000' }).pollIntervalMs, 900_000);
  assert.equal(getLiveNewsConfig({ LIVE_NEWS_PAGE_SIZE: '1000' }).pageSize, 20);
  assert.equal(getLiveNewsConfig({ LIVE_NEWS_SEEN_LIMIT: '-1' }).seenLimit, 500);
});

test('poller starts one interval and establishes a silent initial baseline', async () => {
  const harness = createHarness({ responses: [{ articles: baseline }] });
  assert.equal(harness.service.start(), true);
  assert.equal(harness.service.start(), false);
  await nextTurn();
  assert.equal(harness.intervalCalls, 1);
  assert.equal(harness.calls.length, 1);
  assert.deepEqual(harness.calls[0], { country: 'us', page: 1, pageSize: 20 });
  assert.equal(harness.emitted.length, 0);
  assert.equal(harness.service.hasBaseline, true);
});

test('subsequent polls emit only new articles in the public event contract', async () => {
  const sameUrlDifferentHash = { ...fresh, id: 'different-hash' };
  const harness = createHarness({ responses: [
    { articles: baseline },
    { articles: [...baseline, fresh, { ...fresh }, sameUrlDifferentHash] }
  ] });
  harness.service.start();
  await nextTurn();
  harness.intervalCallback();
  await nextTurn();

  const expectedHash = generateArticleId(fresh);
  assert.deepEqual(harness.emitted, [{
    articles: [{
      title: fresh.title,
      description: fresh.description,
      url: fresh.url,
      source: { name: 'Example' },
      publishedAt: fresh.publishedAt,
      image: fresh.urlToImage,
      hash: expectedHash
    }],
    fetchedAt: '2026-10-07T10:02:00.000Z'
  }]);
  assert.equal(JSON.stringify(harness.emitted).includes('Private provider metadata'), false);
  assert.equal(JSON.stringify(harness.emitted).includes('provider-id'), false);
});

test('same hashes and duplicate URLs are emitted only once across cycles', async () => {
  const harness = createHarness({ responses: [
    { articles: baseline },
    { articles: [fresh] },
    { articles: [{ ...fresh, id: 'new-id-same-url' }] }
  ] });
  harness.service.start();
  await nextTurn();
  harness.intervalCallback();
  await nextTurn();
  harness.intervalCallback();
  await nextTurn();
  assert.equal(harness.emitted.length, 1);
});

test('seen article hashes and URL fallbacks remain within configured bounds', async () => {
  const many = Array.from({ length: 5 }, (_, index) => ({ title: `Story ${index}`, url: `https://news.example/${index}` }));
  const harness = createHarness({ responses: [{ articles: many }], config: testConfig({ seenLimit: 2 }) });
  harness.service.start();
  await nextTurn();
  assert.equal(harness.service.seenArticles.size, 2);
  assert.equal(harness.service.seenUrls.size, 2);
});

test('polling skips overlapping requests while the active request is still running', async () => {
  let release;
  let calls = 0;
  const harness = createHarness({ responses: [new Error('private provider detail'), { articles: baseline }] });
  harness.news.getTopHeadlines = async () => {
    calls += 1;
    if (calls === 1) return new Promise((resolve) => { release = () => resolve({ articles: baseline }); });
    return { articles: baseline };
  };
  harness.service.start();
  assert.equal(await harness.service.poll(), false);
  assert.equal(calls, 1);
  release();
  await nextTurn();
  harness.intervalCallback();
  await nextTurn();
  assert.equal(calls, 2);
  assert.equal(harness.service.hasBaseline, true);
  assert.equal(harness.service.lastPollError, null);
});

test('broadcast failure does not crash polling and the new article can be retried', async () => {
  let attempts = 0;
  const harness = createHarness({
    responses: [{ articles: baseline }, { articles: [fresh] }, { articles: [fresh] }],
    broadcast: (payload) => {
      attempts += 1;
      if (attempts === 1) throw new Error('socket transport details');
      harness.emitted.push(payload);
    }
  });
  harness.service.start();
  await nextTurn();
  harness.intervalCallback();
  await nextTurn();
  assert.equal(harness.service.running, true);
  harness.intervalCallback();
  await nextTurn();
  assert.equal(attempts, 2);
  assert.equal(harness.emitted.length, 1);
});

test('provider failures leave polling active so a later cycle can retry', async () => {
  const harness = createHarness({ responses: [new Error('provider failed'), { articles: baseline }] });
  harness.service.start();
  await nextTurn();
  assert.equal(harness.service.running, true);
  assert.equal(harness.service.lastPollError, 'LIVE_NEWS_POLL_FAILED');
  harness.intervalCallback();
  await nextTurn();
  assert.equal(harness.service.hasBaseline, true);
  assert.equal(harness.service.lastPollError, null);
});

test('stopping clears the interval and prevents later provider requests', async () => {
  const harness = createHarness({ responses: [{ articles: baseline }] });
  harness.service.start();
  await nextTurn();
  assert.equal(harness.service.stop(), true);
  assert.equal(harness.clearCalls, 1);
  harness.intervalCallback();
  await nextTurn();
  assert.equal(harness.calls.length, 1);
  assert.equal(harness.service.running, false);
});

test('disabled configuration prevents poller startup', () => {
  const harness = createHarness({ config: testConfig({ enabled: false }) });
  assert.equal(harness.service.start(), false);
  assert.equal(harness.intervalCalls, 0);
});
