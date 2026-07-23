const logger = require('./logger');

function installFatalProcessHandlers(shutdown, target = process) {
  const onUnhandledRejection = (reason) => {
    logger.error('Unhandled promise rejection', {
      event: 'process.unhandled_rejection',
      error: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    void shutdown('unhandledRejection', 1);
  };
  const onUncaughtException = (error) => {
    logger.error('Uncaught exception', {
      event: 'process.uncaught_exception',
      error: error.message,
      stack: error.stack,
    });
    void shutdown('uncaughtException', 1);
  };

  target.on('unhandledRejection', onUnhandledRejection);
  target.on('uncaughtException', onUncaughtException);

  return () => {
    target.off('unhandledRejection', onUnhandledRejection);
    target.off('uncaughtException', onUncaughtException);
  };
}

module.exports = { installFatalProcessHandlers };
