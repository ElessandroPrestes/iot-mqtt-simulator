const logger = require('../utils/logger');

module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // Extrai detalhes caso erro venha do Joi ou de outra camada validada
  const details = status < 500 && err.details
    ? err.details.map(i => i.message || i)
    : [];

  // Define o código canônico do erro
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  if (status === 400) code = 'VALIDATION_ERROR';
  if (status === 401) code = 'UNAUTHORIZED';
  if (status === 403) code = 'FORBIDDEN';
  if (status === 404) code = 'NOT_FOUND';
  if (status === 429) code = 'RATE_LIMITED';

  const message = (process.env.NODE_ENV === 'production' && status >= 500)
    ? 'Internal server error'
    : err.message;

  if (status >= 500) {
    logger.error('Unhandled error', {
      correlationId: req.id,
      message: err.message,
      stack: err.stack,
      path: req.path,
    });
  } else {
    logger.warn('Client error', {
      correlationId: req.id,
      status,
      message,
      path: req.path,
      details,
    });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details,
      correlationId: req.id,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
};
