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

test('cache removes expired entries during writes even when they are never read again', async () => {
  const cache = new CacheService(10, 2);
  cache.set('expired', 'value');
  await new Promise((resolve) => setTimeout(resolve, 15));
  cache.set('fresh', 'value');
  assert.equal(cache.store.has('expired'), false);
  assert.equal(cache.get('fresh'), 'value');
});

test('cache capacity is bounded and recently read entries remain available', () => {
  const cache = new CacheService(1000, 2);
  cache.set('first', 1);
  cache.set('second', 2);
  assert.equal(cache.get('first'), 1);
  cache.set('third', 3);
  assert.equal(cache.store.size, 2);
  assert.equal(cache.get('first'), 1);
  assert.equal(cache.get('second'), null);
  assert.equal(cache.get('third'), 3);
});

test('cache rejects oversized keys and invalid TTLs', () => {
  const cache = new CacheService(1000, 2);
  assert.throws(() => cache.set('x'.repeat(4097), 'value'), /Cache keys/);
  assert.throws(() => cache.set('valid', 'value', 0), /Cache TTL/);
});
