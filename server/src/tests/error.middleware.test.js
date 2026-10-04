import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { logger } from '../utils/logger.js';
import { notFoundMiddleware } from '../middleware/notFound.middleware.js';
import { AppError, ValidationError } from '../utils/errors.js';

process.env.NODE_ENV = 'production';
const { errorMiddleware } = await import('../middleware/error.middleware.js');
logger.error = () => {};

const withErrorApp = async (run) => {
  const app = express();
  app.use(express.json());
  app.get('/expected', (_req, _res, next) => next(new AppError('Expected failure', 409, 'EXPECTED_FAILURE')));
  app.get('/validation', (_req, _res, next) => next(new ValidationError('Invalid request')));
  app.get('/unexpected', (_req, _res, next) => next(new Error('internal test detail')));
  app.post('/body', (req, res) => res.json(req.body));
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
};

test('expected application and validation errors use the standard error contract', async () => {
  await withErrorApp(async (baseUrl) => {
    const expectedResponse = await fetch(`${baseUrl}/expected`);
    assert.equal(expectedResponse.status, 409);
    assert.deepEqual(await expectedResponse.json(), {
      success: false,
      error: { code: 'EXPECTED_FAILURE', message: 'Expected failure' }
    });

    const validationResponse = await fetch(`${baseUrl}/validation`);
    const validation = await validationResponse.json();
    assert.equal(validationResponse.status, 400);
    assert.equal(validation.error.code, 'VALIDATION_ERROR');
  });
});

test('unexpected errors do not expose stack traces in API responses', async () => {
  await withErrorApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/unexpected`);
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'INTERNAL_ERROR');
    assert.equal(body.error.message, 'Something went wrong');
    assert.equal(Object.hasOwn(body.error, 'stack'), false);
  });
});

test('malformed JSON is returned as a client validation error', async () => {
  await withErrorApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/body`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken'
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.equal(body.error.message, 'Malformed JSON request body');
    assert.equal(Object.hasOwn(body.error, 'stack'), false);
  });
});
