const fs = require('fs');
const https = require('https');
const {
  createRequestOptions,
  runHealthcheck,
} = require('../../../src/utils/healthcheck');

const env = {
  HEALTHCHECK_HOST: 'api.internal',
  API_PORT: '3443',
  INTERNAL_CA_FILE: '/run/secrets/ca',
  API_CLIENT_CERT_FILE: '/run/secrets/cert',
  API_CLIENT_KEY_FILE: '/run/secrets/key',
};

function fileSystem() {
  return {
    readFileSync: jest.fn((file) => `contents:${file}`),
  };
}

describe('mTLS healthcheck', () => {
  it('uses the production runtime dependencies when none are injected', () => {
    const originalEnv = {
      HEALTHCHECK_HOST: process.env.HEALTHCHECK_HOST,
      API_PORT: process.env.API_PORT,
      INTERNAL_CA_FILE: process.env.INTERNAL_CA_FILE,
      API_CLIENT_CERT_FILE: process.env.API_CLIENT_CERT_FILE,
      API_CLIENT_KEY_FILE: process.env.API_CLIENT_KEY_FILE,
    };
    Object.assign(process.env, env);

    const request = {
      on: jest.fn(() => request),
    };
    const readFileSync = jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation((file) => `contents:${file}`);
    const get = jest.spyOn(https, 'get').mockImplementation((_options, callback) => {
      callback({ statusCode: 200, resume: jest.fn() });
      return request;
    });
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);

    try {
      expect(createRequestOptions()).toEqual(expect.objectContaining({
        hostname: 'api.internal',
        port: 3443,
      }));
      runHealthcheck();

      expect(readFileSync).toHaveBeenCalled();
      expect(get).toHaveBeenCalled();
      expect(exit).toHaveBeenCalledWith(0);
    } finally {
      readFileSync.mockRestore();
      get.mockRestore();
      exit.mockRestore();
      Object.entries(originalEnv).forEach(([key, value]) => {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      });
    }
  });

  it('builds strict TLS options with safe defaults', () => {
    const fs = fileSystem();

    expect(createRequestOptions({
      INTERNAL_CA_FILE: 'ca',
      API_CLIENT_CERT_FILE: 'cert',
      API_CLIENT_KEY_FILE: 'key',
    }, fs)).toEqual(expect.objectContaining({
      hostname: 'api',
      port: 3000,
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      ca: 'contents:ca',
      cert: 'contents:cert',
      key: 'contents:key',
    }));
  });

  it('accepts only a healthy response and handles timeout', () => {
    const handlers = {};
    const request = {
      on: jest.fn((event, handler) => {
        handlers[event] = handler;
        return request;
      }),
      destroy: jest.fn(),
    };
    const httpsClient = {
      get: jest.fn((_options, callback) => {
        callback({ statusCode: 200, resume: jest.fn() });
        return request;
      }),
    };
    const exit = jest.fn();

    runHealthcheck({
      env,
      fileSystem: fileSystem(),
      httpsClient,
      exit,
    });
    handlers.timeout();

    expect(httpsClient.get.mock.calls[0][0]).toEqual(expect.objectContaining({
      hostname: 'api.internal',
      port: 3443,
      servername: 'api.internal',
    }));
    expect(exit).toHaveBeenCalledWith(0);
    expect(request.destroy).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Healthcheck timeout',
    }));
  });

  it('fails closed on degraded HTTP status or TLS error', () => {
    const handlers = {};
    const request = {
      on: jest.fn((event, handler) => {
        handlers[event] = handler;
        return request;
      }),
    };
    const httpsClient = {
      get: jest.fn((_options, callback) => {
        callback({ statusCode: 503, resume: jest.fn() });
        return request;
      }),
    };
    const exit = jest.fn();

    runHealthcheck({
      env,
      fileSystem: fileSystem(),
      httpsClient,
      exit,
    });
    handlers.error(new Error('certificate rejected'));

    expect(exit).toHaveBeenNthCalledWith(1, 1);
    expect(exit).toHaveBeenNthCalledWith(2, 1);
  });
});
