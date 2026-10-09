import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { io as createSocketClient } from 'socket.io-client';
import { createSocketServer, LIVE_NEWS_UPDATE_EVENT } from '../socket/socket.server.js';

const silentLogger = { info() {}, error() {} };
const waitFor = (emitter, event) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 2_000);
  emitter.once(event, (value) => { clearTimeout(timeout); resolve(value); });
});
const waitForClientCount = async (socketServer, count) => {
  const deadline = Date.now() + 2_000;
  while (socketServer.getConnectedClientCount() !== count && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(socketServer.getConnectedClientCount(), count);
};

test('Socket.IO uses the configured origin and counts client lifecycle safely', async () => {
  const server = createServer();
  const countChanges = [];
  const socketServer = createSocketServer(server, {
    clientUrl: 'http://localhost:5173', logger: silentLogger,
    onClientCountChange: (count) => countChanges.push(count)
  });
  assert.equal(typeof socketServer.io.engine.opts.cors.origin, 'function');
  assert.equal(socketServer.io.engine.opts.cors.credentials, true);
  await new Promise((resolve, reject) => socketServer.io.engine.opts.cors.origin('http://localhost:5173', (error, origin) => {
    if (error) return reject(error);
    assert.equal(origin, 'http://localhost:5173');
    resolve();
  }));
  await new Promise((resolve, reject) => socketServer.io.engine.opts.cors.origin('https://untrusted.example', (error, origin) => {
    if (error) return reject(error);
    assert.equal(origin, false);
    resolve();
  }));
  server.listen(0, '127.0.0.1');
  await waitFor(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  const first = createSocketClient(url, { transports: ['websocket'], reconnection: false });
  let second;
  try {
    await waitFor(first, 'connect');
    assert.equal(socketServer.getConnectedClientCount(), 1);

    second = createSocketClient(url, { transports: ['websocket'], reconnection: false });
    await waitFor(second, 'connect');
    assert.equal(socketServer.getConnectedClientCount(), 2);

    first.disconnect();
    await waitForClientCount(socketServer, 1);
    second.disconnect();
    await waitForClientCount(socketServer, 0);
    assert.deepEqual(countChanges, [1, 2, 1, 0]);
  } finally {
    first.disconnect();
    second?.disconnect();
    await socketServer.close();
  }
});

test('broadcast emits only the explicit incremental event payload', async () => {
  const server = createServer();
  const socketServer = createSocketServer(server, { clientUrl: 'http://localhost:5173', logger: silentLogger });
  server.listen(0, '127.0.0.1');
  await waitFor(server, 'listening');
  const client = createSocketClient(`http://127.0.0.1:${server.address().port}`, { transports: ['websocket'], reconnection: false });
  try {
    await waitFor(client, 'connect');
    const updateReceived = waitFor(client, LIVE_NEWS_UPDATE_EVENT);
    const payload = { articles: [{ title: 'New' }], fetchedAt: '2026-10-07T10:00:00.000Z' };
    assert.equal(socketServer.broadcastNewsUpdate(payload), true);
    assert.deepEqual(await updateReceived, payload);
    assert.equal(socketServer.broadcastNewsUpdate({ articles: [] }), false);
  } finally {
    client.disconnect();
    await socketServer.close();
  }
});

test('socket module requires an explicit configured CORS origin', () => {
  assert.throws(() => createSocketServer(createServer()), /configured client origin/);
});
