const jwt = require('jsonwebtoken');
jest.mock('../../../src/services/authService', () => ({
  validateAccessSession: jest.fn().mockResolvedValue(undefined),
}));
const { createAuthenticate } = require('../../../src/middleware/authenticate');
const { validateAccessSession } = require('../../../src/services/authService');

describe('authenticate middleware', () => {
  const config = {
    jwtSecret: 'test-only-jwt-secret-with-32-bytes-minimum',
    jwtIssuer: 'iot-api-test',
    jwtAudience: 'iot-dashboard-test',
    principals: [{
      id: 'viewer-1',
      username: 'viewer',
      role: 'viewer',
      enabled: true,
      securityAdmin: false,
    }],
  };

  let authenticate;
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    validateAccessSession.mockResolvedValue(undefined);
    authenticate = createAuthenticate(config);
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('returns canonical 401 without a Bearer token', async () => {
    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: [],
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid issuer, audience or algorithm', async () => {
    const token = jwt.sign(
      { role: 'viewer' },
      config.jwtSecret,
      {
        algorithm: 'HS256',
        audience: 'wrong-audience',
        issuer: config.jwtIssuer,
        subject: 'viewer-1',
        header: { typ: 'at+jwt' },
      }
    );
    req.headers.authorization = `Bearer ${token}`;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a valid token for a disabled or missing principal', async () => {
    const token = jwt.sign(
      { role: 'operator' },
      config.jwtSecret,
      {
        algorithm: 'HS256',
        audience: config.jwtAudience,
        issuer: config.jwtIssuer,
        subject: 'operator-unknown',
        header: { typ: 'at+jwt' },
      }
    );
    req.headers.authorization = `Bearer ${token}`;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets the trusted principal and calls next for a valid active session token', async () => {
    const token = jwt.sign(
      {
        username: 'viewer',
        role: 'viewer',
        sid: 'e734953e-64fa-4a67-9dcb-61726d8c9bd4',
      },
      config.jwtSecret,
      {
        algorithm: 'HS256',
        audience: config.jwtAudience,
        issuer: config.jwtIssuer,
        jwtid: 'token-id',
        subject: 'viewer-1',
        header: { typ: 'at+jwt' },
      }
    );
    req.headers.authorization = `Bearer ${token}`;

    await authenticate(req, res, next);

    expect(req.user).toEqual({
      id: 'viewer-1',
      username: 'viewer',
      role: 'viewer',
      tokenId: 'token-id',
      sessionId: 'e734953e-64fa-4a67-9dcb-61726d8c9bd4',
      securityAdmin: false,
    });
    expect(validateAccessSession).toHaveBeenCalledWith(
      'viewer-1',
      'e734953e-64fa-4a67-9dcb-61726d8c9bd4',
      config
    );
    expect(next).toHaveBeenCalled();
  });

  it('rejects a JWT without the explicit access-token type', async () => {
    const token = jwt.sign(
      { role: 'viewer', sid: 'session-id' },
      config.jwtSecret,
      {
        algorithm: 'HS256',
        audience: config.jwtAudience,
        issuer: config.jwtIssuer,
        subject: 'viewer-1',
      }
    );
    req.headers.authorization = `Bearer ${token}`;

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(validateAccessSession).not.toHaveBeenCalled();
  });
});
