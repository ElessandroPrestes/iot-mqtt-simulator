const Joi = require('joi');
const { readSecretFile } = require('./security');

const TRANSPORTS = ['local', 'azure'];

function secretValue(env, name) {
  return readSecretFile(env[`${name}_FILE`], name) || env[name];
}

function loadTelemetryConfig(env = process.env) {
  const transport = env.TELEMETRY_TRANSPORT || 'local';

  if (!TRANSPORTS.includes(transport)) {
    throw new Error('TELEMETRY_TRANSPORT must be local or azure');
  }

  if (transport === 'local') {
    return Object.freeze({ transport });
  }

  const candidate = {
    connectionString: secretValue(env, 'AZURE_EVENT_HUB_CONNECTION_STRING'),
    eventHubName: env.AZURE_EVENT_HUB_NAME,
    consumerGroup: env.AZURE_EVENT_HUB_CONSUMER_GROUP || '$Default',
  };

  const schema = Joi.object({
    connectionString: Joi.string().min(1).required(),
    eventHubName: Joi.string()
      .pattern(/^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$/)
      .required(),
    consumerGroup: Joi.string()
      .pattern(/^[A-Za-z0-9$][A-Za-z0-9$._-]{0,127}$/)
      .required(),
  });

  const { error, value } = schema.validate(candidate, { abortEarly: false });
  if (error) {
    throw new Error(`Invalid Azure Event Hubs configuration: ${error.message}`);
  }

  return Object.freeze({
    transport,
    eventHub: Object.freeze({
      connectionString: value.connectionString,
      eventHubName: value.eventHubName,
      consumerGroup: value.consumerGroup,
    }),
  });
}

module.exports = {
  TRANSPORTS,
  loadTelemetryConfig,
  secretValue,
};
