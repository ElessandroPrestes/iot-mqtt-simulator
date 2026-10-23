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

const TRANSPORTS = new Set(['local', 'azure']);

function parseTransport(env) {
  const value = (env.TELEMETRY_TRANSPORT || 'local').trim().toLowerCase();
  if (!TRANSPORTS.has(value)) {
    throw new Error('TELEMETRY_TRANSPORT must be "local" or "azure"');
  }
  return value;
}

function positiveInteger(env, name, fallback, { min = 1, max = 1_000_000_000 } = {}) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function probability(env, name, fallback) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a number between 0 and 1`);
  }
  return value;
}

function boolean(env, name, fallback) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;

  const value = raw.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`${name} must be "true" or "false"`);
}

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const transport = parseTransport(env);

  if (production && [
    'MQTT_USERNAME',
    'MQTT_PASSWORD',
    'MQTT_USERNAME_FILE',
    'MQTT_PASSWORD_FILE',
  ].some((name) => env[name])) {
    throw new Error('MQTT password credentials are not allowed in production; use mTLS');
  }

  const useLocalTls = production && transport === 'local';
  const mqtt = {
    host: env.MQTT_BROKER_HOST || 'localhost',
    port: Number.parseInt(env.MQTT_BROKER_PORT, 10) || (useLocalTls ? 8883 : 1883),
    clientId: env.MQTT_CLIENT_ID_SIM || `simulator-${Date.now()}`,
    protocol: useLocalTls ? 'mqtts' : 'mqtt',
  };

  if (useLocalTls) {
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

  const azureEnabled = transport === 'azure';
  const azure = {
    connectionString: azureEnabled
      ? secretValue(env, 'AZURE_IOT_HUB_DEVICE_CONNECTION_STRING')
      : undefined,
    deviceId: env.AZURE_IOT_HUB_DEVICE_ID || 'simulator-gateway',
    dailyMessageBudget: azureEnabled
      ? positiveInteger(env, 'AZURE_DAILY_MESSAGE_BUDGET', 8000)
      : 8000,
    allowOverage: azureEnabled ? boolean(env, 'AZURE_ALLOW_OVERAGE', false) : false,
  };

  if (azureEnabled && !azure.connectionString) {
    throw new Error(
      'AZURE_IOT_HUB_DEVICE_CONNECTION_STRING or AZURE_IOT_HUB_DEVICE_CONNECTION_STRING_FILE is required when TELEMETRY_TRANSPORT=azure'
    );
  }

  return {
    transport,
    mqtt,
    azure,
    simulator: {
      intervalMs: positiveInteger(env, 'SIMULATOR_INTERVAL_MS', 2000),
      sensorsCount: positiveInteger(env, 'SIMULATOR_SENSORS_COUNT', 8, { max: 100_000 }),
      anomalyProbability: probability(env, 'SIMULATOR_ANOMALY_PROBABILITY', 0.05),
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
