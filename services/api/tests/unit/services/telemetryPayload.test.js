const {
  MAX_TELEMETRY_PAYLOAD_BYTES,
  parseMqttMessage,
  parseTelemetryPayload,
} = require('../../../src/services/telemetryPayload');

function payload(overrides = {}) {
  return {
    sensorId: 'TEMP-01',
    type: 'temperature',
    value: 25,
    unit: '°C',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function buffer(value) {
  return Buffer.from(JSON.stringify(value));
}

describe('telemetryPayload', () => {
  it('normalizes a valid payload independently of the topic', () => {
    const data = parseTelemetryPayload(buffer(payload({ metadata: { line: 'A' } })));

    expect(data).toEqual(expect.objectContaining({
      sensorId: 'TEMP-01',
      type: 'temperature',
      sensorType: 'temperature',
      value: 25,
      unit: '°C',
      isAnomaly: false,
      metadata: { line: 'A' },
    }));
    expect(data.timestamp).toBeInstanceOf(Date);
  });

  it('accepts a JSON string', () => {
    const data = parseTelemetryPayload(JSON.stringify(payload()));

    expect(data.sensorId).toBe('TEMP-01');
  });

  it('produces the same normalized data for MQTT and topic-independent parsing', () => {
    const raw = buffer(payload());
    const direct = parseTelemetryPayload(raw);
    const mqtt = parseMqttMessage('factory/sensors/temperature/TEMP-01', raw);

    expect(mqtt).toEqual({ ...direct, sensorType: 'temperature' });
  });

  it.each([
    ['invalid JSON', Buffer.from('{')],
    ['non-buffer input', payload()],
    ['oversized payload', Buffer.alloc(MAX_TELEMETRY_PAYLOAD_BYTES + 1)],
    ['unit mismatch', buffer(payload({ unit: 'bar' }))],
    ['unknown property', buffer(payload({ $where: 'sleep(1000)' }))],
    ['stale timestamp', buffer(payload({ timestamp: new Date(Date.now() - 86_400_001).toISOString() }))],
    ['future timestamp', buffer(payload({ timestamp: new Date(Date.now() + 360_000).toISOString() }))],
  ])('rejects %s', (_case, raw) => {
    expect(() => parseTelemetryPayload(raw)).toThrow();
  });

  it('rejects topic and payload mismatches', () => {
    expect(() => parseMqttMessage(
      'factory/sensors/pressure/TEMP-01',
      buffer(payload())
    )).toThrow(/Invalid telemetry message/);

    expect(() => parseMqttMessage(
      'factory/sensors/temperature/PRES-01',
      buffer(payload())
    )).toThrow(/Invalid telemetry message/);

    expect(() => parseMqttMessage('../admin', buffer(payload())))
      .toThrow(/Invalid telemetry message/);
  });
});
