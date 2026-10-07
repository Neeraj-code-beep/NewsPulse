import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSimilarity, calculateTokenOverlap, extractKeywords, normalizeText, tokenizeText } from '../utils/textSimilarity.js';

test('text normalization lowercases, removes punctuation, and normalizes spacing', () => {
  assert.equal(normalizeText('  Apple—launches, NEW\nAI model! '), 'apple launches new ai model');
});

test('tokenization removes common stop words and very short tokens', () => {
  assert.deepEqual(tokenizeText('The AI model is in India'), ['ai', 'model', 'india']);
});

test('token overlap is deterministic and returns zero for empty text', () => {
  assert.equal(calculateTokenOverlap('apple launches model', 'apple model arrives'), 0.5);
  assert.equal(calculateSimilarity('', 'unrelated story'), 0);
});

test('keyword extraction prioritizes repeated terms and caps result count', () => {
  assert.deepEqual(extractKeywords('climate climate policy policy change report', 2), ['climate', 'policy']);
});
