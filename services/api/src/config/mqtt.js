const fs = require('fs');
const mqtt = require('mqtt');
const logger = require('../utils/logger');

function createClient() {
  const isAWS = !!process.env.AWS_IOT_ENDPOINT;

  if (isAWS) {
    logger.info('Connecting to AWS IoT Core...');
    return mqtt.connect(`mqtts://${process.env.AWS_IOT_ENDPOINT}:8883`, {
      key:  fs.readFileSync(process.env.AWS_IOT_KEY_PATH),
      cert: fs.readFileSync(process.env.AWS_IOT_CERT_PATH),
      ca:   fs.readFileSync(process.env.AWS_IOT_CA_PATH),
      clientId: process.env.MQTT_CLIENT_ID_API || `api-${Date.now()}`,
      clean: true,
    });
  }

  logger.info('Connecting to local Mosquitto broker...');
  return mqtt.connect(`mqtt://${process.env.MQTT_BROKER_HOST}:${process.env.MQTT_BROKER_PORT}`, {
    clientId: process.env.MQTT_CLIENT_ID_API || `api-${Date.now()}`,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });
}

module.exports = { createClient };
