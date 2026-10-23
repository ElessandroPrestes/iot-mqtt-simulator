import { EventEmitter } from 'node:events';
import { describe, expect, it, jest } from '@jest/globals';
import { LocalMqttPublisher } from '../../src/publishers/localMqttPublisher.js';

function createClient() {
  const client = new EventEmitter();
  client.publish = jest.fn((topic, payload, options, callback) => callback(null));
  client.end = jest.fn((force, options, callback) => callback());
  return client;
}

function createLogger() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
}

function localConfig(overrides = {}) {
  return {
    host: 'broker',
    port: 1883,
    clientId: 'simulator',
    protocol: 'mqtt',
    username: 'iotuser',
    password: 'iotpassword',
    ...overrides,
  };
}

describe('LocalMqttPublisher', () => {
  it('connects with local credentials and publishes with QoS 1', async () => {
    const client = createClient();
    const connect = jest.fn(() => client);
    const logger = createLogger();
    const publisher = new LocalMqttPublisher({
      mqttConfig: localConfig(),
      logger,
      connect,
    });

    const started = publisher.start();
    client.emit('connect');
    await started;

    expect(connect).toHaveBeenCalledWith('mqtt://broker:1883', expect.objectContaining({
      clientId: 'simulator',
      username: 'iotuser',
      password: 'iotpassword',
      reconnectPeriod: 3000,
    }));
    expect(publisher.getStatus().state).toBe('connected');

    await publisher.publish('factory/sensors/temperature/TEMP-01', '{"value":1}');

    expect(client.publish).toHaveBeenCalledWith(
      'factory/sensors/temperature/TEMP-01',
      '{"value":1}',
      { qos: 1, retain: false },
      expect.any(Function)
    );
  });

  it('uses mTLS options without username or password in secure mode', async () => {
    const client = createClient();
    const connect = jest.fn(() => client);
    const publisher = new LocalMqttPublisher({
      mqttConfig: localConfig({
        protocol: 'mqtts',
        port: 8883,
        ca: 'ca',
        cert: 'cert',
        key: 'key',
        ciphers: 'TLS_AES_256_GCM_SHA384',
      }),
      logger: createLogger(),
      connect,
    });

    const started = publisher.start();
    client.emit('connect');
    await started;

    const options = connect.mock.calls[0][1];
    expect(options).toEqual(expect.objectContaining({
      ca: 'ca',
      cert: 'cert',
      key: 'key',
      rejectUnauthorized: true,
      servername: 'broker',
      minVersion: 'TLSv1.2',
      ciphers: 'TLS_AES_256_GCM_SHA384',
    }));
    expect(options).not.toHaveProperty('username');
    expect(options).not.toHaveProperty('password');
  });

  it('rejects publish before start and propagates publish errors', async () => {
    const client = createClient();
    const publisher = new LocalMqttPublisher({
      mqttConfig: localConfig(),
      logger: createLogger(),
      connect: jest.fn(() => client),
    });

    await expect(publisher.publish('topic', 'payload')).rejects.toThrow(/not started/);

    const started = publisher.start();
    client.emit('connect');
    await started;

    client.publish.mockImplementationOnce((topic, payload, options, callback) => {
      callback(new Error('publish failed'));
    });

    await expect(publisher.publish('topic', 'payload')).rejects.toThrow('publish failed');
  });

  it('rejects startup on the first connection error and logs it', async () => {
    const client = createClient();
    const logger = createLogger();
    const publisher = new LocalMqttPublisher({
      mqttConfig: localConfig(),
      logger,
      connect: jest.fn(() => client),
    });

    const started = publisher.start();
    client.emit('error', new Error('connection refused'));

    await expect(started).rejects.toThrow('connection refused');
    expect(logger.error).toHaveBeenCalledWith('MQTT connection error', {
      error: 'connection refused',
    });
  });

  it('tracks reconnect and close states', async () => {
    const client = createClient();
    const publisher = new LocalMqttPublisher({
      mqttConfig: localConfig(),
      logger: createLogger(),
      connect: jest.fn(() => client),
    });

    const started = publisher.start();
    client.emit('connect');
    await started;

    client.emit('reconnect');
    expect(publisher.getStatus().state).toBe('reconnecting');

    client.emit('close');
    expect(publisher.getStatus().state).toBe('disconnected');
  });

  it('stops idempotently and closes the MQTT client once', async () => {
    const client = createClient();
    const publisher = new LocalMqttPublisher({
      mqttConfig: localConfig(),
      logger: createLogger(),
      connect: jest.fn(() => client),
    });

    const started = publisher.start();
    client.emit('connect');
    await started;

    await publisher.stop();
    await publisher.stop();

    expect(client.end).toHaveBeenCalledTimes(1);
    expect(client.end).toHaveBeenCalledWith(false, {}, expect.any(Function));
    expect(publisher.getStatus().state).toBe('stopped');
  });
});
