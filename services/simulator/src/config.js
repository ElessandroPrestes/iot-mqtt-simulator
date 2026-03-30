import 'dotenv/config';

export const config = {
  mqtt: {
    host: process.env.MQTT_BROKER_HOST || 'localhost',
    port: parseInt(process.env.MQTT_BROKER_PORT) || 1883,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
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
