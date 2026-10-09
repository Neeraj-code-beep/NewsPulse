import test from 'node:test';
import assert from 'node:assert/strict';
import { deduplicateLiveArticles, getLiveArticleIdentity, mergeLiveArticles } from '../utils/liveNews.js';

const existing = { id: 'article-hash', title: 'Existing story', url: 'https://news.example/existing' };
const incoming = { hash: 'new-hash', title: 'New story', url: 'https://news.example/new' };

test('article identity prefers the existing server hash and falls back to URL', () => {
  assert.equal(getLiveArticleIdentity(existing), 'id:article-hash');
  assert.equal(getLiveArticleIdentity(incoming), 'id:new-hash');
  assert.equal(getLiveArticleIdentity({ url: 'https://news.example/story' }), 'url:https://news.example/story');
});

test('pending updates deduplicate by hash and URL and skip articles already known', () => {
  const duplicateUrl = { hash: 'other-hash', title: 'Same URL', url: incoming.url };
  const unique = deduplicateLiveArticles([existing, incoming, duplicateUrl], new Set([getLiveArticleIdentity(existing)]));
  assert.deepEqual(unique, [incoming]);
});

test('viewing updates prepends only unseen stories and preserves current feed order', () => {
  const merged = mergeLiveArticles([existing], [existing, incoming, { ...incoming, hash: 'third-hash' }]);
  assert.deepEqual(merged.map((article) => article.title), ['New story', 'Existing story']);
  assert.equal(merged[0].id, 'new-hash');
});

test('feed merge also rejects a duplicate URL when a provider hash differs', () => {
  const duplicateUrl = { hash: 'other-hash', title: 'Duplicate', url: incoming.url };
  assert.deepEqual(mergeLiveArticles([], [incoming, duplicateUrl]), [{ ...incoming, id: 'new-hash' }]);
});
