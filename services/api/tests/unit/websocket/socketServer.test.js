const jwt = require('jsonwebtoken');
const {
  MAX_SENSOR_SUBSCRIPTIONS,
  socketAuthentication,
  subscriptionHandler,
  validSensorId,
} = require('../../../src/websocket/socketServer');

const config = {
  jwtSecret: 'test-only-jwt-secret-with-32-bytes-minimum',
  jwtIssuer: 'iot-api',
  jwtAudience: 'iot-dashboard',
  principals: [{
    id: 'viewer-1',
    username: 'viewer',
    role: 'viewer',
    enabled: true,
  }],
};

function accessToken(overrides = {}) {
  return jwt.sign(
    { role: 'viewer', ...overrides },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      audience: config.jwtAudience,
      issuer: config.jwtIssuer,
      subject: 'viewer-1',
      jwtid: 'token-1',
      expiresIn: 300,
    }
  );
}

describe('Socket.io security', () => {
  it('rejects anonymous handshakes', () => {
    const socket = { handshake: { auth: {} }, data: {} };
    const next = jest.fn();

    socketAuthentication(config)(socket, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      data: { code: 'UNAUTHORIZED' },
    }));
  });

  it('accepts a valid access token and derives the principal server-side', () => {
    const socket = {
      handshake: { auth: { token: accessToken() } },
      data: {},
    };
    const next = jest.fn();

    socketAuthentication(config)(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect(socket.data.user).toEqual(expect.objectContaining({
      id: 'viewer-1',
      role: 'viewer',
    }));
  });

  it.each(['', '../admin', 'sensor:other', { $ne: null }, 'a'.repeat(65)])(
    'rejects invalid sensor room identifier: %p',
    (sensorId) => {
      expect(validSensorId(sensorId)).toBe(false);
    }
  );

  it('limits room subscriptions and acknowledges the rejection', () => {
    const subscriptions = new Set(
      Array.from({ length: MAX_SENSOR_SUBSCRIPTIONS }, (_, index) => `TEMP-${index}`)
    );
    const socket = {
      data: { sensorSubscriptions: subscriptions },
      join: jest.fn(),
      leave: jest.fn(),
    };
    const acknowledge = jest.fn();

    subscriptionHandler(socket, 'join')('TEMP-NEW', acknowledge);

    expect(socket.join).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith({
      success: false,
      error: { code: 'SUBSCRIPTION_LIMIT' },
    });
  });

  it('joins and leaves only normalized sensor rooms', () => {
    const socket = {
      data: { sensorSubscriptions: new Set() },
      join: jest.fn(),
      leave: jest.fn(),
    };

    subscriptionHandler(socket, 'join')('TEMP-01');
    subscriptionHandler(socket, 'leave')('TEMP-01');

    expect(socket.join).toHaveBeenCalledWith('sensor:TEMP-01');
    expect(socket.leave).toHaveBeenCalledWith('sensor:TEMP-01');
  });
});
