const mqttService = require('../../../src/services/mqttService');
const mqtt = require('mqtt');
const strategyContext = require('../../../src/strategies/thresholdStrategy');
const readingRepository = require('../../../src/repositories/readingRepository');
const alertRepository = require('../../../src/repositories/alertRepository');
const {
  alertsTotal,
  mqttMessagesRejectedTotal,
} = require('../../../src/services/metricsService');

jest.mock('mqtt');
jest.mock('../../../src/strategies/thresholdStrategy');
jest.mock('../../../src/repositories/readingRepository');
jest.mock('../../../src/repositories/alertRepository');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../../src/services/metricsService', () => ({
  mqttMessagesTotal: { inc: jest.fn() },
  mqttMessagesRejectedTotal: { inc: jest.fn() },
  sensorValueGauge: { set: jest.fn() },
  alertsTotal: { inc: jest.fn() }
}));

describe('mqttService', () => {
  let mockClient;
  let messageHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      on: jest.fn((event, handler) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      }),
      subscribe: jest.fn(),
    };
    mqtt.connect.mockReturnValue(mockClient);

    readingRepository.create.mockResolvedValue({ id: 'r1', toObject: () => ({ id: 'r1' }) });
    alertRepository.create.mockResolvedValue({ id: 'a1', toObject: () => ({ id: 'a1' }) });
    alertRepository.resolveAlertsBySensor.mockResolvedValue({ modifiedCount: 1 });
  });

  it('connects to broker and sets up listeners', () => {
    mqttService.init({});
    expect(mqtt.connect).toHaveBeenCalled();
    expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('creates an alert if status is not normal and no active alert exists', async () => {
    mqttService.init({});
    strategyContext.classify.mockReturnValue('warning');
    alertRepository.findActiveAlert.mockResolvedValue(null);

    const payload = JSON.stringify({
      sensorId: 'TEMP-01',
      type: 'temperature',
      value: 50,
      unit: '°C',
      timestamp: new Date().toISOString(),
    });
    await messageHandler('factory/sensors/temperature/TEMP-01', Buffer.from(payload));

    expect(alertRepository.findActiveAlert).toHaveBeenCalledWith('TEMP-01', 'warning');
    expect(alertRepository.create).toHaveBeenCalled();
    expect(alertsTotal.inc).toHaveBeenCalledWith({ level: 'warning', sensor_type: 'temperature' });
  });

  it('does not create an alert if status is not normal but active alert exists', async () => {
    mqttService.init({});
    strategyContext.classify.mockReturnValue('warning');
    alertRepository.findActiveAlert.mockResolvedValue({ id: 'existing-alert' });

    const payload = JSON.stringify({
      sensorId: 'TEMP-01',
      type: 'temperature',
      value: 50,
      unit: '°C',
      timestamp: new Date().toISOString(),
    });
    await messageHandler('factory/sensors/temperature/TEMP-01', Buffer.from(payload));

    expect(alertRepository.findActiveAlert).toHaveBeenCalledWith('TEMP-01', 'warning');
    expect(alertRepository.create).not.toHaveBeenCalled();
    expect(alertsTotal.inc).not.toHaveBeenCalled();
  });

  it('resolves active alerts if status is normal', async () => {
    mqttService.init({});
    strategyContext.classify.mockReturnValue('normal');

    const payload = JSON.stringify({
      sensorId: 'TEMP-02',
      type: 'temperature',
      value: 25,
      unit: '°C',
      timestamp: new Date().toISOString(),
    });
    await messageHandler('factory/sensors/temperature/TEMP-02', Buffer.from(payload));

    expect(alertRepository.resolveAlertsBySensor).toHaveBeenCalledWith('TEMP-02');
    expect(alertRepository.create).not.toHaveBeenCalled();
  });

  it.each([
    ['invalid JSON', 'factory/sensors/temperature/TEMP-01', Buffer.from('{')],
    ['invalid topic', '../admin', Buffer.from('{}')],
    [
      'mismatched sensor',
      'factory/sensors/temperature/TEMP-01',
      Buffer.from(JSON.stringify({
        sensorId: 'TEMP-02',
        type: 'temperature',
        value: 20,
        unit: '°C',
        timestamp: new Date().toISOString(),
      })),
    ],
    [
      'unknown property',
      'factory/sensors/temperature/TEMP-01',
      Buffer.from(JSON.stringify({
        sensorId: 'TEMP-01',
        type: 'temperature',
        value: 20,
        unit: '°C',
        timestamp: new Date().toISOString(),
        $where: 'sleep(1000)',
      })),
    ],
    [
      'oversized payload',
      'factory/sensors/temperature/TEMP-01',
      Buffer.alloc(mqttService.MAX_MQTT_PAYLOAD_BYTES + 1),
    ],
  ])('rejects %s without persistence or broadcast', async (_case, topic, payload) => {
    const socketIo = { emit: jest.fn() };
    mqttService.init(socketIo);

    await messageHandler(topic, payload);

    expect(readingRepository.create).not.toHaveBeenCalled();
    expect(alertRepository.create).not.toHaveBeenCalled();
    expect(socketIo.emit).not.toHaveBeenCalled();
    expect(mqttMessagesRejectedTotal.inc).toHaveBeenCalled();
  });
});
