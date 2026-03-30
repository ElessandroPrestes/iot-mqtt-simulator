const mqtt = require('mqtt');
const logger = require('../utils/logger');
const { classify } = require('../utils/thresholds');
const Reading = require('../models/Reading');
const Alert = require('../models/Alert');
const { mqttMessagesTotal, sensorValueGauge, alertsTotal } = require('./metricsService');

let io; // Socket.io instance

function init(socketIo) {
  io = socketIo;

  const client = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_HOST}:${process.env.MQTT_BROKER_PORT}`, {
    clientId: process.env.MQTT_CLIENT_ID_API || `api-${Date.now()}`,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clean: true,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
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
      const data = JSON.parse(payload.toString());
      const sensorType = topic.split('/')[2]; // temperature | pressure | ...

      mqttMessagesTotal.inc({ topic, sensor_type: sensorType });

      const status = classify(sensorType, data.value);
      sensorValueGauge.set({ sensor_id: data.sensorId, sensor_type: sensorType, unit: data.unit }, data.value);

      // Persistência no MongoDB
      const reading = await Reading.create({
        sensorId:  data.sensorId,
        type:      sensorType,
        value:     data.value,
        unit:      data.unit,
        status,
        isAnomaly: data.isAnomaly || false,
        metadata:  data.metadata || {},
        timestamp: new Date(data.timestamp),
      });

      // Gerar alerta se necessário
      if (status !== 'normal') {
        alertsTotal.inc({ level: status, sensor_type: sensorType });
        const alert = await Alert.create({
          sensorId:  data.sensorId,
          type:      sensorType,
          level:     status,
          value:     data.value,
          unit:      data.unit,
          message:   `Sensor ${data.sensorId}: ${data.value}${data.unit} (${status.toUpperCase()})`,
          timestamp: new Date(data.timestamp),
        });
        io?.emit('alert:new', alert.toObject());
        logger.warn('Alert generated', { sensorId: data.sensorId, status, value: data.value });
      }

      // Broadcast em tempo real via WebSocket
      io?.emit('reading:new', { ...reading.toObject(), status });

    } catch (err) {
      logger.error('Error processing MQTT message', { topic, error: err.message });
    }
  });

  client.on('error',     (err) => logger.error('MQTT error', { error: err.message }));
  client.on('reconnect', ()    => logger.info('MQTT reconnecting...'));
  client.on('close',     ()    => logger.warn('MQTT connection closed'));
}

module.exports = { init };
