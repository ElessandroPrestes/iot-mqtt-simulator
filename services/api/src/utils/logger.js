const winston = require('winston');

const { combine, timestamp, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production'
    ? combine(timestamp(), json())
    : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), simple()),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
