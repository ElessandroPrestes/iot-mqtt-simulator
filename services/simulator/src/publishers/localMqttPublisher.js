import mqtt from 'mqtt';
import { TelemetryPublisher } from './publisher.js';

export class LocalMqttPublisher extends TelemetryPublisher {
  constructor({ mqttConfig, logger, connect = mqtt.connect }) {
    super();
    this.mqttConfig = mqttConfig;
    this.logger = logger;
    this.connect = connect;
    this.client = null;
    this.ready = null;
    this.state = 'uninitialized';
  }

  start() {
    if (this.client) return this.ready;

    const protocol = this.mqttConfig.protocol || 'mqtt';
    const secure = protocol === 'mqtts';
    const options = {
      clientId: this.mqttConfig.clientId,
      clean: true,
      reconnectPeriod: 3000,
      ...(secure
        ? {
            ca: this.mqttConfig.ca,
            cert: this.mqttConfig.cert,
            key: this.mqttConfig.key,
            rejectUnauthorized: true,
            servername: this.mqttConfig.host,
            minVersion: 'TLSv1.2',
            ciphers: this.mqttConfig.ciphers,
          }
        : {
            username: this.mqttConfig.username,
            password: this.mqttConfig.password,
          }),
    };

    this.client = this.connect(
      `${protocol}://${this.mqttConfig.host}:${this.mqttConfig.port}`,
      options
    );

    this.ready = new Promise((resolve, reject) => {
      let settled = false;

      this.client.on('connect', () => {
        this.state = 'connected';
        this.logger.info('MQTT connected to broker');
        if (!settled) {
          settled = true;
          resolve();
        }
      });

      this.client.on('error', (err) => {
        this.state = 'error';
        this.logger.error('MQTT connection error', { error: err.message });
        if (!settled) {
          settled = true;
          reject(err);
        }
      });

      this.client.on('reconnect', () => {
        this.state = 'reconnecting';
        this.logger.info('Reconnecting to MQTT broker');
      });

      this.client.on('close', () => {
        this.state = 'disconnected';
      });
    });

    return this.ready;
  }

  publish(topic, payload) {
    if (!this.client) {
      return Promise.reject(new Error('MQTT publisher is not started'));
    }

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async stop() {
    const client = this.client;
    if (!client) return;

    this.client = null;
    this.state = 'stopped';

    await new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        resolve();
      };

      client.end(false, {}, finish);
      const timeout = setTimeout(finish, 2000);
      timeout.unref?.();
    });
  }

  getStatus() {
    return { state: this.state };
  }
}
