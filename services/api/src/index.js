require('dotenv').config();
const http = require('http');
const https = require('https');
const tls = require('tls');
const mongoose = require('mongoose');
const { createApp } = require('./app');
const { createSocketServer } = require('./websocket/socketServer');
const { loadSecurityConfig } = require('./config/security');
const { loadRuntimeConfig } = require('./config/runtime');
const { createIngress } = require('./ingress/createIngress');
const {
  configureTransport,
  setAzureIngressStatus,
} = require('./ingress/status');
const logger = require('./utils/logger');
const { installFatalProcessHandlers } = require('./utils/processLifecycle');

async function bootstrap() {
  const securityConfig = loadSecurityConfig();
  const runtimeConfig = loadRuntimeConfig();
  configureTransport(runtimeConfig.transport);

  // MongoDB
  await mongoose.connect(runtimeConfig.mongo.uri, {
    dbName: runtimeConfig.mongo.dbName,
    serverSelectionTimeoutMS: 10_000,
    ...(runtimeConfig.production
      ? {
          tls: true,
          secureContext: tls.createSecureContext({
            ...runtimeConfig.mongo.tls,
            minVersion: 'TLSv1.2',
            ciphers: runtimeConfig.apiTls.ciphers,
          }),
        }
      : {}),
  });
  logger.info('MongoDB connected');

  // Express + HTTP
  const app    = createApp({ securityConfig });
  const server = runtimeConfig.production
    ? https.createServer(runtimeConfig.apiTls, app)
    : http.createServer(app);

  // Socket.io
  const io = createSocketServer(server, securityConfig);

  // Telemetry ingress
  const ingress = createIngress(runtimeConfig.transport, { io });
  if (runtimeConfig.transport === 'azure') {
    setAzureIngressStatus({ connected: false, status: 'initializing' });
    await ingress.start(runtimeConfig.azure);
  } else {
    ingress.start(io, runtimeConfig.mqtt);
  }

  // Start
  const port = runtimeConfig.apiPort;
  server.listen(port, () => logger.info(`API listening on :${port}`));

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${signal}. Shutting down...`);

    const closeHttp = new Promise((resolve) => {
      if (!server.listening) return resolve();
      return server.close(resolve);
    });

    await Promise.allSettled([
      ingress.stop(),
      closeHttp,
      mongoose.disconnect(),
    ]);
    process.exit(signal === 'SIGTERM' || signal === 'SIGINT' ? 0 : 1);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  installFatalProcessHandlers(shutdown);

  return { app, ingress, io, server, shutdown };
}

if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error('Bootstrap failed', {
      event: 'process.bootstrap_failed',
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
}

module.exports = { bootstrap };
