import 'dotenv/config';
import { readFileSync } from 'node:fs';

function secretValue(name) {
  const file = process.env[`${name}_FILE`];
  if (file) return readFileSync(file, 'utf8').trim();
  if (process.env.NODE_ENV === 'production' && process.env[name]) {
    throw new Error(`${name} must be provided through ${name}_FILE in production`);
  }
  return process.env[name];
}

const mqttUsername = secretValue('MQTT_USERNAME');
const mqttPassword = secretValue('MQTT_PASSWORD');
if (process.env.NODE_ENV === 'production'
  && (!mqttUsername || !mqttPassword || mqttPassword.length < 16)) {
  throw new Error('Production MQTT credentials are missing or weak');
}

export const config = {
  mqtt: {
    host: process.env.MQTT_BROKER_HOST || 'localhost',
    port: parseInt(process.env.MQTT_BROKER_PORT) || 1883,
    username: mqttUsername,
    password: mqttPassword,
    clientId: process.env.MQTT_CLIENT_ID_SIM || `simulator-${Date.now()}`,
  },
  simulator: {
    intervalMs: parseInt(process.env.SIMULATOR_INTERVAL_MS) || 2000,
    sensorsCount: parseInt(process.env.SIMULATOR_SENSORS_COUNT) || 8,
    anomalyProbability: parseFloat(process.env.SIMULATOR_ANOMALY_PROBABILITY) || 0.05,
  },
  topics: {
    temperature: 'factory/sensors/temperature',
    pressure: 'factory/sensors/pressure',
    humidity: 'factory/sensors/humidity',
    vibration: 'factory/sensors/vibration',
  },
};
