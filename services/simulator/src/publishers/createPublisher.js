import { AzureIotHubPublisher } from './azureIotHubPublisher.js';
import { LocalMqttPublisher } from './localMqttPublisher.js';

export function createPublisher(config, logger, dependencies = {}) {
  if (config.transport === 'local') {
    return new LocalMqttPublisher({
      mqttConfig: config.mqtt,
      logger,
      ...dependencies,
    });
  }

  if (config.transport === 'azure') {
    return new AzureIotHubPublisher({
      connectionString: config.azure.connectionString,
      deviceId: config.azure.deviceId,
      logger,
      ...dependencies,
    });
  }

  throw new Error(`Unsupported telemetry transport: ${config.transport}`);
}
