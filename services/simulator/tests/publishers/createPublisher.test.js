import { describe, expect, it, jest } from '@jest/globals';
import { AzureIotHubPublisher } from '../../src/publishers/azureIotHubPublisher.js';
import { createPublisher } from '../../src/publishers/createPublisher.js';
import { LocalMqttPublisher } from '../../src/publishers/localMqttPublisher.js';

const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

const localConfig = {
  transport: 'local',
  mqtt: {
    host: 'broker',
    port: 1883,
    clientId: 'simulator',
    protocol: 'mqtt',
    username: 'iotuser',
    password: 'iotpassword',
  },
  azure: {
    connectionString:
      'HostName=test.azure-devices.net;DeviceId=simulator-gateway;SharedAccessKey=secret',
    deviceId: 'simulator-gateway',
  },
};

describe('createPublisher', () => {
  it('returns the local publisher for the local transport', () => {
    const publisher = createPublisher(localConfig, logger, {
      connect: jest.fn(),
    });

    expect(publisher).toBeInstanceOf(LocalMqttPublisher);
  });

  it('returns the Azure publisher for the Azure transport', () => {
    const publisher = createPublisher({ ...localConfig, transport: 'azure' }, logger, {
      createClient: jest.fn(),
    });

    expect(publisher).toBeInstanceOf(AzureIotHubPublisher);
    expect(publisher.connectionString).toBe(localConfig.azure.connectionString);
    expect(publisher.deviceId).toBe('simulator-gateway');
  });

  it('rejects unknown transports', () => {
    expect(() => createPublisher({ ...localConfig, transport: 'kafka' }, logger))
      .toThrow(/Unsupported telemetry transport/);
  });
});
