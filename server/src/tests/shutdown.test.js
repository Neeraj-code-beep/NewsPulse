import test from 'node:test';
import assert from 'node:assert/strict';
import { createShutdownHandler } from '../utils/shutdown.js';

const logger = { info() {}, error() {} };

test('shutdown closes resources once, returns the same promise, and clears its timeout', async () => {
  let closeCalls = 0;
  let timeoutCallback;
  let cleared;
  let exitCode;
  const handler = createShutdownHandler({
    closeRuntime: async () => { closeCalls += 1; },
    logger,
    setTimeoutFn: (callback) => { timeoutCallback = callback; return 17; },
    clearTimeoutFn: (id) => { cleared = id; },
    setExitCode: (code) => { exitCode = code; },
    forceExit: () => assert.fail('Successful shutdown must not force exit')
  });

  const first = handler('SIGTERM');
  const second = handler('SIGINT');
  assert.equal(first, second);
  await first;
  assert.equal(closeCalls, 1);
  assert.equal(cleared, 17);
  assert.equal(exitCode, 0);
  assert.equal(typeof timeoutCallback, 'function');
});

test('shutdown enforces the configured timeout when cleanup does not settle', async () => {
  let timeoutCallback;
  let forcedCode;
  let exitCode;
  const handler = createShutdownHandler({
    closeRuntime: () => new Promise(() => {}),
    logger,
    setTimeoutFn: (callback) => { timeoutCallback = callback; return 18; },
    clearTimeoutFn() {},
    setExitCode: (code) => { exitCode = code; },
    forceExit: (code) => { forcedCode = code; }
  });

  const pending = handler('SIGTERM');
  timeoutCallback();
  await pending;
  assert.equal(forcedCode, 1);
  assert.equal(exitCode, 1);
});

test('failed cleanup retains the timeout so a broken runtime cannot hang shutdown forever', async () => {
  let timeoutCallback;
  let forcedCode;
  let exitCode;
  const handler = createShutdownHandler({
    closeRuntime: async () => { throw new Error('private cleanup detail'); },
    logger,
    setTimeoutFn: (callback) => { timeoutCallback = callback; return 19; },
    clearTimeoutFn() {},
    setExitCode: (code) => { exitCode = code; },
    forceExit: (code) => { forcedCode = code; }
  });

  const pending = handler('SIGINT');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(exitCode, 1);
  assert.equal(forcedCode, undefined);
  timeoutCallback();
  await pending;
  assert.equal(forcedCode, 1);
  assert.equal(exitCode, 1);
});
