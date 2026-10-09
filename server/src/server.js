import { createServer } from 'node:http';
import app from './app.js';
import { config, validateProductionConfig } from './config/env.js';
import { createLiveNewsRuntime } from './services/liveNewsRuntime.js';
import { logger } from './utils/logger.js';
import { createShutdownHandler } from './utils/shutdown.js';

validateProductionConfig(config);

const server = createServer({ maxHeaderSize: 16 * 1024 }, app);
const liveNewsRuntime = createLiveNewsRuntime(server);
const shutdown = createShutdownHandler({
  closeRuntime: () => liveNewsRuntime.close(),
  logger,
  timeoutMs: config.SHUTDOWN_TIMEOUT_MS
});

server.on('error', (error) => {
  logger.error('HTTP server startup/runtime error', {
    errorCode: typeof error?.code === 'string' ? error.code : 'SERVER_ERROR'
  });
  process.exitCode = 1;
});

server.listen(config.PORT, () => {
  logger.info('NewsPulse API server started', {
    environment: config.NODE_ENV,
    port: config.PORT,
    apiPath: '/api/v1',
    liveNewsEnabled: liveNewsRuntime.enabled
  });
});

process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
process.once('SIGINT', () => { void shutdown('SIGINT'); });

export { server, liveNewsRuntime, shutdown };
export default server;
