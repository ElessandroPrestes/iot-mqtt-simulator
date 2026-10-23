const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadTelemetryConfig } = require('../../../src/config/azure');
const { loadRuntimeConfig } = require('../../../src/config/runtime');

const CONNECTION_STRING = 'Endpoint=sb://example.servicebus.windows.net/;SharedAccessKeyName=listen;SharedAccessKey=secret-value';

describe('Azure telemetry configuration', () => {
  let directory;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-azure-config-'));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('defaults to local without requiring Azure configuration', () => {
    expect(loadTelemetryConfig({})).toEqual({ transport: 'local' });
    expect(loadTelemetryConfig({ TELEMETRY_TRANSPORT: 'local' })).toEqual({
      transport: 'local',
    });
  });

  it('rejects an unknown transport', () => {
    expect(() => loadTelemetryConfig({ TELEMETRY_TRANSPORT: 'aws' }))
      .toThrow('TELEMETRY_TRANSPORT must be local or azure');
  });

  it('loads an Azure Event Hubs connection from inline environment values', () => {
    const config = loadTelemetryConfig({
      TELEMETRY_TRANSPORT: 'azure',
      AZURE_EVENT_HUB_CONNECTION_STRING: CONNECTION_STRING,
      AZURE_EVENT_HUB_NAME: 'messages',
    });

    expect(config).toEqual({
      transport: 'azure',
      eventHub: {
        connectionString: CONNECTION_STRING,
        eventHubName: 'messages',
        consumerGroup: '$Default',
      },
    });
  });

  it('loads the connection string from a secret file', () => {
    const secretFile = path.join(directory, 'event_hub_connection_string');
    fs.writeFileSync(secretFile, `${CONNECTION_STRING}\n`);

    const config = loadTelemetryConfig({
      TELEMETRY_TRANSPORT: 'azure',
      AZURE_EVENT_HUB_CONNECTION_STRING_FILE: secretFile,
      AZURE_EVENT_HUB_NAME: 'messages',
      AZURE_EVENT_HUB_CONSUMER_GROUP: 'dashboard',
    });

    expect(config.eventHub).toEqual({
      connectionString: CONNECTION_STRING,
      eventHubName: 'messages',
      consumerGroup: 'dashboard',
    });
  });

  it('fails explicitly when Azure values are missing', () => {
    expect(() => loadTelemetryConfig({ TELEMETRY_TRANSPORT: 'azure' }))
      .toThrow(/connectionString/);
    expect(() => loadTelemetryConfig({
      TELEMETRY_TRANSPORT: 'azure',
      AZURE_EVENT_HUB_CONNECTION_STRING: CONNECTION_STRING,
    })).toThrow(/eventHubName/);
  });

  it('does not require MQTT settings in Azure mode', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://localhost:27017/iot_dashboard',
      TELEMETRY_TRANSPORT: 'azure',
      AZURE_EVENT_HUB_CONNECTION_STRING: CONNECTION_STRING,
      AZURE_EVENT_HUB_NAME: 'messages',
    });

    expect(config.transport).toBe('azure');
    expect(config.azure).toEqual({
      connectionString: CONNECTION_STRING,
      eventHubName: 'messages',
      consumerGroup: '$Default',
    });
    expect(config).not.toHaveProperty('mqtt');
  });
});
