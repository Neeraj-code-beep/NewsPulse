import { config as appConfig } from '../config/env.js';
import { createSocketServer } from '../socket/socket.server.js';
import { logger } from '../utils/logger.js';
import { liveNewsService as defaultLiveNewsService } from './liveNews.service.js';

export const createLiveNewsRuntime = (httpServer, {
  clientUrl = appConfig.CLIENT_URL,
  liveNews = defaultLiveNewsService,
  logger: runtimeLogger = logger
} = {}) => {
  let hasConnectedClients = false;
  const socketServer = createSocketServer(httpServer, {
    clientUrl,
    logger: runtimeLogger,
    onClientCountChange(count) {
      const hasClients = count > 0;
      if (hasClients === hasConnectedClients) return;
      hasConnectedClients = hasClients;
      if (hasClients) {
        if (liveNews.config?.enabled !== false) liveNews.start();
      } else {
        liveNews.stop();
      }
    }
  });

  liveNews.broadcast = socketServer.broadcastNewsUpdate;

  return {
    ...socketServer,
    liveNews,
    enabled: liveNews.config?.enabled ?? true,
    close: () => {
      liveNews.stop();
      return socketServer.close();
    }
  };
};
