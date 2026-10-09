export const createShutdownHandler = ({
  closeRuntime,
  logger,
  timeoutMs = 10_000,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  setExitCode = (code) => { process.exitCode = code; },
  forceExit = (code) => process.exit(code)
}) => {
  if (typeof closeRuntime !== 'function') throw new TypeError('A runtime close function is required.');
  let shutdownPromise;

  return (signal) => {
    if (shutdownPromise) return shutdownPromise;
    logger.info('Shutdown requested', { signal });

    shutdownPromise = new Promise((resolve) => {
      let completed = false;
      let timeoutId;
      const finish = (code) => {
        if (completed) return;
        completed = true;
        clearTimeoutFn(timeoutId);
        setExitCode(code);
        resolve();
      };
      timeoutId = setTimeoutFn(() => {
        logger.error('Graceful shutdown timed out', { signal, timeoutMs });
        forceExit(1);
        finish(1);
      }, timeoutMs);
      timeoutId?.unref?.();

      Promise.resolve()
        .then(closeRuntime)
        .then(() => {
          logger.info('HTTP and Socket.IO resources closed', { signal });
          finish(0);
        })
        .catch((error) => {
          logger.error('Graceful shutdown failed', {
            signal,
            errorType: typeof error?.name === 'string' ? error.name : 'Error'
          });
          setExitCode(1);
        });
    });
    return shutdownPromise;
  };
};
