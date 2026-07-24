import { appendFileSync } from 'node:fs';

function write(level, message, metadata = {}) {
  const entry = JSON.stringify({
    ...metadata,
    level,
    message,
    timestamp: new Date().toISOString(),
  });

  const consoleMethod = level === 'error'
    ? console.error
    : level === 'warn'
      ? console.warn
      : console.log;
  consoleMethod(entry);

  if (process.env.LOG_FILE) {
    appendFileSync(process.env.LOG_FILE, `${entry}\n`, {
      encoding: 'utf8',
      mode: 0o644,
    });
  }
}

export const logger = {
  error: (message, metadata) => write('error', message, metadata),
  info: (message, metadata) => write('info', message, metadata),
  warn: (message, metadata) => write('warn', message, metadata),
};
