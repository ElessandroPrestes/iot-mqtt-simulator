import { describe, expect, it, jest } from '@jest/globals';
import { Simulator } from '../src/simulator.js';

function fakeSensor(id, reading) {
  return {
    id,
    read: jest.fn(() => reading),
  };
}

function createLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createSimulator(overrides = {}) {
  const sensors = [
    {
      sensor: fakeSensor('TEMP-01', {
        sensorId: 'TEMP-01',
        type: 'temperature',
        value: 50,
        unit: '°C',
        isAnomaly: false,
      }),
      topic: 'factory/sensors/temperature/TEMP-01',
    },
    {
      sensor: fakeSensor('PRES-01', {
        sensorId: 'PRES-01',
        type: 'pressure',
        value: 99,
        unit: 'bar',
        isAnomaly: true,
      }),
      topic: 'factory/sensors/pressure/PRES-01',
    },
  ];
  const publisher = { publish: jest.fn(() => Promise.resolve()) };
  const logger = createLogger();
  let intervalCallback = null;
  const timer = { id: 1 };
  const setIntervalFn = jest.fn((callback, intervalMs) => {
    intervalCallback = callback;
    return timer;
  });
  const clearIntervalFn = jest.fn();

  const simulator = new Simulator({
    sensors,
    publisher,
    intervalMs: 2000,
    logger,
    setIntervalFn,
    clearIntervalFn,
    ...overrides,
  });

  return {
    simulator,
    sensors,
    publisher,
    logger,
    timer,
    setIntervalFn,
    clearIntervalFn,
    tick: () => intervalCallback(),
  };
}

describe('Simulator lifecycle', () => {
  it('starts a single interval and publishes every sensor on each tick', async () => {
    const { simulator, publisher, logger, setIntervalFn, tick } = createSimulator();

    expect(simulator.start()).toBe(true);
    expect(simulator.start()).toBe(false);
    expect(setIntervalFn).toHaveBeenCalledTimes(1);
    expect(setIntervalFn).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(simulator.running).toBe(true);

    await tick();

    expect(publisher.publish).toHaveBeenCalledTimes(2);
    expect(publisher.publish).toHaveBeenCalledWith(
      'factory/sensors/temperature/TEMP-01',
      JSON.stringify({
        sensorId: 'TEMP-01',
        type: 'temperature',
        value: 50,
        unit: '°C',
        isAnomaly: false,
      })
    );
    expect(logger.warn).toHaveBeenCalledWith('Sensor anomaly detected', {
      sensorId: 'PRES-01',
      value: 99,
      unit: 'bar',
    });
  });

  it('logs publish failures without stopping the other sensors', async () => {
    const { simulator, publisher, logger, tick } = createSimulator();
    publisher.publish
      .mockImplementationOnce(() => Promise.reject(new Error('broker unavailable')))
      .mockImplementationOnce(() => Promise.resolve());

    simulator.start();
    await tick();

    expect(logger.error).toHaveBeenCalledWith('Telemetry publish failed', {
      topic: 'factory/sensors/temperature/TEMP-01',
      error: 'broker unavailable',
    });
    expect(publisher.publish).toHaveBeenCalledTimes(2);
  });

  it('catches synchronous publish failures', async () => {
    const { simulator, publisher, logger, tick } = createSimulator();
    publisher.publish.mockImplementationOnce(() => {
      throw new Error('sync failure');
    });

    simulator.start();
    await tick();

    expect(logger.error).toHaveBeenCalledWith('Telemetry publish failed', {
      topic: 'factory/sensors/temperature/TEMP-01',
      error: 'sync failure',
    });
  });

  it('stops idempotently and does not restart after stop', () => {
    const { simulator, timer, clearIntervalFn } = createSimulator();

    simulator.start();
    simulator.stop();
    simulator.stop();

    expect(clearIntervalFn).toHaveBeenCalledTimes(1);
    expect(clearIntervalFn).toHaveBeenCalledWith(timer);
    expect(simulator.running).toBe(false);
    expect(simulator.start()).toBe(false);
  });
});
