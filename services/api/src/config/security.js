const fs = require('fs');
const Joi = require('joi');

const TEST_SECRET = 'test-only-jwt-secret-with-32-bytes-minimum';
const ROLES = ['viewer', 'operator'];

function readSecretFile(filePath, label) {
  if (!filePath) return undefined;

  try {
    const value = fs.readFileSync(filePath, 'utf8').trim();
    if (!value) throw new Error(`${label} file is empty`);
    return value;
  } catch (error) {
    throw new Error(`Unable to read ${label} file: ${error.message}`);
  }
}

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
}

function parseOrigins(rawOrigins, environment) {
  const fallback = environment === 'test'
    ? ['http://localhost']
    : ['http://localhost:5173', 'http://localhost:8080'];

  const origins = (rawOrigins ? rawOrigins.split(',') : fallback)
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (environment === 'production' && (!origins.length || origins.includes('*'))) {
    throw new Error('CORS_ORIGINS must be an explicit allowlist in production');
  }

  return origins;
}

function parsePrincipals(env, environment) {
  const fileValue = readSecretFile(env.AUTH_PRINCIPALS_FILE, 'AUTH_PRINCIPALS');

  if (environment === 'production' && env.AUTH_PRINCIPALS_JSON) {
    throw new Error('AUTH_PRINCIPALS_JSON is not allowed in production; use AUTH_PRINCIPALS_FILE');
  }

  const raw = fileValue || env.AUTH_PRINCIPALS_JSON;
  if (!raw) {
    if (environment === 'production') {
      throw new Error('AUTH_PRINCIPALS_FILE is required in production');
    }
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`AUTH_PRINCIPALS must contain valid JSON: ${error.message}`);
  }

  const schema = Joi.array().min(1).items(
    Joi.object({
      id: Joi.string().pattern(/^[a-zA-Z0-9_-]{3,64}$/).required(),
      username: Joi.string().min(3).max(64).pattern(/^[a-zA-Z0-9._-]+$/).required(),
      passwordHash: Joi.string().pattern(/^\$argon2id\$/).required(),
      role: Joi.string().valid(...ROLES).required(),
      enabled: Joi.boolean().default(true),
    }).unknown(false)
  );

  const { error, value } = schema.validate(parsed, { abortEarly: false });
  if (error) {
    throw new Error(`AUTH_PRINCIPALS is invalid: ${error.message}`);
  }

  const usernames = new Set();
  const ids = new Set();
  for (const principal of value) {
    const username = principal.username.toLowerCase();
    if (usernames.has(username) || ids.has(principal.id)) {
      throw new Error('AUTH_PRINCIPALS contains duplicated username or id');
    }
    usernames.add(username);
    ids.add(principal.id);
    principal.username = username;
  }

  return value;
}

function loadSecurityConfig(env = process.env) {
  const environment = env.NODE_ENV || 'development';
  const production = environment === 'production';

  const jwtSecret = readSecretFile(env.JWT_SECRET_FILE, 'JWT_SECRET')
    || env.JWT_SECRET
    || (environment === 'test' ? TEST_SECRET : undefined);

  const schema = Joi.object({
    jwtSecret: Joi.string().min(32).required(),
    jwtIssuer: Joi.string().min(3).max(200).required(),
    jwtAudience: Joi.string().min(3).max(200).required(),
    accessTokenTtlSeconds: Joi.number().integer().min(60).max(900).required(),
    refreshTokenTtlSeconds: Joi.number().integer().min(300).max(28800).required(),
    loginWindowMs: Joi.number().integer().min(60_000).required(),
    loginMaxAttempts: Joi.number().integer().min(1).max(20).required(),
  });

  const candidate = {
    jwtSecret,
    jwtIssuer: env.JWT_ISSUER || (production ? undefined : 'iot-mqtt-simulator-api'),
    jwtAudience: env.JWT_AUDIENCE || (production ? undefined : 'iot-mqtt-simulator-dashboard'),
    accessTokenTtlSeconds: Number(env.ACCESS_TOKEN_TTL_SECONDS || 900),
    refreshTokenTtlSeconds: Number(env.REFRESH_TOKEN_TTL_SECONDS || 28_800),
    loginWindowMs: Number(env.LOGIN_RATE_WINDOW_MS || 900_000),
    loginMaxAttempts: Number(env.LOGIN_RATE_MAX || 5),
  };

  const { error, value } = schema.validate(candidate, { abortEarly: false });
  if (error) {
    throw new Error(`Invalid security configuration: ${error.message}`);
  }

  return Object.freeze({
    ...value,
    environment,
    production,
    principals: parsePrincipals(env, environment),
    corsOrigins: parseOrigins(env.CORS_ORIGINS, environment),
    swaggerEnabled: parseBoolean(env.SWAGGER_ENABLED, !production),
    trustProxy: production ? 1 : false,
    refreshCookieName: production ? '__Host-refresh' : 'refresh_token',
    secureCookies: production,
  });
}

module.exports = {
  ROLES,
  loadSecurityConfig,
  parseOrigins,
  parsePrincipals,
  readSecretFile,
};
