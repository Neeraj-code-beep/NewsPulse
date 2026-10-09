/**
 * Lightweight structured logger
 */
const write = (level, message, context = {}) => {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    message: String(message),
    ...(context && typeof context === 'object' && !Array.isArray(context) ? context : {})
  };
  const output = JSON.stringify(record);
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
};

export const logger = {
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context)
};
