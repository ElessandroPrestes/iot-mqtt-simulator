const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { verifyAccessToken } = require('../middleware/authenticate');
const { auditSecurityEvent } = require('../middleware/securityAudit');

const SENSOR_ID_PATTERN = /^[A-Z][A-Z0-9_-]{2,63}$/;
const MAX_SENSOR_SUBSCRIPTIONS = 50;

function socketAuthentication(config) {
  return (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string' || token.length > 4096) {
        throw new Error('Missing access token');
      }
      socket.data.user = verifyAccessToken(token, config);
      auditSecurityEvent({
        id: socket.id,
        ip: socket.handshake.address,
        user: socket.data.user,
      }, 'auth.websocket', 'success');
      next();
    } catch {
      auditSecurityEvent({
        id: socket.id,
        ip: socket.handshake.address,
      }, 'auth.websocket', 'denied');
      const error = new Error('Authentication required');
      error.data = { code: 'UNAUTHORIZED' };
      next(error);
    }
  };
}

function validSensorId(sensorId) {
  return typeof sensorId === 'string' && SENSOR_ID_PATTERN.test(sensorId);
}

function subscriptionHandler(socket, action) {
  return (sensorId, acknowledge = () => {}) => {
    const subscriptions = socket.data.sensorSubscriptions;
    if (!validSensorId(sensorId)) {
      acknowledge({ success: false, error: { code: 'INVALID_SENSOR_ID' } });
      return;
    }

    if (action === 'join'
      && !subscriptions.has(sensorId)
      && subscriptions.size >= MAX_SENSOR_SUBSCRIPTIONS) {
      acknowledge({ success: false, error: { code: 'SUBSCRIPTION_LIMIT' } });
      return;
    }

    const room = `sensor:${sensorId}`;
    if (action === 'join') {
      subscriptions.add(sensorId);
      socket.join(room);
    } else {
      subscriptions.delete(sensorId);
      socket.leave(room);
    }
    acknowledge({ success: true });
  };
}

function createSocketServer(httpServer, securityConfig) {
  const io = new Server(httpServer, {
    cors: {
      credentials: true,
      origin: securityConfig.corsOrigins,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(socketAuthentication(securityConfig));

  io.on('connection', (socket) => {
    socket.data.sensorSubscriptions = new Set();
    logger.info('Client connected', {
      principalId: socket.data.user.id,
      socketId: socket.id,
    });

    socket.on('subscribe:sensor', subscriptionHandler(socket, 'join'));
    socket.on('unsubscribe:sensor', subscriptionHandler(socket, 'leave'));

    socket.on('disconnect', () => {
      logger.info('Client disconnected', {
        principalId: socket.data.user.id,
        socketId: socket.id,
      });
    });
  });

  return io;
}

module.exports = {
  MAX_SENSOR_SUBSCRIPTIONS,
  createSocketServer,
  socketAuthentication,
  subscriptionHandler,
  validSensorId,
};
