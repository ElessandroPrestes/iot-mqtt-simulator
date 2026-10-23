import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from '@jest/globals';
import { loadConfig } from '../src/config.js';

const directories = [];

function productionEnv() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-simulator-tls-'));
  directories.push(directory);
  const ca = path.join(directory, 'internal_ca');
  const cert = path.join(directory, 'simulator_client_cert');
  const key = path.join(directory, 'simulator_client_key');
  fs.writeFileSync(ca, 'test-internal-ca');
  fs.writeFileSync(cert, 'test-simulator-client-cert');
  fs.writeFileSync(key, 'test-simulator-client-key');

  return {
    NODE_ENV: 'production',
    MQTT_BROKER_HOST: 'broker',
    MQTT_BROKER_PORT: '8883',
    MQTT_CLIENT_ID_SIM: 'simulator',
    INTERNAL_CA_FILE: ca,
    SIMULATOR_CLIENT_CERT_FILE: cert,
    SIMULATOR_CLIENT_KEY_FILE: key,
  };
}

function azureProductionEnv() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-simulator-azure-'));
  directories.push(directory);
  const connectionString = path.join(directory, 'azure_connection_string');
  fs.writeFileSync(
    connectionString,
    'HostName=test.azure-devices.net;DeviceId=simulator-gateway;SharedAccessKey=secret'
  );

  return {
    NODE_ENV: 'production',
    TELEMETRY_TRANSPORT: 'azure',
    AZURE_IOT_HUB_DEVICE_CONNECTION_STRING_FILE: connectionString,
  };
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('simulator production configuration', () => {
  it('requires a verified MQTT client identity without a password', () => {
    const config = loadConfig(productionEnv());

    expect(config.mqtt).toEqual(expect.objectContaining({
      protocol: 'mqtts',
      host: 'broker',
      port: 8883,
      ca: 'test-internal-ca',
      cert: 'test-simulator-client-cert',
      key: 'test-simulator-client-key',
      rejectUnauthorized: true,
    }));
    expect(config.mqtt).not.toHaveProperty('username');
    expect(config.mqtt).not.toHaveProperty('password');
  });

  it('rejects password credentials and missing certificates in production', () => {
    expect(() => loadConfig({
      ...productionEnv(),
      MQTT_PASSWORD: 'legacy-password',
    })).toThrow(/password/i);

    const missingKey = productionEnv();
    delete missingKey.SIMULATOR_CLIENT_KEY_FILE;
    expect(() => loadConfig(missingKey)).toThrow(/SIMULATOR_CLIENT_KEY/);
  });

  it('does not require MQTT certificates when Azure is the transport', () => {
    const config = loadConfig(azureProductionEnv());

    expect(config.transport).toBe('azure');
    expect(config.mqtt).not.toHaveProperty('ca');
    expect(config.mqtt).not.toHaveProperty('cert');
    expect(config.mqtt).not.toHaveProperty('key');
    expect(config.azure.connectionString).toContain('DeviceId=simulator-gateway');
  });
});

