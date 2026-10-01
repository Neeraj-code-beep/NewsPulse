/**
 * Lightweight structured logger
 */
const formatMessage = (level, message, ...meta) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
};

export const logger = {
  info: (message, ...meta) => {
    console.log(formatMessage('info', message), ...meta);
  },
  warn: (message, ...meta) => {
    console.warn(formatMessage('warn', message), ...meta);
  },
  error: (message, ...meta) => {
    console.error(formatMessage('error', message), ...meta);
  }
};
