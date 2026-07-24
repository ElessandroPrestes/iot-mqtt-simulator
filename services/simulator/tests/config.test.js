import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from '@jest/globals';
import { loadConfig } from '../src/config.js';

const directories = [];

function productionEnv() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iot-simulator-tls-'));
  directories.push(directory);
  const ca = path.join(directory, 'internal_ca');
  const cert = path.join(directory, 'simulator_client_cert');
  const key = path.join(directory, 'simulator_client_key');
  fs.writeFileSync(ca, 'test-internal-ca');
  fs.writeFileSync(cert, 'test-simulator-client-cert');
  fs.writeFileSync(key, 'test-simulator-client-key');

  return {
    NODE_ENV: 'production',
    MQTT_BROKER_HOST: 'broker',
    MQTT_BROKER_PORT: '8883',
    MQTT_CLIENT_ID_SIM: 'simulator',
    INTERNAL_CA_FILE: ca,
    SIMULATOR_CLIENT_CERT_FILE: cert,
    SIMULATOR_CLIENT_KEY_FILE: key,
  };
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('simulator production configuration', () => {
  it('requires a verified MQTT client identity without a password', () => {
    const config = loadConfig(productionEnv());

    expect(config.mqtt).toEqual(expect.objectContaining({
      protocol: 'mqtts',
      host: 'broker',
      port: 8883,
      ca: 'test-internal-ca',
      cert: 'test-simulator-client-cert',
      key: 'test-simulator-client-key',
      rejectUnauthorized: true,
    }));
    expect(config.mqtt).not.toHaveProperty('username');
    expect(config.mqtt).not.toHaveProperty('password');
  });

  it('rejects password credentials and missing certificates in production', () => {
    expect(() => loadConfig({
      ...productionEnv(),
      MQTT_PASSWORD: 'legacy-password',
    })).toThrow(/password/i);

    const missingKey = productionEnv();
    delete missingKey.SIMULATOR_CLIENT_KEY_FILE;
    expect(() => loadConfig(missingKey)).toThrow(/SIMULATOR_CLIENT_KEY/);
  });
});
