const fs = require('fs');
const https = require('https');

function createRequestOptions(env = process.env, fileSystem = fs) {
  const host = env.HEALTHCHECK_HOST || 'api';
  return {
    hostname: host,
    port: Number(env.API_PORT || 3000),
    path: '/health',
    ca: fileSystem.readFileSync(env.INTERNAL_CA_FILE),
    cert: fileSystem.readFileSync(env.API_CLIENT_CERT_FILE),
    key: fileSystem.readFileSync(env.API_CLIENT_KEY_FILE),
    rejectUnauthorized: true,
    servername: host,
    minVersion: 'TLSv1.2',
    timeout: 4000,
  };
}

function runHealthcheck(options = {}) {
  const env = options.env || process.env;
  const fileSystem = options.fileSystem || fs;
  const httpsClient = options.httpsClient || https;
  const exit = options.exit || process.exit;

  const request = httpsClient.get(
    createRequestOptions(env, fileSystem),
    (response) => {
      response.resume();
      exit(response.statusCode === 200 ? 0 : 1);
    }
  );

  request.on('timeout', () => request.destroy(new Error('Healthcheck timeout')));
  request.on('error', () => exit(1));
  return request;
}

if (require.main === module) runHealthcheck();

module.exports = { createRequestOptions, runHealthcheck };
