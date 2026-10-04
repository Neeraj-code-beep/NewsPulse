import test from 'node:test';
import assert from 'node:assert/strict';
import { CacheService } from '../services/cache.service.js';

test('cache reports misses and stores/retrieves values', () => {
  const cache = new CacheService(1000);
  assert.equal(cache.get('missing'), null);
  assert.equal(cache.has('missing'), false);
  cache.set('article:1', { title: 'Example' });
  assert.deepEqual(cache.get('article:1'), { title: 'Example' });
  assert.equal(cache.has('article:1'), true);
});

test('cache expires entries and does not return expired values', async () => {
  const cache = new CacheService(15);
  cache.set('short-lived', 'value');
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(cache.get('short-lived'), null);
  assert.equal(cache.has('short-lived'), false);
});

test('cache keys remain isolated and clear removes stored entries', () => {
  const cache = new CacheService(1000);
  cache.set('query:page=1', 'first');
  cache.set('query:page=2', 'second');
  assert.equal(cache.get('query:page=1'), 'first');
  assert.equal(cache.get('query:page=2'), 'second');
  assert.equal(cache.delete('query:page=1'), true);
  assert.equal(cache.get('query:page=1'), null);
  cache.clear();
  assert.equal(cache.get('query:page=2'), null);
});
