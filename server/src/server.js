import app from './app.js';
import { config } from './config/env.js';
import { createLiveNewsRuntime } from './services/liveNewsRuntime.js';
import { logger } from './utils/logger.js';
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  logger.info(`NewsPulse API server running in ${config.NODE_ENV} mode on port ${PORT}`);
  logger.info(`Base API URL: http://localhost:${PORT}/api/v1`);
});
const liveNewsRuntime = createLiveNewsRuntime(server);
const handleShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  liveNewsRuntime.close().finally(() => server.close(() => process.exit(0)));
  setTimeout(() => { logger.error('Could not close connections in time, forcefully shutting down'); process.exit(1); }, 10000);
};
process.once('SIGTERM', () => handleShutdown('SIGTERM'));
process.once('SIGINT', () => handleShutdown('SIGINT'));
export { server, liveNewsRuntime };
export default server;
