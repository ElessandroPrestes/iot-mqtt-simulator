require('dotenv').config();

module.exports = {
  env:  process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT) || 3000,
  host: process.env.API_HOST || '0.0.0.0',

  mongo: {
    uri:    process.env.MONGODB_URI    || 'mongodb://localhost:27017/iot_dashboard',
    dbName: process.env.MONGODB_DB_NAME || 'iot_dashboard',
  },

  mqtt: {
    host:     process.env.MQTT_BROKER_HOST || 'localhost',
    port:     parseInt(process.env.MQTT_BROKER_PORT) || 1883,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID_API || `api-${Date.now()}`,
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
  },

  log: {
    level:  process.env.LOG_LEVEL  || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};
