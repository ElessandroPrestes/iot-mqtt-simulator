require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { createApp } = require('./app');
const { createSocketServer } = require('./websocket/socketServer');
const { loadSecurityConfig } = require('./config/security');
const mqttService = require('./services/mqttService');
const logger = require('./utils/logger');
const { installFatalProcessHandlers } = require('./utils/processLifecycle');

async function bootstrap() {
  const securityConfig = loadSecurityConfig();

  // MongoDB
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME,
  });
  logger.info('MongoDB connected');

  // Express + HTTP
  const app    = createApp({ securityConfig });
  const server = http.createServer(app);

  // Socket.io
  const io = createSocketServer(server, securityConfig);

  // MQTT Processor
  const mqttClient = mqttService.init(io);

  // Start
  const port = process.env.API_PORT || 3000;
  server.listen(port, () => logger.info(`API listening on :${port}`));

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${signal}. Shutting down...`);

    const closeMqtt = new Promise((resolve) => {
      mqttClient.end(false, {}, resolve);
    });
    const closeHttp = new Promise((resolve) => {
      if (!server.listening) return resolve();
      return server.close(resolve);
    });

    await Promise.allSettled([
      closeMqtt,
      closeHttp,
      mongoose.disconnect(),
    ]);
    process.exit(signal === 'SIGTERM' || signal === 'SIGINT' ? 0 : 1);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  installFatalProcessHandlers(shutdown);

  return { app, io, mqttClient, server, shutdown };
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
