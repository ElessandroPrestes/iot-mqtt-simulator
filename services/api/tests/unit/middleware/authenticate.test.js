const jwt = require('jsonwebtoken');
const { createAuthenticate } = require('../../../src/middleware/authenticate');

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
    }],
  };

  let authenticate;
  let req;
  let res;
  let next;

  beforeEach(() => {
    authenticate = createAuthenticate(config);
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('returns canonical 401 without a Bearer token', () => {
    authenticate(req, res, next);

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

  it('rejects invalid issuer, audience or algorithm', () => {
    const token = jwt.sign(
      { role: 'viewer' },
      config.jwtSecret,
      {
        algorithm: 'HS256',
        audience: 'wrong-audience',
        issuer: config.jwtIssuer,
        subject: 'viewer-1',
      }
    );
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a valid token for a disabled or missing principal', () => {
    const token = jwt.sign(
      { role: 'operator' },
      config.jwtSecret,
      {
        algorithm: 'HS256',
        audience: config.jwtAudience,
        issuer: config.jwtIssuer,
        subject: 'operator-unknown',
      }
    );
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets the trusted principal and calls next for a valid token', () => {
    const token = jwt.sign(
      { username: 'viewer', role: 'viewer' },
      config.jwtSecret,
      {
        algorithm: 'HS256',
        audience: config.jwtAudience,
        issuer: config.jwtIssuer,
        jwtid: 'token-id',
        subject: 'viewer-1',
      }
    );
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(req.user).toEqual({
      id: 'viewer-1',
      username: 'viewer',
      role: 'viewer',
      tokenId: 'token-id',
    });
    expect(next).toHaveBeenCalled();
  });
});
