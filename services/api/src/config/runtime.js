const Joi = require('joi');
const { readSecretFile } = require('./security');

const APPROVED_TLS_CIPHERS = [
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'TLS_AES_128_GCM_SHA256',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES128-GCM-SHA256',
].join(':');

function secretValue(env, name) {
  return readSecretFile(env[`${name}_FILE`], name) || env[name];
}

function loadRuntimeConfig(env = process.env) {
  const environment = env.NODE_ENV || 'development';
  const production = environment === 'production';

  if (production) {
    for (const name of [
      'MQTT_USERNAME',
      'MQTT_PASSWORD',
      'MQTT_USERNAME_FILE',
      'MQTT_PASSWORD_FILE',
    ]) {
      if (env[name]) {
        throw new Error('MQTT password credentials are not allowed in production; use mTLS');
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
    internalCa: readSecretFile(env.INTERNAL_CA_FILE, 'INTERNAL_CA'),
    apiClientCert: readSecretFile(env.API_CLIENT_CERT_FILE, 'API_CLIENT_CERT'),
    apiClientKey: readSecretFile(env.API_CLIENT_KEY_FILE, 'API_CLIENT_KEY'),
    apiServerCert: readSecretFile(env.API_TLS_CERT_FILE, 'API_TLS_CERT'),
    apiServerKey: readSecretFile(env.API_TLS_KEY_FILE, 'API_TLS_KEY'),
  };

  const schema = Joi.object({
    apiPort: Joi.number().integer().min(1024).max(65535).required(),
    mongoUri: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
    mongoDbName: Joi.string().pattern(/^[a-zA-Z0-9_-]{1,64}$/).required(),
    mqttHost: Joi.string().hostname().required(),
    mqttPort: Joi.number().integer().min(1).max(65535).required(),
    mqttUsername: production
      ? Joi.forbidden()
      : Joi.string().min(1).max(128).required(),
    mqttPassword: production
      ? Joi.forbidden()
      : Joi.string().min(1).max(512).required(),
    mqttClientId: Joi.string().pattern(/^[a-zA-Z0-9_-]{3,64}$/).required(),
    internalCa: production ? Joi.string().min(1).required() : Joi.optional(),
    apiClientCert: production ? Joi.string().min(1).required() : Joi.optional(),
    apiClientKey: production ? Joi.string().min(1).required() : Joi.optional(),
    apiServerCert: production ? Joi.string().min(1).required() : Joi.optional(),
    apiServerKey: production ? Joi.string().min(1).required() : Joi.optional(),
  });

  const { error, value } = schema.validate(candidate, { abortEarly: false });
  if (error) throw new Error(`Invalid runtime configuration: ${error.message}`);

  if (production) {
    const mongoUrl = new URL(value.mongoUri);
    if (!mongoUrl.username
      || mongoUrl.password
      || mongoUrl.searchParams.get('authMechanism') !== 'MONGODB-X509'
      || mongoUrl.searchParams.get('authSource') !== '$external'
      || mongoUrl.searchParams.get('tls') !== 'true') {
      throw new Error(
        'MONGODB_URI must use MONGODB-X509 through verified TLS in production'
      );
    }
  }

  const workloadTls = production
    ? {
        ca: value.internalCa,
        cert: value.apiClientCert,
        key: value.apiClientKey,
      }
    : undefined;

  return Object.freeze({
    environment,
    production,
    apiPort: value.apiPort,
    mongo: {
      uri: value.mongoUri,
      dbName: value.mongoDbName,
      ...(production ? { tls: workloadTls } : {}),
    },
    mqtt: {
      host: value.mqttHost,
      port: value.mqttPort,
      clientId: value.mqttClientId,
      protocol: production ? 'mqtts' : 'mqtt',
      ...(production
        ? {
            ...workloadTls,
            rejectUnauthorized: true,
            ciphers: APPROVED_TLS_CIPHERS,
          }
        : {
            username: value.mqttUsername,
            password: value.mqttPassword,
          }),
    },
    ...(production
      ? {
          apiTls: {
            ca: value.internalCa,
            cert: value.apiServerCert,
            key: value.apiServerKey,
            requestCert: true,
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2',
            ciphers: APPROVED_TLS_CIPHERS,
          },
        }
      : {}),
  });
}

module.exports = {
  APPROVED_TLS_CIPHERS,
  loadRuntimeConfig,
  secretValue,
};
