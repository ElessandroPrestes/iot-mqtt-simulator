jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/app', () => ({ createApp: jest.fn(() => 'app') }));
jest.mock('../../src/websocket/socketServer', () => ({
  createSocketServer: jest.fn(() => 'io'),
}));
jest.mock('../../src/config/security', () => ({
  loadSecurityConfig: jest.fn(() => ({})),
}));
jest.mock('../../src/config/runtime', () => ({
  loadRuntimeConfig: jest.fn(),
}));
jest.mock('../../src/ingress/createIngress', () => ({
  createIngress: jest.fn(),
}));
jest.mock('../../src/ingress/status', () => ({
  configureTransport: jest.fn(),
  setAzureIngressStatus: jest.fn(),
}));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../../src/utils/processLifecycle', () => ({
  installFatalProcessHandlers: jest.fn(),
}));

const http = require('http');
const https = require('https');
const tls = require('tls');
const mongoose = require('mongoose');
const { bootstrap } = require('../../src/index');
const { loadRuntimeConfig } = require('../../src/config/runtime');
const { createIngress } = require('../../src/ingress/createIngress');
const {
  configureTransport,
  setAzureIngressStatus,
} = require('../../src/ingress/status');
const logger = require('../../src/utils/logger');

const AZURE = {
  connectionString: 'Endpoint=sb://example/;SharedAccessKey=secret',
  eventHubName: 'messages',
  consumerGroup: '$Default',
};

function fakeServer() {
  return {
    listen: jest.fn((port, callback) => callback()),
    close: jest.fn((callback) => callback()),
    listening: true,
  };
}

function localRuntime(overrides = {}) {
  return {
    production: false,
    apiPort: 3000,
    transport: 'local',
    mongo: { uri: 'mongodb://localhost/iot', dbName: 'iot' },
    mqtt: { url: 'mqtt://localhost:1883' },
    ...overrides,
  };
}

function azureRuntime(overrides = {}) {
  return {
    production: false,
    apiPort: 3000,
    transport: 'azure',
    mongo: { uri: 'mongodb://localhost/iot', dbName: 'iot' },
    azure: AZURE,
    ...overrides,
  };
}

describe('API bootstrap ingress selection', () => {
  let server;
  let ingress;

  beforeEach(() => {
    jest.clearAllMocks();
    server = fakeServer();
    ingress = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
    };
    createIngress.mockReturnValue(ingress);
    jest.spyOn(http, 'createServer').mockReturnValue(server);
    jest.spyOn(https, 'createServer').mockReturnValue(server);
    jest.spyOn(tls, 'createSecureContext').mockReturnValue('secure-context');
    jest.spyOn(process, 'on').mockImplementation(() => process);
    jest.spyOn(process, 'exit').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts the local ingress without touching Azure', async () => {
    loadRuntimeConfig.mockReturnValue(localRuntime());

    const result = await bootstrap();

    expect(configureTransport).toHaveBeenCalledWith('local');
    expect(createIngress).toHaveBeenCalledWith('local', { io: 'io' });
    expect(ingress.start).toHaveBeenCalledWith('io', localRuntime().mqtt);
    expect(setAzureIngressStatus).not.toHaveBeenCalled();
    expect(server.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(result.ingress).toBe(ingress);
  });

  it('starts only the Azure ingress in Azure mode', async () => {
    loadRuntimeConfig.mockReturnValue(azureRuntime());

    await bootstrap();

    expect(configureTransport).toHaveBeenCalledWith('azure');
    expect(createIngress).toHaveBeenCalledWith('azure', { io: 'io' });
    expect(setAzureIngressStatus).toHaveBeenCalledWith({
      connected: false,
      status: 'initializing',
    });
    expect(ingress.start).toHaveBeenCalledWith(AZURE);
    expect(server.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  it('uses API TLS ciphers for MongoDB in production Azure mode', async () => {
    loadRuntimeConfig.mockReturnValue(azureRuntime({
      production: true,
      mongo: {
        uri: 'mongodb://localhost/iot',
        dbName: 'iot',
        tls: { cert: 'cert', key: 'key' },
      },
      apiTls: { cert: 'cert', key: 'key', ciphers: ['TLS_AES_256_GCM_SHA384'] },
    }));

    await bootstrap();

    expect(tls.createSecureContext).toHaveBeenCalledWith({
      cert: 'cert',
      key: 'key',
      minVersion: 'TLSv1.2',
      ciphers: ['TLS_AES_256_GCM_SHA384'],
    });
    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://localhost/iot',
      expect.objectContaining({ secureContext: 'secure-context', tls: true })
    );
  });

  it('stops the ingress, HTTP server and database on shutdown', async () => {
    loadRuntimeConfig.mockReturnValue(localRuntime());
    const result = await bootstrap();

    await result.shutdown('SIGTERM');

    expect(ingress.stop).toHaveBeenCalledTimes(1);
    expect(server.close).toHaveBeenCalledTimes(1);
    expect(mongoose.disconnect).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('does not start HTTP when the Azure subscription fails', async () => {
    loadRuntimeConfig.mockReturnValue(azureRuntime());
    ingress.start.mockRejectedValueOnce(new Error('unauthorized'));

    await expect(bootstrap()).rejects.toThrow('unauthorized');

    expect(server.listen).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('API listening'));
  });
});
