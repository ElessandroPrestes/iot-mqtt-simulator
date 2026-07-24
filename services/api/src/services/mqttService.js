const mqtt = require('mqtt');
const Joi = require('joi');
const logger = require('../utils/logger');
const strategyContext = require('../strategies/thresholdStrategy');
const readingRepository = require('../repositories/readingRepository');
const alertRepository = require('../repositories/alertRepository');
const {
  mqttMessagesRejectedTotal,
  mqttMessagesTotal,
  sensorValueGauge,
  alertsTotal,
} = require('./metricsService');

let io; // Socket.io instance
let connectionState = 'uninitialized';

const MAX_MQTT_PAYLOAD_BYTES = 16 * 1024;
const SENSOR_ID_PATTERN = /^[A-Z][A-Z0-9_-]{2,63}$/;
const TOPIC_PATTERN = /^factory\/sensors\/(temperature|pressure|humidity|vibration)\/([A-Z][A-Z0-9_-]{2,63})$/;
const UNIT_BY_TYPE = {
  temperature: '°C',
  pressure: 'bar',
  humidity: '%',
  vibration: 'mm/s',
};

const metadataSchema = Joi.object()
  .pattern(
    /^(?!__proto__$|prototype$|constructor$)[a-zA-Z][a-zA-Z0-9_-]{0,31}$/,
    Joi.string().max(128)
  )
  .max(10)
  .unknown(false)
  .default({});

const payloadSchema = Joi.object({
  sensorId: Joi.string().pattern(SENSOR_ID_PATTERN).required(),
  type: Joi.string().valid(...Object.keys(UNIT_BY_TYPE)).required(),
  value: Joi.number().min(-1_000_000).max(1_000_000).required(),
  unit: Joi.string().max(16).required(),
  isAnomaly: Joi.boolean().default(false),
  timestamp: Joi.date().iso().required(),
  metadata: metadataSchema,
}).unknown(false);

function invalidMessage(reason) {
  const error = new Error('Invalid MQTT message');
  error.reason = reason;
  return error;
}

function parseMqttMessage(topic, payload, now = Date.now()) {
  if (!Buffer.isBuffer(payload) || payload.length > MAX_MQTT_PAYLOAD_BYTES) {
    throw invalidMessage('payload_size');
  }

  const topicMatch = TOPIC_PATTERN.exec(topic);
  if (!topicMatch) throw invalidMessage('topic');

  let parsed;
  try {
    parsed = JSON.parse(payload.toString('utf8'));
  } catch {
    throw invalidMessage('json');
  }

  const { error, value } = payloadSchema.validate(parsed, {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
  });
  if (error) throw invalidMessage('schema');

  const [, sensorType, topicSensorId] = topicMatch;
  if (value.sensorId !== topicSensorId || value.type !== sensorType) {
    throw invalidMessage('topic_payload_mismatch');
  }
  if (value.unit !== UNIT_BY_TYPE[sensorType]) {
    throw invalidMessage('unit_mismatch');
  }

  const timestamp = value.timestamp.getTime();
  if (timestamp < now - 86_400_000 || timestamp > now + 300_000) {
    throw invalidMessage('timestamp');
  }

  return {
    ...value,
    sensorType,
    timestamp: value.timestamp,
  };
}

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
      if (err) logger.error('MQTT subscribe error', { error: err.message });
      else logger.info('Subscribed to sensor topics', { topics });
    });
  });

  client.on('message', async (topic, payload) => {
    try {
      const data = parseMqttMessage(topic, payload);
      const { sensorType } = data;

      mqttMessagesTotal.inc({ sensor_type: sensorType, outcome: 'accepted' });

      const status = strategyContext.classify(sensorType, data.value);
      sensorValueGauge.set({ sensor_id: data.sensorId, sensor_type: sensorType, unit: data.unit }, data.value);

      // Persistência no MongoDB
      const reading = await readingRepository.create({
        sensorId:  data.sensorId,
        type:      sensorType,
        value:     data.value,
        unit:      data.unit,
        status,
        isAnomaly: data.isAnomaly,
        metadata:  data.metadata,
        timestamp: data.timestamp,
      });

      // Gerar ou resolver alertas
      if (status !== 'normal') {
        const existingAlert = await alertRepository.findActiveAlert(data.sensorId, status);
        if (!existingAlert) {
          alertsTotal.inc({ level: status, sensor_type: sensorType });
          const alert = await alertRepository.create({
            sensorId:  data.sensorId,
            type:      sensorType,
            level:     status,
            value:     data.value,
            unit:      data.unit,
            message:   `Sensor ${data.sensorId}: ${data.value}${data.unit} (${status.toUpperCase()})`,
            timestamp: data.timestamp,
          });
          io?.emit('alert:new', alert.toObject ? alert.toObject() : alert);
          logger.warn('Alert generated', { sensorId: data.sensorId, status, value: data.value });
        }
      } else {
        const result = await alertRepository.resolveAlertsBySensor(data.sensorId);
        if (result && result.modifiedCount > 0) {
          logger.info('Alerts auto-resolved', { sensorId: data.sensorId, count: result.modifiedCount });
        }
      }

      // Broadcast em tempo real via WebSocket
      io?.emit('reading:new', { ...(reading.toObject ? reading.toObject() : reading), status });

    } catch (err) {
      const reason = err.reason || 'processing';
      mqttMessagesTotal.inc({ sensor_type: 'unknown', outcome: 'rejected' });
      mqttMessagesRejectedTotal.inc({ reason });
      logger.warn('MQTT message rejected', {
        event: 'mqtt.message_rejected',
        reason,
      });
    }
  });

  client.on('error', (err) => {
    connectionState = 'error';
    logger.error('MQTT error', { error: err.message });
  });
  client.on('reconnect', () => {
    connectionState = 'reconnecting';
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
