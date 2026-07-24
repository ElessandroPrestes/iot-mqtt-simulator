import 'dotenv/config';
import { readFileSync } from 'node:fs';

const APPROVED_TLS_CIPHERS = [
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'TLS_AES_128_GCM_SHA256',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES128-GCM-SHA256',
].join(':');

function secretValue(env, name) {
  const file = env[`${name}_FILE`];
  if (file) return readFileSync(file, 'utf8').trim();
  if (env.NODE_ENV === 'production' && env[name]) {
    throw new Error(`${name} must be provided through ${name}_FILE in production`);
  }
  return env[name];
}

function requiredFile(env, name) {
  const value = secretValue(env, name);
  if (!value) throw new Error(`${name}_FILE is required in production`);
  return value;
}

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  if (production && [
    'MQTT_USERNAME',
    'MQTT_PASSWORD',
    'MQTT_USERNAME_FILE',
    'MQTT_PASSWORD_FILE',
  ].some((name) => env[name])) {
    throw new Error('MQTT password credentials are not allowed in production; use mTLS');
  }

  const mqtt = {
    host: env.MQTT_BROKER_HOST || 'localhost',
    port: Number.parseInt(env.MQTT_BROKER_PORT, 10) || (production ? 8883 : 1883),
    clientId: env.MQTT_CLIENT_ID_SIM || `simulator-${Date.now()}`,
    protocol: production ? 'mqtts' : 'mqtt',
  };

  if (production) {
    Object.assign(mqtt, {
      ca: requiredFile(env, 'INTERNAL_CA'),
      cert: requiredFile(env, 'SIMULATOR_CLIENT_CERT'),
      key: requiredFile(env, 'SIMULATOR_CLIENT_KEY'),
      rejectUnauthorized: true,
      ciphers: APPROVED_TLS_CIPHERS,
    });
  } else {
    mqtt.username = secretValue(env, 'MQTT_USERNAME');
    mqtt.password = secretValue(env, 'MQTT_PASSWORD');
  }

  return {
    mqtt,
    simulator: {
      intervalMs: Number.parseInt(env.SIMULATOR_INTERVAL_MS, 10) || 2000,
      sensorsCount: Number.parseInt(env.SIMULATOR_SENSORS_COUNT, 10) || 8,
      anomalyProbability: Number.parseFloat(env.SIMULATOR_ANOMALY_PROBABILITY) || 0.05,
    },
    topics: {
      temperature: 'factory/sensors/temperature',
      pressure: 'factory/sensors/pressure',
      humidity: 'factory/sensors/humidity',
      vibration: 'factory/sensors/vibration',
    },
  };
}

export const config = loadConfig();
