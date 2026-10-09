import { config as appConfig } from '../config/env.js';
import { Server as SocketIOServer } from 'socket.io';
import { logger as defaultLogger } from '../utils/logger.js';
export const LIVE_NEWS_UPDATE_EVENT = 'news:update';
export const createSocketServer = (httpServer, { clientUrl, logger = defaultLogger, onClientCountChange = () => {} } = {}) => {
  if (!clientUrl) throw new TypeError('A configured client origin is required for Socket.IO.');
  const io = new SocketIOServer(httpServer, {
    cors: { origin(origin, callback) { callback(null, origin === clientUrl ? clientUrl : false); }, methods: ['GET', 'POST', 'OPTIONS'], credentials: true },
    allowRequest(request, callback) { const origin = request.headers.origin; callback(null, !origin || origin === clientUrl); }
  });
  let connectedClients = 0;
  io.on('connection', (socket) => {
    connectedClients += 1;
    logger.info('Live news client connected (' + connectedClients + ' connected).');
    onClientCountChange(connectedClients);
    socket.once('disconnect', () => {
      connectedClients = Math.max(0, connectedClients - 1);
      logger.info('Live news client disconnected (' + connectedClients + ' connected).');
      onClientCountChange(connectedClients);
    });
  });
  return {
    io,
    getConnectedClientCount: () => connectedClients,
    broadcastNewsUpdate(payload) {
      if (!Array.isArray(payload?.articles) || payload.articles.length === 0) return false;
      io.emit(LIVE_NEWS_UPDATE_EVENT, payload);
      return true;
    },
    close: () => new Promise((resolve) => io.close(resolve))
  };
};
