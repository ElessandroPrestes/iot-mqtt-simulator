const logger = require('../utils/logger');

module.exports = function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`, {
      method:     req.method,
      url:        req.originalUrl,
      statusCode: res.statusCode,
      duration:   Date.now() - start,
      ip:         req.ip,
    });
  });
  next();
};