describe('simulator transport and telemetry configuration', () => {
  const baseEnv = {
    MQTT_BROKER_HOST: 'localhost',
    MQTT_BROKER_PORT: '1883',
    MQTT_USERNAME: 'iotuser',
    MQTT_PASSWORD: 'iotpassword',
  };

  it('defaults to the local transport and documented sensor count', () => {
    const config = loadConfig(baseEnv);

    expect(config.transport).toBe('local');
    expect(config.simulator.sensorsCount).toBe(8);
    expect(config.simulator.intervalMs).toBe(2000);
    expect(config.simulator.anomalyProbability).toBe(0.05);
    expect(config.azure.connectionString).toBeUndefined();
  });

  it('accepts the azure transport and numeric overrides', () => {
    const config = loadConfig({
      ...baseEnv,
      TELEMETRY_TRANSPORT: 'azure',
      AZURE_IOT_HUB_DEVICE_CONNECTION_STRING:
        'HostName=test.azure-devices.net;DeviceId=simulator-gateway;SharedAccessKey=secret',
      AZURE_IOT_HUB_DEVICE_ID: 'gateway-test',
      AZURE_DAILY_MESSAGE_BUDGET: '12000',
      AZURE_ALLOW_OVERAGE: 'true',
      SIMULATOR_SENSORS_COUNT: '12',
      SIMULATOR_INTERVAL_MS: '5000',
      SIMULATOR_ANOMALY_PROBABILITY: '0.25',
    });

    expect(config.transport).toBe('azure');
    expect(config.azure).toEqual({
      connectionString:
        'HostName=test.azure-devices.net;DeviceId=simulator-gateway;SharedAccessKey=secret',
      deviceId: 'gateway-test',
      dailyMessageBudget: 12000,
      allowOverage: true,
    });
    expect(config.simulator.sensorsCount).toBe(12);
    expect(config.simulator.intervalMs).toBe(5000);
    expect(config.simulator.anomalyProbability).toBe(0.25);
  });

  it('ignores Azure-only settings when the local transport is active', () => {
    const config = loadConfig({
      ...baseEnv,
      AZURE_DAILY_MESSAGE_BUDGET: 'not-a-number',
      AZURE_ALLOW_OVERAGE: 'maybe',
    });

    expect(config.transport).toBe('local');
    expect(config.azure.dailyMessageBudget).toBe(8000);
    expect(config.azure.allowOverage).toBe(false);
  });

  it('accepts long intervals needed to stay within the Azure free tier', () => {
    const config = loadConfig({
      ...baseEnv,
      SIMULATOR_INTERVAL_MS: '120000',
    });

    expect(config.simulator.intervalMs).toBe(120000);
  });

  it('uses documented Azure defaults', () => {
    const config = loadConfig({
      ...baseEnv,
      TELEMETRY_TRANSPORT: 'azure',
      AZURE_IOT_HUB_DEVICE_CONNECTION_STRING:
        'HostName=test.azure-devices.net;DeviceId=simulator-gateway;SharedAccessKey=secret',
    });

    expect(config.azure.deviceId).toBe('simulator-gateway');
    expect(config.azure.dailyMessageBudget).toBe(8000);
    expect(config.azure.allowOverage).toBe(false);
  });

  it('requires an Azure connection string when Azure is selected', () => {
    expect(() => loadConfig({
      ...baseEnv,
      TELEMETRY_TRANSPORT: 'azure',
    })).toThrow(/AZURE_IOT_HUB_DEVICE_CONNECTION_STRING/);
  });

  it('rejects an unsupported transport', () => {
    expect(() => loadConfig({
      ...baseEnv,
      TELEMETRY_TRANSPORT: 'mqtt',
    })).toThrow(/TELEMETRY_TRANSPORT/);
  });

  it('rejects invalid simulator counts, intervals and probabilities', () => {
    expect(() => loadConfig({
      ...baseEnv,
      SIMULATOR_SENSORS_COUNT: '0',
    })).toThrow(/SIMULATOR_SENSORS_COUNT/);

    expect(() => loadConfig({
      ...baseEnv,
      SIMULATOR_SENSORS_COUNT: '8abc',
    })).toThrow(/SIMULATOR_SENSORS_COUNT/);

    expect(() => loadConfig({
      ...baseEnv,
      SIMULATOR_INTERVAL_MS: '0',
    })).toThrow(/SIMULATOR_INTERVAL_MS/);

    expect(() => loadConfig({
      ...baseEnv,
      SIMULATOR_ANOMALY_PROBABILITY: '1.5',
    })).toThrow(/SIMULATOR_ANOMALY_PROBABILITY/);
  });

  it('rejects invalid Azure budget settings', () => {
    const azureEnv = {
      ...baseEnv,
      TELEMETRY_TRANSPORT: 'azure',
      AZURE_IOT_HUB_DEVICE_CONNECTION_STRING:
        'HostName=test.azure-devices.net;DeviceId=simulator-gateway;SharedAccessKey=secret',
    };

    expect(() => loadConfig({
      ...azureEnv,
      AZURE_DAILY_MESSAGE_BUDGET: '0',
    })).toThrow(/AZURE_DAILY_MESSAGE_BUDGET/);

    expect(() => loadConfig({
      ...azureEnv,
      AZURE_ALLOW_OVERAGE: 'maybe',
    })).toThrow(/AZURE_ALLOW_OVERAGE/);
  });
});
