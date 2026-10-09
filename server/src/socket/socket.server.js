import { Server as SocketIOServer } from 'socket.io';
import { createSocketCorsOptions } from '../config/cors.js';
import { logger as defaultLogger } from '../utils/logger.js';

export const LIVE_NEWS_UPDATE_EVENT = 'news:update';
const MAX_CONNECTED_CLIENTS = 500;
const MAX_SOCKET_PAYLOAD_BYTES = 16 * 1024;

export const createSocketServer = (httpServer, {
  clientUrl,
  logger = defaultLogger,
  onClientCountChange = () => {}
} = {}) => {
  if (!clientUrl) throw new TypeError('A configured client origin is required for Socket.IO.');

  const io = new SocketIOServer(httpServer, {
    maxHttpBufferSize: MAX_SOCKET_PAYLOAD_BYTES,
    connectTimeout: 10_000,
    perMessageDeflate: false,
    ...createSocketCorsOptions(clientUrl)
  });
  let connectedClients = 0;
  let admittedClients = 0;

  io.use((socket, next) => {
    if (admittedClients >= MAX_CONNECTED_CLIENTS) {
      const error = new Error('Live news connection capacity reached.');
      error.data = { code: 'LIVE_NEWS_CAPACITY' };
      return next(error);
    }
    admittedClients += 1;
    socket.data.liveNewsAdmitted = true;
    return next();
  });

  io.on('connection', (socket) => {
    connectedClients += 1;
    logger.info(`Live news client connected (${connectedClients} connected).`);
    onClientCountChange(connectedClients);

    socket.once('disconnect', () => {
      connectedClients = Math.max(0, connectedClients - 1);
      if (socket.data.liveNewsAdmitted) {
        admittedClients = Math.max(0, admittedClients - 1);
        socket.data.liveNewsAdmitted = false;
      }
      logger.info(`Live news client disconnected (${connectedClients} connected).`);
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
