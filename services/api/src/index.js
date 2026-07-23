require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { createApp } = require('./app');
const { createSocketServer } = require('./websocket/socketServer');
const { loadSecurityConfig } = require('./config/security');
const mqttService = require('./services/mqttService');
const logger = require('./utils/logger');

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
  mqttService.init(io);

  // Start
  const port = process.env.API_PORT || 3000;
  server.listen(port, () => logger.info(`API listening on :${port}`));

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down...`);
    await mongoose.disconnect();
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
