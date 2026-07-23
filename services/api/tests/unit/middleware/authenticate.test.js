const authenticate = require('../../../src/middleware/authenticate');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('authenticate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('returns 401 if no authorization header is present', () => {
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized: Missing or invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if authorization header does not start with Bearer', () => {
    req.headers.authorization = 'Basic dGVzdDp0ZXN0';
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized: Missing or invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if token verification fails', () => {
    req.headers.authorization = 'Bearer invalid-token';
    jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
    
    authenticate(req, res, next);
    expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Unauthorized: Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next if token is valid', () => {
    req.headers.authorization = 'Bearer valid-token';
    const decoded = { username: 'admin' };
    jwt.verify.mockReturnValue(decoded);
    
    authenticate(req, res, next);
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
  });
});
