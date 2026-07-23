const authorize = require('../../../src/middleware/authorize');

describe('authorize middleware', () => {
  let res;
  let next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('denies missing or insufficient role', () => {
    authorize('operator')({ user: { role: 'viewer' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        details: [],
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows an explicitly authorized role', () => {
    authorize('operator')({ user: { role: 'operator' } }, res, next);
    expect(next).toHaveBeenCalled();
  });
});
