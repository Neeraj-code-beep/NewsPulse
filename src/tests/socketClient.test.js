import test from 'node:test';
import assert from 'node:assert/strict';
import { getLiveNewsSocket, getLiveNewsSocketUrl } from '../services/socket.js';

test('frontend creates one Socket.IO client with automatic reconnect enabled', () => {
  const first = getLiveNewsSocket();
  const second = getLiveNewsSocket();
  assert.equal(first, second);
  assert.equal(first.io.opts.reconnection, true);
  assert.equal(first.io.opts.reconnectionAttempts, Infinity);
  assert.equal(typeof getLiveNewsSocketUrl(), 'string');
  first.disconnect();
});
