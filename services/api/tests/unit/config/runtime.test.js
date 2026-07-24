const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadRuntimeConfig } = require('../../../src/config/runtime');

function productionEnv(directory) {
  const files = {
    mongo: path.join(directory, 'mongodb_uri'),
    username: path.join(directory, 'mqtt_username'),
    password: path.join(directory, 'mqtt_password'),
  };
  fs.writeFileSync(files.mongo, 'mongodb://iot-user:strong-db-password@mongo:27017/iot_dashboard');
  fs.writeFileSync(files.username, 'api-processor');
  fs.writeFileSync(files.password, 'strong-mqtt-password');

  return {
    NODE_ENV: 'production',
    API_PORT: '3000',
    MONGODB_URI_FILE: files.mongo,
    MONGODB_DB_NAME: 'iot_dashboard',
    MQTT_BROKER_HOST: 'broker',
    MQTT_BROKER_PORT: '1883',
    MQTT_USERNAME_FILE: files.username,
    MQTT_PASSWORD_FILE: files.password,
    MQTT_CLIENT_ID_API: 'api-processor',
  };
}

describe('runtime configuration', () => {
  let directory;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-runtime-'));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('loads production credentials from mounted files', () => {
    const config = loadRuntimeConfig(productionEnv(directory));

    expect(config.mongo.uri).toContain('strong-db-password');
    expect(config.mqtt).toEqual(expect.objectContaining({
      username: 'api-processor',
      password: 'strong-mqtt-password',
    }));
  });

  it('rejects inline production credentials', () => {
    const env = {
      ...productionEnv(directory),
      MQTT_PASSWORD: 'inline-secret',
    };

    expect(() => loadRuntimeConfig(env)).toThrow(/not allowed inline/);
  });

  it('rejects an unauthenticated production MongoDB URI', () => {
    const env = productionEnv(directory);
    fs.writeFileSync(env.MONGODB_URI_FILE, 'mongodb://mongo:27017/iot_dashboard');

    expect(() => loadRuntimeConfig(env)).toThrow(/include authentication/);
  });
});
