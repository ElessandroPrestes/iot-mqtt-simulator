const logger = require('../utils/logger');

module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
