import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
const SOCKET_URL = (() => {
  try {
    const browserOrigin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    return new URL(API_BASE_URL, browserOrigin).origin;
  } catch {
    return API_BASE_URL;
  }
})();

let sharedSocket;

export const getLiveNewsSocket = () => {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      timeout: 10_000
    });
  }
  return sharedSocket;
};

export const getLiveNewsSocketUrl = () => SOCKET_URL;
