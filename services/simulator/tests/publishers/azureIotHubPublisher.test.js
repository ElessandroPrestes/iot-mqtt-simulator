import { describe, expect, it, jest } from '@jest/globals';
import { AzureIotHubPublisher } from '../../src/publishers/azureIotHubPublisher.js';

const connectionString =
  'HostName=test.azure-devices.net;DeviceId=simulator-gateway;SharedAccessKey=secret';

function createLogger() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
}

function createClient(overrides = {}) {
  return {
    open: jest.fn().mockResolvedValue(undefined),
    sendEvent: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMessage(payload) {
  return {
    data: payload,
    properties: { add: jest.fn() },
  };
}

function createPublisher({ client = createClient(), logger = createLogger(), ...overrides } = {}) {
  return new AzureIotHubPublisher({
    connectionString,
    deviceId: 'simulator-gateway',
    logger,
    createClient: jest.fn(() => client),
    createMessage,
    newMessageId: () => 'message-1',
    ...overrides,
  });
}

describe('AzureIotHubPublisher', () => {
  it('opens the device client once and reports connected status', async () => {
    const client = createClient();
    const logger = createLogger();
    const createClientFn = jest.fn(() => client);
    const publisher = createPublisher({
      client,
      logger,
      createClient: createClientFn,
    });

    await publisher.start();
    await publisher.start();

    expect(createClientFn).toHaveBeenCalledTimes(1);
    expect(createClientFn).toHaveBeenCalledWith(connectionString);
    expect(client.open).toHaveBeenCalledTimes(1);
    expect(publisher.getStatus()).toEqual({
      state: 'connected',
      deviceId: 'simulator-gateway',
    });
    expect(logger.info).toHaveBeenCalledWith('Azure IoT Hub connected', {
      deviceId: 'simulator-gateway',
    });
  });

  it('publishes telemetry with correlation and routing properties', async () => {
    const client = createClient();
    const publisher = createPublisher({ client });
    const payload = JSON.stringify({
      sensorId: 'TEMP-01',
      type: 'temperature',
      value: 25.5,
      isAnomaly: false,
    });

    await publisher.start();
    await publisher.publish('factory/sensors/temperature/TEMP-01', payload);

    expect(client.sendEvent).toHaveBeenCalledTimes(1);
    const message = client.sendEvent.mock.calls[0][0];
    expect(message.data).toBe(payload);
    expect(message.messageId).toBe('message-1');
    expect(message.contentType).toBe('application/json');
    expect(message.contentEncoding).toBe('utf-8');
    expect(message.properties.add).toHaveBeenCalledWith('sensorId', 'TEMP-01');
    expect(message.properties.add).toHaveBeenCalledWith('sensorType', 'temperature');
    expect(message.properties.add).toHaveBeenCalledWith('isAnomaly', 'false');
    expect(message.properties.add).toHaveBeenCalledWith(
      'localTopic',
      'factory/sensors/temperature/TEMP-01'
    );
  });

  it('uses the SDK Message when no message factory is injected', async () => {
    const client = createClient();
    const publisher = new AzureIotHubPublisher({
      connectionString,
      deviceId: 'simulator-gateway',
      logger: createLogger(),
      createClient: jest.fn(() => client),
      newMessageId: () => 'message-1',
    });
    const payload = JSON.stringify({
      sensorId: 'TEMP-01',
      type: 'temperature',
      isAnomaly: false,
    });

    await publisher.start();
    await publisher.publish('factory/sensors/temperature/TEMP-01', payload);

    const message = client.sendEvent.mock.calls[0][0];
    expect(message.getBytes().toString()).toBe(payload);
    expect(message.messageId).toBe('message-1');
    expect(message.to).toBeFalsy();
    expect(message.properties.getValue('sensorId')).toBe('TEMP-01');
    expect(message.properties.getValue('localTopic')).toBe(
      'factory/sensors/temperature/TEMP-01'
    );
  });

  it('rejects publish before start', async () => {
    const publisher = createPublisher();

    await expect(publisher.publish('topic', '{"sensorId":"TEMP-01"}'))
      .rejects.toThrow(/not started/);
  });

  it('rejects malformed payloads without sending them', async () => {
    const client = createClient();
    const publisher = createPublisher({ client });

    await publisher.start();
    await expect(publisher.publish('topic', 'not-json')).rejects.toThrow();
    expect(client.sendEvent).not.toHaveBeenCalled();
  });

  it('propagates send failures', async () => {
    const client = createClient({
      sendEvent: jest.fn().mockRejectedValue(new Error('send failed')),
    });
    const publisher = createPublisher({ client });

    await publisher.start();
    await expect(publisher.publish(
      'topic',
      JSON.stringify({ sensorId: 'TEMP-01', type: 'temperature' })
    )).rejects.toThrow('send failed');
  });

  it('allows retrying a failed publish without reconnecting', async () => {
    const sendEvent = jest.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(undefined);
    const client = createClient({ sendEvent });
    const publisher = createPublisher({ client });
    const payload = JSON.stringify({ sensorId: 'TEMP-01', type: 'temperature' });

    await publisher.start();

    await expect(publisher.publish('topic', payload)).rejects.toThrow('temporary failure');
    await expect(publisher.publish('topic', payload)).resolves.toBeUndefined();

    expect(sendEvent).toHaveBeenCalledTimes(2);
    expect(publisher.getStatus().state).toBe('connected');
  });

  it('rejects startup when the device client cannot open', async () => {
    const client = createClient({
      open: jest.fn().mockRejectedValue(new Error('open failed')),
    });
    const logger = createLogger();
    const publisher = createPublisher({ client, logger });

    await expect(publisher.start()).rejects.toThrow('open failed');

    expect(publisher.getStatus().state).toBe('error');
    expect(publisher.client).toBeNull();
    expect(logger.error).toHaveBeenCalledWith('Azure IoT Hub connection failed', {
      deviceId: 'simulator-gateway',
      error: 'open failed',
    });
  });

  it('rejects startup when the client cannot be created', async () => {
    const publisher = createPublisher({
      createClient: jest.fn(() => {
        throw new Error('invalid connection string');
      }),
    });

    await expect(publisher.start()).rejects.toThrow('invalid connection string');
    expect(publisher.getStatus().state).toBe('error');
  });

  it('closes the client once and is idempotent', async () => {
    const client = createClient();
    const publisher = createPublisher({ client });

    await publisher.start();
    await publisher.stop();
    await publisher.stop();

    expect(client.close).toHaveBeenCalledTimes(1);
    expect(publisher.getStatus().state).toBe('stopped');
  });

  it('logs close failures without breaking shutdown', async () => {
    const client = createClient({
      close: jest.fn().mockRejectedValue(new Error('close failed')),
    });
    const logger = createLogger();
    const publisher = createPublisher({ client, logger });

    await publisher.start();
    await expect(publisher.stop()).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith('Azure IoT Hub close failed', {
      deviceId: 'simulator-gateway',
      error: 'close failed',
    });
  });
});
