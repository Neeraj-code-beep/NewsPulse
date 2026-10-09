import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { io as createSocketClient } from 'socket.io-client';
import { createLiveNewsRuntime } from '../services/liveNewsRuntime.js';

const waitFor = (emitter, event) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 2_000);
  emitter.once(event, (value) => { clearTimeout(timeout); resolve(value); });
});
const connect = async (url) => {
  const client = createSocketClient(url, { transports: ['websocket'], reconnection: false });
  await waitFor(client, 'connect');
  return client;
};
const waitForClientCount = async (runtime, count) => {
  const deadline = Date.now() + 2_000;
  while (runtime.getConnectedClientCount() !== count && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(runtime.getConnectedClientCount(), count);
};

test('one shared poller starts for the first client and stops for the last client', async () => {
  const server = createServer();
  const lifecycle = [];
  const liveNews = {
    config: { enabled: true },
    start: () => lifecycle.push('start'),
    stop: () => lifecycle.push('stop'),
    broadcast: () => {}
  };
  const runtime = createLiveNewsRuntime(server, {
    clientUrl: 'http://localhost:5173', liveNews, logger: { info() {}, error() {} }
  });
  server.listen(0, '127.0.0.1');
  await waitFor(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  const clients = [];
  try {
    const first = await connect(url);
    clients.push(first);
    assert.deepEqual(lifecycle, ['start']);
    const second = await connect(url);
    clients.push(second);
    assert.deepEqual(lifecycle, ['start']);
    first.disconnect();
    await waitForClientCount(runtime, 1);
    assert.deepEqual(lifecycle, ['start']);
    second.disconnect();
    await waitForClientCount(runtime, 0);
    assert.deepEqual(lifecycle, ['start', 'stop']);
  } finally {
    clients.forEach((client) => client.disconnect());
    await runtime.close();
  }
});

test('disabled live news accepts public sockets without starting its poller', async () => {
  const server = createServer();
  let starts = 0;
  const liveNews = { config: { enabled: false }, start: () => { starts += 1; }, stop() {}, broadcast() {} };
  const runtime = createLiveNewsRuntime(server, {
    clientUrl: 'http://localhost:5173', liveNews, logger: { info() {}, error() {} }
  });
  server.listen(0, '127.0.0.1');
  await waitFor(server, 'listening');
  let client;
  try {
    client = await connect(`http://127.0.0.1:${server.address().port}`);
    assert.equal(runtime.enabled, false);
    assert.equal(runtime.getConnectedClientCount(), 1);
    assert.equal(starts, 0);
  } finally {
    client?.disconnect();
    await runtime.close();
  }
});
