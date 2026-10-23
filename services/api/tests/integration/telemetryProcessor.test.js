const Reading = require('../../src/models/Reading');
const Alert = require('../../src/models/Alert');
const ProcessedMessage = require('../../src/models/ProcessedMessage');
const readingRepository = require('../../src/repositories/readingRepository');
const alertRepository = require('../../src/repositories/alertRepository');
const processedMessageRepository = require('../../src/repositories/processedMessageRepository');
const strategyContext = require('../../src/strategies/thresholdStrategy');
const { TelemetryProcessor } = require('../../src/services/telemetryProcessor');
const { parseMqttMessage, parseTelemetryPayload } = require('../../src/services/telemetryPayload');

function rawPayload(overrides = {}) {
  return Buffer.from(JSON.stringify({
    sensorId: 'TEMP-01',
    type: 'temperature',
    value: 75,
    unit: '°C',
    isAnomaly: false,
    timestamp: new Date().toISOString(),
    metadata: { line: 'A' },
    ...overrides,
  }));
}

function buildProcessor(overrides = {}) {
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const metrics = {
    sensorValueGauge: { set: jest.fn() },
    alertsTotal: { inc: jest.fn() },
  };
  const io = { emit: jest.fn() };

  const processor = new TelemetryProcessor({
    readingRepo: readingRepository,
    alertRepo: alertRepository,
    processedMessageRepo: processedMessageRepository,
    strategy: strategyContext,
    log,
    metric: metrics,
    ...overrides,
  });

  return { processor, log, metrics, io };
}

async function clearTelemetry() {
  await Promise.all([
    Reading.deleteMany({}),
    Alert.deleteMany({}),
    ProcessedMessage.deleteMany({}),
  ]);
}

