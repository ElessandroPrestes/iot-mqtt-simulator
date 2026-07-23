const errorHandler = require('../../../src/middleware/errorHandler');

function buildRes() {
  const res = {
    statusCode: null,
    jsonBody: null,
    status(code) { this.statusCode = code; return this; },
    json(body)   { this.jsonBody = body;   return this; },
  };
  return res;
}

describe('errorHandler()', () => {
  const req = { path: '/test' };
  const next = jest.fn();

  it('responde 500 por padrão com success:false', () => {
    const err = new Error('algo quebrou');
    const res = buildRes();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.error).toHaveProperty('code');
    expect(res.jsonBody.error).toHaveProperty('message');
  });

  it('usa err.status quando definido', () => {
    const err = new Error('não encontrado');
    err.status = 404;
    const res = buildRes();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res.jsonBody.error.code).toBe('NOT_FOUND');
  });

  it('define code como VALIDATION_ERROR para status 400', () => {
    const err = new Error('inválido');
    err.status = 400;
    const res = buildRes();
    errorHandler(err, req, res, next);
    expect(res.jsonBody.error.code).toBe('VALIDATION_ERROR');
  });

  it('inclui details quando err.details está presente', () => {
    const err = new Error('inválido');
    err.status = 400;
    err.details = [{ message: 'campo x é obrigatório' }];
    const res = buildRes();
    errorHandler(err, req, res, next);
    expect(res.jsonBody.error.details).toHaveLength(1);
    expect(res.jsonBody.error.details[0]).toBe('campo x é obrigatório');
  });

  it('em produção oculta a mensagem interna de erros 500', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const err = new Error('detalhe interno sigiloso');
    const res = buildRes();
    errorHandler(err, req, res, next);
    expect(res.jsonBody.error.message).toBe('Internal server error');
    process.env.NODE_ENV = original;
  });
});
