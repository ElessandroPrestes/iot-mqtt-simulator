import { randomUUID } from 'node:crypto';
import azureIotDevice from 'azure-iot-device';
import azureIotDeviceMqtt from 'azure-iot-device-mqtt';
import { TelemetryPublisher } from './publisher.js';

const { Client, Message } = azureIotDevice;
const { Mqtt } = azureIotDeviceMqtt;

export class AzureIotHubPublisher extends TelemetryPublisher {
  constructor({
    connectionString,
    deviceId,
    logger,
    createClient = (value) => Client.fromConnectionString(value, Mqtt),
    createMessage = (payload) => new Message(payload),
    newMessageId = randomUUID,
  }) {
    super();
    this.connectionString = connectionString;
    this.deviceId = deviceId;
    this.logger = logger;
    this.createClient = createClient;
    this.createMessage = createMessage;
    this.newMessageId = newMessageId;
    this.client = null;
    this.ready = null;
    this.state = 'uninitialized';
  }

  start() {
    if (this.client) return this.ready;

    this.state = 'connecting';

    try {
      this.client = this.createClient(this.connectionString);
    } catch (err) {
      this.state = 'error';
      return Promise.reject(err);
    }

    this.ready = Promise.resolve()
      .then(() => this.client.open())
      .then(() => {
        this.state = 'connected';
        this.logger.info('Azure IoT Hub connected', { deviceId: this.deviceId });
      })
      .catch((err) => {
        this.state = 'error';
        this.client = null;
        this.logger.error('Azure IoT Hub connection failed', {
          deviceId: this.deviceId,
          error: err.message,
        });
        throw err;
      });

    return this.ready;
  }

  async publish(topic, payload) {
    if (!this.client) {
      throw new Error('Azure IoT Hub publisher is not started');
    }

    const reading = JSON.parse(payload);
    const message = this.createMessage(payload);

    message.messageId = this.newMessageId();
    message.contentType = 'application/json';
    message.contentEncoding = 'utf-8';
    message.properties.add('sensorId', String(reading.sensorId));
    message.properties.add('sensorType', String(reading.type));
    message.properties.add('isAnomaly', String(Boolean(reading.isAnomaly)));
    message.properties.add('localTopic', topic);

    await this.client.sendEvent(message);
  }

  async stop() {
    const client = this.client;
    if (!client) return;

    this.client = null;
    this.state = 'stopped';

    try {
      await client.close();
    } catch (err) {
      this.logger.error('Azure IoT Hub close failed', {
        deviceId: this.deviceId,
        error: err.message,
      });
    }
  }

  getStatus() {
    return {
      state: this.state,
      deviceId: this.deviceId,
    };
  }
}