describe('TelemetryProcessor', () => {
  beforeAll(async () => {
    await Promise.all([Alert.init(), ProcessedMessage.init()]);
  });

  beforeEach(clearTelemetry);

  it('processes the same payload from local and Azure adapters with identical outcomes', async () => {
    const raw = rawPayload();
    const localData = parseMqttMessage('factory/sensors/temperature/TEMP-01', raw);
    const azureData = parseTelemetryPayload(raw);

    expect(azureData).toEqual(localData);

    const local = buildProcessor();
    const localResult = await local.processor.process(localData, {
      io: local.io,
      source: 'local',
    });
    const localReading = await Reading.findOne({ sensorId: 'TEMP-01' }).lean();
    const localEvents = local.io.emit.mock.calls.map(([event]) => event);

    await clearTelemetry();
    const azure = buildProcessor();
    const azureResult = await azure.processor.process(azureData, {
      io: azure.io,
      messageId: 'message-1',
      source: 'azure',
    });
    const azureReading = await Reading.findOne({ sensorId: 'TEMP-01' }).lean();
    const azureEvents = azure.io.emit.mock.calls.map(([event]) => event);

    expect(azureResult.status).toBe(localResult.status);
    expect(azureResult.duplicate).toBe(localResult.duplicate);
    expect(azureReading).toMatchObject({
      sensorId: localReading.sensorId,
      type: localReading.type,
      value: localReading.value,
      unit: localReading.unit,
      status: localReading.status,
    });
    expect(azureEvents).toEqual(localEvents);
    expect(await Alert.countDocuments({ resolved: false })).toBe(1);
    expect(local.metrics.sensorValueGauge.set).toHaveBeenCalledTimes(1);
    expect(azure.metrics.sensorValueGauge.set).toHaveBeenCalledTimes(1);
  });

  it('ignores a replayed Azure message without duplicating reading, alert, or broadcast', async () => {
    const data = parseTelemetryPayload(rawPayload());
    const { processor, io } = buildProcessor();

    const first = await processor.process(data, {
      io,
      messageId: 'replay-1',
      source: 'azure',
    });
    const second = await processor.process(data, {
      io,
      messageId: 'replay-1',
      source: 'azure',
    });

    expect(first.duplicate).toBe(false);
    expect(second).toEqual({ duplicate: true });
    expect(await Reading.countDocuments({ sensorId: 'TEMP-01' })).toBe(1);
    expect(await Alert.countDocuments({ sensorId: 'TEMP-01', resolved: false })).toBe(1);
    expect(io.emit.mock.calls.map(([event]) => event)).toEqual([
      'alert:new',
      'reading:new',
    ]);
    expect(await ProcessedMessage.findById('azure:replay-1').lean()).toMatchObject({
      source: 'azure',
      sensorId: 'TEMP-01',
      status: 'processed',
    });
  });

  it('allows only one processor to claim the same message concurrently', async () => {
    const data = parseTelemetryPayload(rawPayload());
    const { processor, io } = buildProcessor();

    const results = await Promise.all([
      processor.process(data, { io, messageId: 'concurrent-1', source: 'azure' }),
      processor.process(data, { io, messageId: 'concurrent-1', source: 'azure' }),
    ]);

    expect(results.filter((result) => result.duplicate)).toHaveLength(1);
    expect(results.filter((result) => !result.duplicate)).toHaveLength(1);
    expect(await Reading.countDocuments({ sensorId: 'TEMP-01' })).toBe(1);
    expect(await Alert.countDocuments({ sensorId: 'TEMP-01', resolved: false })).toBe(1);
    expect(io.emit.mock.calls.map(([event]) => event)).toEqual([
      'alert:new',
      'reading:new',
    ]);
  });

  it('releases the claim when processing fails so a retry can succeed', async () => {
    const data = parseTelemetryPayload(rawPayload());
    let attempts = 0;
    const failingReadingRepo = {
      create: jest.fn(async (reading) => {
        attempts += 1;
        if (attempts === 1) throw new Error('database unavailable');
        return readingRepository.create(reading);
      }),
    };
    const { processor, io } = buildProcessor({ readingRepo: failingReadingRepo });

    await expect(processor.process(data, {
      io,
      messageId: 'retry-1',
      source: 'azure',
    })).rejects.toThrow('database unavailable');

    expect(await ProcessedMessage.findById('azure:retry-1')).toBeNull();

    const retried = await processor.process(data, {
      io,
      messageId: 'retry-1',
      source: 'azure',
    });

    expect(retried.duplicate).toBe(false);
    expect(await Reading.countDocuments({ sensorId: 'TEMP-01' })).toBe(1);
  });

  it('keeps at most one active alert and one alert:new under concurrent alert creation', async () => {
    const data = parseTelemetryPayload(rawPayload());
    const racingAlertRepo = {
      findActiveAlert: jest.fn().mockResolvedValue(null),
      create: (alert) => alertRepository.create(alert),
      resolveAlertsBySensor: (sensorId) => alertRepository.resolveAlertsBySensor(sensorId),
    };
    const { processor, io } = buildProcessor({ alertRepo: racingAlertRepo });

    await Promise.all([
      processor.process(data, { io, messageId: 'race-1', source: 'azure' }),
      processor.process(data, { io, messageId: 'race-2', source: 'azure' }),
    ]);

    expect(await Reading.countDocuments({ sensorId: 'TEMP-01' })).toBe(2);
    expect(await Alert.countDocuments({ sensorId: 'TEMP-01', resolved: false })).toBe(1);
    expect(io.emit.mock.calls.filter(([event]) => event === 'alert:new')).toHaveLength(1);
  });

  it('resolves active alerts when a normal reading arrives', async () => {
    const warning = parseTelemetryPayload(rawPayload());
    const normal = parseTelemetryPayload(rawPayload({ value: 20 }));
    const { processor, io } = buildProcessor();

    await processor.process(warning, { io, source: 'local' });
    expect(await Alert.countDocuments({ sensorId: 'TEMP-01', resolved: false })).toBe(1);

    await processor.process(normal, { io, source: 'local' });

    expect(await Alert.countDocuments({ sensorId: 'TEMP-01', resolved: false })).toBe(0);
    expect(await Alert.countDocuments({ sensorId: 'TEMP-01', resolved: true })).toBe(1);
    expect(io.emit.mock.calls.filter(([event]) => event === 'alert:new')).toHaveLength(1);
  });
});
