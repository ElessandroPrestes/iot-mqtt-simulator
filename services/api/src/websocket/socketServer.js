const { Server } = require('socket.io');
const logger = require('../utils/logger');

function createSocketServer(httpServer, corsOrigins) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigins || '*' },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });

    socket.on('subscribe:sensor', (sensorId) => {
      socket.join(`sensor:${sensorId}`);
      logger.debug('Client subscribed to sensor', { socketId: socket.id, sensorId });
    });

    socket.on('unsubscribe:sensor', (sensorId) => {
      socket.leave(`sensor:${sensorId}`);
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });

  return io;
}

module.exports = { createSocketServer };
