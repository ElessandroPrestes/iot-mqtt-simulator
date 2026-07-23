const requestLogger = require('../../../src/middleware/requestLogger');

describe('requestLogger() middleware', () => {
  function buildReqRes() {
    const listeners = {};
    const req = {
      method: 'GET',
      originalUrl: '/api/v1/readings',
      ip: '127.0.0.1',
    };
    const res = {
      statusCode: 200,
      on(event, cb) { listeners[event] = cb; },
      emit(event) { if (listeners[event]) listeners[event](); },
    };
    return { req, res, listeners };
  }

  it('chama next() imediatamente', () => {
    const { req, res } = buildReqRes();
    const next = jest.fn();
    requestLogger(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('registra log no evento finish sem lançar exceção', () => {
    const { req, res } = buildReqRes();
    const next = jest.fn();
    expect(() => {
      requestLogger(req, res, next);
      res.emit('finish');
    }).not.toThrow();
  });
});
