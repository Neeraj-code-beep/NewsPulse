import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSearch, validateTopHeadlines } from '../middleware/validate.middleware.js';

const validate = (middleware, query) => {
  let nextError;
  try {
    middleware({ query: { ...query } }, {}, (error) => { nextError = error; });
  } catch (error) {
    nextError = error;
  }
  return nextError;
};

const assertInvalid = (middleware, query) => {
  const error = validate(middleware, query);
  assert.equal(error?.statusCode, 400);
  assert.equal(error?.code, 'VALIDATION_ERROR');
  assert.equal(error?.message, 'Invalid request parameters');
};

test('search pagination accepts positive integer pages and page sizes', () => {
  for (const page of ['1', '2']) assert.equal(validate(validateSearch, { q: 'world', page }), undefined);
  assert.equal(validate(validateSearch, { q: 'world', pageSize: '1' }), undefined);
  assert.equal(validate(validateSearch, { q: 'world', pageSize: '100' }), undefined);
});

test('search pagination rejects invalid page and page size values without partial parsing', () => {
  for (const page of ['0', '-1', 'abc', '1abc', '1.5']) {
    assertInvalid(validateSearch, { q: 'world', page });
  }
  for (const pageSize of ['0', '-1', 'abc', '20abc', '1.5', '101']) {
    assertInvalid(validateSearch, { q: 'world', pageSize });
  }
});

test('search validates, trims, and bounds the query', () => {
  assert.equal(validate(validateSearch, { q: '  world news  ' }), undefined);
  const request = { query: { q: '  world news  ' } };
  validateSearch(request, {}, () => {});
  assert.equal(request.query.q, 'world news');
  assertInvalid(validateSearch, {});
  assertInvalid(validateSearch, { q: '   ' });
  assertInvalid(validateSearch, { q: 'x'.repeat(501) });
});

test('search accepts supported options and rejects unsupported options', () => {
  assert.equal(validate(validateSearch, { q: 'world', language: 'EN', sortBy: ' popularity ' }), undefined);
  assertInvalid(validateSearch, { q: 'world', language: 'xx' });
  assertInvalid(validateSearch, { q: 'world', sortBy: 'random' });
  assertInvalid(validateSearch, { q: 'world', extra: 'value' });
});

test('top headlines validates pagination, filters, and unknown parameters', () => {
  assert.equal(validate(validateTopHeadlines, { country: 'US', category: 'technology', page: '2', pageSize: '30' }), undefined);
  for (const page of ['0', '-1', 'abc', '1abc', '1.5']) {
    assertInvalid(validateTopHeadlines, { page });
  }
  for (const pageSize of ['0', 'abc', '101']) {
    assertInvalid(validateTopHeadlines, { pageSize });
  }
  assertInvalid(validateTopHeadlines, { category: 'unsupported' });
  assertInvalid(validateTopHeadlines, { country: 'USA' });
  assertInvalid(validateTopHeadlines, { extra: 'value' });
});
