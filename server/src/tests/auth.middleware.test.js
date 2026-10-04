import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequireAuth } from '../middleware/auth.middleware.js';
import { AppError } from '../utils/errors.js';

const invoke = async (authorization, getFirebaseAuth) => {
  const req = {
    get: (name) => name.toLowerCase() === 'authorization' ? authorization : undefined
  };
  let error;
  let nextCalls = 0;
  await createRequireAuth(getFirebaseAuth)(req, {}, (nextError) => {
    error = nextError;
    nextCalls += 1;
  });
  return { req, error, nextCalls };
};

test('authentication rejects a missing authorization header', async () => {
  const { error } = await invoke(undefined, () => assert.fail('Firebase must not initialize'));
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, 'AUTH_REQUIRED');
});

test('authentication rejects invalid schemes and empty bearer tokens', async (t) => {
  for (const header of ['Basic abc', 'Bearer', 'Bearer   ']) {
    await t.test(header, async () => {
      const { error } = await invoke(header, () => assert.fail('Firebase must not initialize'));
      assert.equal(error.statusCode, 401);
      assert.equal(error.code, 'AUTH_INVALID_TOKEN');
    });
  }
});

test('authentication maps token verification failure to AUTH_INVALID_TOKEN', async () => {
  const firebaseAuth = { verifyIdToken: async () => { throw new Error('provider detail'); } };
  const { error } = await invoke('Bearer token-for-test', () => firebaseAuth);
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, 'AUTH_INVALID_TOKEN');
  assert.doesNotMatch(error.message, /provider detail/);
});

test('authentication preserves Firebase configuration errors', async () => {
  const configurationError = new AppError('Firebase is not configured', 500, 'FIREBASE_CONFIG_ERROR');
  const { error } = await invoke('Bearer token-for-test', () => { throw configurationError; });
  assert.equal(error, configurationError);
});

test('authentication attaches normalized identity from verified claims', async () => {
  const firebaseAuth = {
    verifyIdToken: async () => ({ uid: 'user-123', email: 'reader@example.test', email_verified: true })
  };
  const { req, error, nextCalls } = await invoke('Bearer token-for-test', () => firebaseAuth);
  assert.equal(error, undefined);
  assert.equal(nextCalls, 1);
  assert.deepEqual(req.user, { uid: 'user-123', email: 'reader@example.test', emailVerified: true });
});

test('authentication rejects verified claims without a uid', async () => {
  const firebaseAuth = { verifyIdToken: async () => ({ email: 'reader@example.test' }) };
  const { error } = await invoke('Bearer token-for-test', () => firebaseAuth);
  assert.equal(error.code, 'AUTH_INVALID_TOKEN');
});
