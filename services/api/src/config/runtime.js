const Joi = require('joi');
const { readSecretFile } = require('./security');

function secretValue(env, name) {
  return readSecretFile(env[`${name}_FILE`], name) || env[name];
}

function loadRuntimeConfig(env = process.env) {
  const environment = env.NODE_ENV || 'development';
  const production = environment === 'production';

  if (production) {
    for (const name of ['MONGODB_URI', 'MQTT_USERNAME', 'MQTT_PASSWORD']) {
      if (env[name]) {
        throw new Error(`${name} is not allowed inline in production; use ${name}_FILE`);
      }
    }
  }

  const candidate = {
    apiPort: Number(env.API_PORT || 3000),
    mongoUri: secretValue(env, 'MONGODB_URI'),
    mongoDbName: env.MONGODB_DB_NAME || 'iot_dashboard',
    mqttHost: env.MQTT_BROKER_HOST,
    mqttPort: Number(env.MQTT_BROKER_PORT || 1883),
    mqttUsername: secretValue(env, 'MQTT_USERNAME'),
    mqttPassword: secretValue(env, 'MQTT_PASSWORD'),
    mqttClientId: env.MQTT_CLIENT_ID_API,
  };

  const schema = Joi.object({
    apiPort: Joi.number().integer().min(1024).max(65535).required(),
    mongoUri: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
    mongoDbName: Joi.string().pattern(/^[a-zA-Z0-9_-]{1,64}$/).required(),
    mqttHost: Joi.string().hostname().required(),
    mqttPort: Joi.number().integer().min(1).max(65535).required(),
    mqttUsername: Joi.string().min(1).max(128).required(),
    mqttPassword: Joi.string().min(production ? 16 : 1).max(512).required(),
    mqttClientId: Joi.string().pattern(/^[a-zA-Z0-9_-]{3,64}$/).required(),
  });

  const { error, value } = schema.validate(candidate, { abortEarly: false });
  if (error) throw new Error(`Invalid runtime configuration: ${error.message}`);

  if (production) {
    const mongoUrl = new URL(value.mongoUri);
    if (!mongoUrl.username || !mongoUrl.password) {
      throw new Error('MONGODB_URI must include authentication in production');
    }
  }

  return Object.freeze({
    environment,
    production,
    apiPort: value.apiPort,
    mongo: {
      uri: value.mongoUri,
      dbName: value.mongoDbName,
    },
    mqtt: {
      host: value.mqttHost,
      port: value.mqttPort,
      username: value.mqttUsername,
      password: value.mqttPassword,
      clientId: value.mqttClientId,
    },
  });
}

module.exports = { loadRuntimeConfig, secretValue };
