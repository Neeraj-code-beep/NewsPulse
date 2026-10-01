import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`NewsPulse API server running in ${config.NODE_ENV} mode on port ${PORT}`);
  logger.info(`Base API URL: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
