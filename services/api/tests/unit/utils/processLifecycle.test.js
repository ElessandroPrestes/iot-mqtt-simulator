const { EventEmitter } = require('events');

jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
}));

const logger = require('../../../src/utils/logger');
const { installFatalProcessHandlers } = require('../../../src/utils/processLifecycle');

describe('fatal process lifecycle', () => {
  it.each([
    ['unhandledRejection', new Error('async failure'), 'unhandledRejection'],
    ['uncaughtException', new Error('sync failure'), 'uncaughtException'],
  ])('logs and shuts down on %s', async (event, error, signal) => {
    const target = new EventEmitter();
    const shutdown = jest.fn().mockResolvedValue();
    const uninstall = installFatalProcessHandlers(shutdown, target);

    target.emit(event, error);
    await Promise.resolve();

    expect(logger.error).toHaveBeenCalled();
    expect(shutdown).toHaveBeenCalledWith(signal, 1);
    uninstall();
    expect(target.listenerCount(event)).toBe(0);
  });
});
