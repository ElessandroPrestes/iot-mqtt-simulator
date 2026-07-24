import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { logger } from '../src/logger.js';

const directories = [];
const originalLogFile = process.env.LOG_FILE;

afterEach(() => {
  jest.restoreAllMocks();
  if (originalLogFile === undefined) delete process.env.LOG_FILE;
  else process.env.LOG_FILE = originalLogFile;

  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('structured simulator logger', () => {
  it('writes parseable JSON to the dedicated production log file', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-simulator-log-'));
    directories.push(directory);
    const logFile = path.join(directory, 'application.log');
    process.env.LOG_FILE = logFile;
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn('Sensor anomaly detected', {
      sensorId: 'TEMP-01',
      value: 91.2,
    });

    const entry = JSON.parse(fs.readFileSync(logFile, 'utf8').trim());
    expect(entry).toEqual(expect.objectContaining({
      level: 'warn',
      message: 'Sensor anomaly detected',
      sensorId: 'TEMP-01',
      value: 91.2,
    }));
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
    expect(fs.statSync(logFile).mode & 0o777).toBe(0o644);
  });

  it('does not allow metadata to replace canonical fields', () => {
    delete process.env.LOG_FILE;
    const output = jest.spyOn(console, 'log').mockImplementation(() => {});

    logger.info('Canonical message', {
      level: 'error',
      message: 'forged',
      timestamp: 'forged',
    });

    const entry = JSON.parse(output.mock.calls[0][0]);
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('Canonical message');
    expect(entry.timestamp).not.toBe('forged');
  });
});
