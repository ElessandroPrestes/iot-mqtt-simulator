const mqtt = require('mqtt');
const logger = require('../utils/logger');
const { TelemetryProcessor } = require('./telemetryProcessor');
const {
  MAX_MQTT_PAYLOAD_BYTES,
  parseMqttMessage,
} = require('./telemetryPayload');
const {
  mqttMessagesRejectedTotal,
  mqttMessagesTotal,
  telemetryIngressFailuresTotal,
  telemetryIngressReconnectsTotal,
  telemetryMessagesRejectedTotal,
  telemetryMessagesTotal,
  telemetryProcessingDurationSeconds,
} = require('./metricsService');

let io; // Socket.io instance
let connectionState = 'uninitialized';
const processor = new TelemetryProcessor();

function init(socketIo, mqttConfig = {
  host: process.env.MQTT_BROKER_HOST,
  port: process.env.MQTT_BROKER_PORT,
  clientId: process.env.MQTT_CLIENT_ID_API || `api-${Date.now()}`,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
}) {
  io = socketIo;

  const protocol = mqttConfig.protocol || 'mqtt';
  const secure = protocol === 'mqtts';
  const client = mqtt.connect(`${protocol}://${mqttConfig.host}:${mqttConfig.port}`, {
    clientId: mqttConfig.clientId,
    clean: true,
    connectTimeout: 10_000,
    reconnectPeriod: 5000,
    ...(secure
      ? {
          ca: mqttConfig.ca,
          cert: mqttConfig.cert,
          key: mqttConfig.key,
          rejectUnauthorized: mqttConfig.rejectUnauthorized,
          servername: mqttConfig.host,
          minVersion: 'TLSv1.2',
          ciphers: mqttConfig.ciphers,
        }
      : {
          username: mqttConfig.username,
          password: mqttConfig.password,
        }),
  });

  client.on('connect', () => {
    connectionState = 'connected';
    logger.info('MQTT connected to broker');
    const topics = [
      'factory/sensors/temperature/+',
      'factory/sensors/pressure/+',
      'factory/sensors/humidity/+',
      'factory/sensors/vibration/+',
    ];
    client.subscribe(topics, { qos: 1 }, (err) => {
      if (err) {
        telemetryIngressFailuresTotal.inc({ transport: 'local', reason: 'subscribe' });
        logger.error('MQTT subscribe error', { error: err.message });
      } else {
        logger.info('Subscribed to sensor topics', { topics });
      }
    });
  });

  client.on('message', async (topic, payload) => {
    const started = process.hrtime.bigint();
    try {
      const data = parseMqttMessage(topic, payload);

      mqttMessagesTotal.inc({
        sensor_type: data.sensorType,
        outcome: 'accepted',
      });
      telemetryMessagesTotal.inc({ transport: 'local', outcome: 'accepted' });

      const result = await processor.process(data, { io });
      telemetryMessagesTotal.inc({
        transport: 'local',
        outcome: result.duplicate ? 'duplicate' : 'processed',
      });
    } catch (err) {
      const reason = err.reason || 'processing';
      mqttMessagesTotal.inc({ sensor_type: 'unknown', outcome: 'rejected' });
      mqttMessagesRejectedTotal.inc({ reason });
      telemetryMessagesTotal.inc({ transport: 'local', outcome: 'rejected' });
      telemetryMessagesRejectedTotal.inc({ transport: 'local', reason });
      logger.warn('MQTT message rejected', {
        event: 'mqtt.message_rejected',
        reason,
      });
    } finally {
      telemetryProcessingDurationSeconds.observe(
        { transport: 'local' },
        Number(process.hrtime.bigint() - started) / 1e9
      );
    }
  });

  client.on('error', (err) => {
    connectionState = 'error';
    telemetryIngressFailuresTotal.inc({ transport: 'local', reason: 'mqtt_error' });
    logger.error('MQTT error', { error: err.message });
  });
  client.on('reconnect', () => {
    connectionState = 'reconnecting';
    telemetryIngressReconnectsTotal.inc({ transport: 'local' });
    logger.info('MQTT reconnecting...');
  });
  client.on('close', () => {
    connectionState = 'disconnected';
    logger.warn('MQTT connection closed');
  });

  return client;
}

function getStatus() {
  return {
    connected: connectionState === 'connected',
    status: connectionState,
  };
}

module.exports = {
  MAX_MQTT_PAYLOAD_BYTES,
  getStatus,
  init,
  parseMqttMessage,
};
