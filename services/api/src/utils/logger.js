const winston = require('winston');
const { redact } = require('./redact');

const { combine, timestamp, json, colorize, simple } = winston.format;
const redactFormat = winston.format((info) => {
  Object.assign(info, redact({ ...info }));
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production'
    ? combine(redactFormat(), timestamp(), json())
    : combine(redactFormat(), colorize(), timestamp({ format: 'HH:mm:ss' }), simple()),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
