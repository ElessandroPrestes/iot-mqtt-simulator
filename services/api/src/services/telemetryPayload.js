const Joi = require('joi');

const MAX_TELEMETRY_PAYLOAD_BYTES = 16 * 1024;
const MAX_MQTT_PAYLOAD_BYTES = MAX_TELEMETRY_PAYLOAD_BYTES;
const SENSOR_ID_PATTERN = /^[A-Z][A-Z0-9_-]{2,63}$/;
const TOPIC_PATTERN = /^factory\/sensors\/(temperature|pressure|humidity|vibration)\/([A-Z][A-Z0-9_-]{2,63})$/;
const UNIT_BY_TYPE = {
  temperature: '°C',
  pressure: 'bar',
  humidity: '%',
  vibration: 'mm/s',
};

const metadataSchema = Joi.object()
  .pattern(
    /^(?!__proto__$|prototype$|constructor$)[a-zA-Z][a-zA-Z0-9_-]{0,31}$/,
    Joi.string().max(128)
  )
  .max(10)
  .unknown(false)
  .default({});

const payloadSchema = Joi.object({
  sensorId: Joi.string().pattern(SENSOR_ID_PATTERN).required(),
  type: Joi.string().valid(...Object.keys(UNIT_BY_TYPE)).required(),
  value: Joi.number().min(-1_000_000).max(1_000_000).required(),
  unit: Joi.string().max(16).required(),
  isAnomaly: Joi.boolean().default(false),
  timestamp: Joi.date().iso().required(),
  metadata: metadataSchema,
}).unknown(false);

function invalidMessage(reason) {
  const error = new Error('Invalid telemetry message');
  error.reason = reason;
  return error;
}

function toBuffer(payload) {
  if (Buffer.isBuffer(payload)) return payload;
  if (typeof payload === 'string') return Buffer.from(payload, 'utf8');
  return null;
}

function parseTelemetryPayload(payload, { now = Date.now(), maxBytes = MAX_TELEMETRY_PAYLOAD_BYTES } = {}) {
  const buffer = toBuffer(payload);
  if (!buffer || buffer.length > maxBytes) {
    throw invalidMessage('payload_size');
  }

  let parsed;
  try {
    parsed = JSON.parse(buffer.toString('utf8'));
  } catch {
    throw invalidMessage('json');
  }

  const { error, value } = payloadSchema.validate(parsed, {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
  });
  if (error) throw invalidMessage('schema');

  if (value.unit !== UNIT_BY_TYPE[value.type]) {
    throw invalidMessage('unit_mismatch');
  }

  const timestamp = value.timestamp.getTime();
  if (timestamp < now - 86_400_000 || timestamp > now + 300_000) {
    throw invalidMessage('timestamp');
  }

  return {
    ...value,
    sensorType: value.type,
    timestamp: value.timestamp,
  };
}

function parseMqttMessage(topic, payload, now = Date.now()) {
  if (!Buffer.isBuffer(payload) || payload.length > MAX_MQTT_PAYLOAD_BYTES) {
    throw invalidMessage('payload_size');
  }

  const topicMatch = TOPIC_PATTERN.exec(topic);
  if (!topicMatch) throw invalidMessage('topic');

  const data = parseTelemetryPayload(payload, { now });
  const [, sensorType, topicSensorId] = topicMatch;

  if (data.sensorId !== topicSensorId || data.type !== sensorType) {
    throw invalidMessage('topic_payload_mismatch');
  }

  return {
    ...data,
    sensorType,
  };
}

module.exports = {
  MAX_MQTT_PAYLOAD_BYTES,
  MAX_TELEMETRY_PAYLOAD_BYTES,
  SENSOR_ID_PATTERN,
  TOPIC_PATTERN,
  UNIT_BY_TYPE,
  invalidMessage,
  parseMqttMessage,
  parseTelemetryPayload,
};
