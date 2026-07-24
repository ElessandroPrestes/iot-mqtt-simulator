const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadRuntimeConfig } = require('../../../src/config/runtime');

function productionEnv(directory) {
  const files = {
    mongo: path.join(directory, 'mongodb_uri'),
    ca: path.join(directory, 'internal_ca'),
    clientCert: path.join(directory, 'api_client_cert'),
    clientKey: path.join(directory, 'api_client_key'),
    serverCert: path.join(directory, 'api_server_cert'),
    serverKey: path.join(directory, 'api_server_key'),
  };
  fs.writeFileSync(
    files.mongo,
    'mongodb://CN%3Dapi-processor@mongo:27017/iot_dashboard'
      + '?authSource=%24external&authMechanism=MONGODB-X509&tls=true'
  );
  fs.writeFileSync(files.ca, 'test-internal-ca');
  fs.writeFileSync(files.clientCert, 'test-api-client-cert');
  fs.writeFileSync(files.clientKey, 'test-api-client-key');
  fs.writeFileSync(files.serverCert, 'test-api-server-cert');
  fs.writeFileSync(files.serverKey, 'test-api-server-key');

  return {
    NODE_ENV: 'production',
    API_PORT: '3000',
    MONGODB_URI_FILE: files.mongo,
    MONGODB_DB_NAME: 'iot_dashboard',
    MQTT_BROKER_HOST: 'broker',
    MQTT_BROKER_PORT: '8883',
    MQTT_CLIENT_ID_API: 'api-processor',
    INTERNAL_CA_FILE: files.ca,
    API_CLIENT_CERT_FILE: files.clientCert,
    API_CLIENT_KEY_FILE: files.clientKey,
    API_TLS_CERT_FILE: files.serverCert,
    API_TLS_KEY_FILE: files.serverKey,
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

  it('loads production X.509 identities from mounted files', () => {
    const config = loadRuntimeConfig(productionEnv(directory));

    expect(config.mongo.uri).toContain('authMechanism=MONGODB-X509');
    expect(config.mongo.tls).toEqual({
      ca: 'test-internal-ca',
      cert: 'test-api-client-cert',
      key: 'test-api-client-key',
    });
    expect(config.mqtt).toEqual(expect.objectContaining({
      protocol: 'mqtts',
      port: 8883,
      ca: 'test-internal-ca',
      cert: 'test-api-client-cert',
      key: 'test-api-client-key',
      rejectUnauthorized: true,
      ciphers: expect.stringContaining('ECDHE-RSA-AES256-GCM-SHA384'),
    }));
    expect(config.mqtt).not.toHaveProperty('username');
    expect(config.mqtt).not.toHaveProperty('password');
    expect(config.apiTls).toEqual({
      ca: 'test-internal-ca',
      cert: 'test-api-server-cert',
      key: 'test-api-server-key',
      requestCert: true,
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      ciphers: expect.stringContaining('TLS_AES_256_GCM_SHA384'),
    });
  });

  it('rejects legacy MQTT passwords in production', () => {
    const env = {
      ...productionEnv(directory),
      MQTT_PASSWORD: 'inline-secret',
    };

    expect(() => loadRuntimeConfig(env)).toThrow(/password credentials are not allowed/);
  });

  it('rejects a production MongoDB URI without X.509 and verified TLS', () => {
    const env = productionEnv(directory);
    fs.writeFileSync(
      env.MONGODB_URI_FILE,
      'mongodb://iot-user:strong-db-password@mongo:27017/iot_dashboard'
    );

    expect(() => loadRuntimeConfig(env)).toThrow(/MONGODB-X509/);
  });

  it('fails closed when a production workload certificate is absent', () => {
    const env = productionEnv(directory);
    delete env.API_CLIENT_KEY_FILE;

    expect(() => loadRuntimeConfig(env)).toThrow(/apiClientKey/);
  });
});
