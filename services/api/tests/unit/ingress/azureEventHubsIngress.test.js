const { earliestEventPosition } = require('@azure/event-hubs');
const {
  AzureEventHubsIngress,
  eventBody,
  extractMessageId,
} = require('../../../src/ingress/azureEventHubsIngress');

function payload(overrides = {}) {
  return {
    sensorId: 'TEMP-01',
    type: 'temperature',
    value: 25,
    unit: '°C',
    isAnomaly: false,
    timestamp: new Date().toISOString(),
    metadata: { line: 'A' },
    ...overrides,
  };
}

function createMetrics() {
  return {
    telemetryMessagesTotal: { inc: jest.fn() },
    telemetryMessagesRejectedTotal: { inc: jest.fn() },
    telemetryProcessingDurationSeconds: { observe: jest.fn() },
    telemetryIngressFailuresTotal: { inc: jest.fn() },
  };
}

function createClient({ subscribe } = {}) {
  const subscription = { close: jest.fn().mockResolvedValue(undefined) };
  const client = {
    subscribe: subscribe || jest.fn().mockResolvedValue(subscription),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const Client = jest.fn(() => client);
  return { Client, client, subscription };
}

function createIngress(options = {}) {
  const metrics = createMetrics();
  const processor = { process: jest.fn().mockResolvedValue({ duplicate: false }) };
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const setStatus = jest.fn();
  const io = { emit: jest.fn() };
  const ingress = new AzureEventHubsIngress({
    processor,
    log,
    metrics,
    io,
    setStatus,
    ...options,
  });

  return { ingress, metrics, processor, log, setStatus, io };
}

describe('AzureEventHubsIngress', () => {
  it('subscribes from earliest without a checkpoint store', async () => {
    const { Client, client } = createClient();
    const { ingress, setStatus } = createIngress({ Client });

    await ingress.start({
      connectionString: 'Endpoint=sb://example/;SharedAccessKey=secret',
      eventHubName: 'messages',
      consumerGroup: '$Default',
    });

    expect(Client).toHaveBeenCalledWith(
      '$Default',
      'Endpoint=sb://example/;SharedAccessKey=secret',
      'messages'
    );
    expect(client.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        processEvents: expect.any(Function),
        processError: expect.any(Function),
        processInitialize: expect.any(Function),
        processClose: expect.any(Function),
      }),
      {
        startPosition: earliestEventPosition,
        maxBatchSize: 50,
        maxWaitTimeInSeconds: 5,
      }
    );
    expect(setStatus).toHaveBeenNthCalledWith(1, {
      connected: false,
      status: 'initializing',
    });
    expect(setStatus).toHaveBeenLastCalledWith({
      connected: true,
      status: 'connected',
    });
    expect(ingress.getStatus()).toEqual({ connected: true, status: 'connected' });
  });

  it('wires the subscription callbacks to the ingress handlers', async () => {
    const { Client, client } = createClient();
    const { ingress, processor, setStatus } = createIngress({ Client });
    await ingress.start({
      connectionString: 'Endpoint=sb://example/;SharedAccessKey=secret',
      eventHubName: 'messages',
    });

    const handlers = client.subscribe.mock.calls[0][0];
    await handlers.processEvents([{
      messageId: 'callback-message',
      body: Buffer.from(JSON.stringify(payload())),
    }]);
    handlers.processInitialize({ partitionId: '0' });
    handlers.processError(new Error('partition failure'), { partitionId: '0' });
    handlers.processClose({ partitionId: '0' });

    expect(processor.process).toHaveBeenCalledWith(
      expect.objectContaining({ sensorId: 'TEMP-01' }),
      expect.objectContaining({ messageId: 'callback-message', source: 'azure' })
    );
    expect(setStatus).toHaveBeenLastCalledWith({
      connected: false,
      status: 'disconnected',
    });
  });

  it('processes an event through the shared processor with source azure', async () => {
    const { ingress, metrics, processor, io } = createIngress();
    const event = {
      messageId: 'message-1',
      body: Buffer.from(JSON.stringify(payload())),
    };

    await ingress.handleEvents([event]);

    expect(processor.process).toHaveBeenCalledWith(
      expect.objectContaining({
        sensorId: 'TEMP-01',
        sensorType: 'temperature',
        value: 25,
      }),
      { io, messageId: 'message-1', source: 'azure' }
    );
    expect(metrics.telemetryMessagesTotal.inc).toHaveBeenNthCalledWith(1, {
      transport: 'azure',
      outcome: 'accepted',
    });
    expect(metrics.telemetryMessagesTotal.inc).toHaveBeenNthCalledWith(2, {
      transport: 'azure',
      outcome: 'processed',
    });
    expect(metrics.telemetryProcessingDurationSeconds.observe).toHaveBeenCalledWith(
      { transport: 'azure' },
      expect.any(Number)
    );
  });

  it('accepts object bodies and messageId from event properties', async () => {
    const { ingress, processor } = createIngress();

    await ingress.handleEvents([{
      properties: { messageId: 'message-2' },
      body: payload(),
    }]);

    expect(processor.process).toHaveBeenCalledWith(
      expect.objectContaining({ sensorId: 'TEMP-01' }),
      expect.objectContaining({ messageId: 'message-2', source: 'azure' })
    );
  });

  it('marks duplicate processing without creating another broadcast', async () => {
    const { ingress, metrics, processor, io } = createIngress();
    processor.process.mockResolvedValueOnce({ duplicate: true });

    await ingress.handleEvents([{
      messageId: 'message-3',
      body: Buffer.from(JSON.stringify(payload())),
    }]);

    expect(io.emit).not.toHaveBeenCalled();
    expect(metrics.telemetryMessagesTotal.inc).toHaveBeenLastCalledWith({
      transport: 'azure',
      outcome: 'duplicate',
    });
  });

  it.each([
    ['missing messageId', { body: Buffer.from(JSON.stringify(payload())) }, 'missing_message_id'],
    ['invalid JSON', { messageId: 'message-4', body: Buffer.from('{') }, 'json'],
    ['empty body', { messageId: 'message-5' }, 'payload_size'],
  ])('rejects %s without calling the processor', async (_case, event, reason) => {
    const { ingress, metrics, processor } = createIngress();

    await ingress.handleEvents([event]);

    expect(processor.process).not.toHaveBeenCalled();
    expect(metrics.telemetryMessagesTotal.inc).toHaveBeenCalledWith({
      transport: 'azure',
      outcome: 'rejected',
    });
    expect(metrics.telemetryMessagesRejectedTotal.inc).toHaveBeenCalledWith({
      transport: 'azure',
      reason,
    });
  });

  it('rejects a processing failure and continues with the batch', async () => {
    const { ingress, metrics, processor } = createIngress();
    processor.process
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce({ duplicate: false });

    await ingress.handleEvents([
      { messageId: 'message-6', body: Buffer.from(JSON.stringify(payload())) },
      { messageId: 'message-7', body: Buffer.from(JSON.stringify(payload())) },
    ]);

    expect(metrics.telemetryMessagesRejectedTotal.inc).toHaveBeenCalledWith({
      transport: 'azure',
      reason: 'processing',
    });
    expect(processor.process).toHaveBeenCalledTimes(2);
    expect(metrics.telemetryMessagesTotal.inc).toHaveBeenCalledWith({
      transport: 'azure',
      outcome: 'processed',
    });
  });

  it('reports partition lifecycle and errors', () => {
    const { ingress, metrics, log, setStatus } = createIngress();

    ingress.handleInitialize({ partitionId: '0' });
    expect(setStatus).toHaveBeenLastCalledWith({ connected: true, status: 'connected' });

    ingress.handleError(new Error('connection reset'), { partitionId: '0' });
    expect(setStatus).toHaveBeenLastCalledWith({ connected: false, status: 'error' });
    expect(metrics.telemetryIngressFailuresTotal.inc).toHaveBeenCalledWith({
      transport: 'azure',
      reason: 'event_hubs_error',
    });
    expect(log.error).toHaveBeenCalledWith(
      'Azure Event Hubs error',
      expect.objectContaining({ partitionId: '0', error: 'connection reset' })
    );

    ingress.handleClose({ partitionId: '0' });
    expect(setStatus).toHaveBeenLastCalledWith({ connected: false, status: 'disconnected' });
  });

  it('closes the subscription and client exactly once', async () => {
    const { Client, client, subscription } = createClient();
    const { ingress, setStatus } = createIngress({ Client });
    await ingress.start({
      connectionString: 'Endpoint=sb://example/;SharedAccessKey=secret',
      eventHubName: 'messages',
    });

    await ingress.stop();
    await ingress.stop();

    expect(subscription.close).toHaveBeenCalledTimes(1);
    expect(client.close).toHaveBeenCalledTimes(1);
    expect(setStatus).toHaveBeenLastCalledWith({
      connected: false,
      status: 'disconnected',
    });
  });

  it('fails explicitly and closes the client when subscription fails', async () => {
    const subscribe = jest.fn().mockRejectedValue(new Error('unauthorized'));
    const { Client, client } = createClient({ subscribe });
    const { ingress, metrics, setStatus } = createIngress({ Client });

    await expect(ingress.start({
      connectionString: 'Endpoint=sb://example/;SharedAccessKey=secret',
      eventHubName: 'messages',
    })).rejects.toThrow('unauthorized');

    expect(client.close).toHaveBeenCalledTimes(1);
    expect(setStatus).toHaveBeenLastCalledWith({ connected: false, status: 'error' });
    expect(metrics.telemetryIngressFailuresTotal.inc).toHaveBeenCalledWith({
      transport: 'azure',
      reason: 'start',
    });
  });

  it('reports a constructor failure without trying to close a missing client', async () => {
    const Client = jest.fn(() => {
      throw new Error('invalid connection string');
    });
    const { ingress, metrics, setStatus } = createIngress({ Client });

    await expect(ingress.start({
      connectionString: 'invalid',
      eventHubName: 'messages',
    })).rejects.toThrow('invalid connection string');

    expect(setStatus).toHaveBeenLastCalledWith({ connected: false, status: 'error' });
    expect(metrics.telemetryIngressFailuresTotal.inc).toHaveBeenCalledWith({
      transport: 'azure',
      reason: 'start',
    });
    expect(ingress.client).toBeNull();
  });

  it('requires connection string and event hub name before creating a client', async () => {
    const { ingress, setStatus } = createIngress();

    await expect(ingress.start({ eventHubName: 'messages' }))
      .rejects.toThrow('AZURE_EVENT_HUB_CONNECTION_STRING is required');
    await expect(ingress.start({ connectionString: 'Endpoint=sb://example/' }))
      .rejects.toThrow('AZURE_EVENT_HUB_NAME is required');
    expect(setStatus).not.toHaveBeenCalled();
  });
});

describe('Event Hubs helpers', () => {
  it('extracts message ids from supported event locations', () => {
    expect(extractMessageId({ messageId: 'a' })).toBe('a');
    expect(extractMessageId({ properties: { messageId: 'b' } })).toBe('b');
    expect(extractMessageId({ properties: { 'message-id': 'c' } })).toBe('c');
    expect(extractMessageId({ systemProperties: { 'message-id': 'd' } })).toBe('d');
    expect(extractMessageId({})).toBeNull();
  });

  it('converts supported bodies to buffers', () => {
    expect(eventBody({ body: Buffer.from('x') })).toEqual(Buffer.from('x'));
    expect(eventBody({ body: 'x' })).toEqual(Buffer.from('x'));
    expect(eventBody({ body: new Uint8Array([120]) })).toEqual(Buffer.from('x'));
    expect(eventBody({ body: { a: 1 } })).toEqual(Buffer.from('{"a":1}'));
    expect(eventBody({})).toBeNull();
  });
});
