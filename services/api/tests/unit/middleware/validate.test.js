const Joi = require('joi');
const { validate } = require('../../../src/middleware/validate');

function buildReqRes(body = {}, query = {}) {
  const req = { body, query, params: {} };
  const res = {
    statusCode: null,
    jsonBody: null,
    status(code) { this.statusCode = code; return this; },
    json(body)   { this.jsonBody = body;  return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

const schema = Joi.object({
  nome:  Joi.string().required(),
  valor: Joi.number().min(0).required(),
});

describe('validate() middleware', () => {
  it('chama next() quando body é válido', () => {
    const { req, res, next } = buildReqRes({ nome: 'sensor', valor: 42 });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  it('substitui req.body pelo valor convertido pelo Joi', () => {
    const { req, res, next } = buildReqRes({ nome: 'sensor', valor: '42' });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.valor).toBe(42); // string "42" convertida para number
  });

  it('retorna 400 quando campo obrigatório está ausente', () => {
    const { req, res, next } = buildReqRes({ nome: 'sensor' }); // falta valor
    validate(schema)(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.jsonBody.success).toBe(false);
    expect(res.jsonBody.error).toHaveProperty('details');
    expect(Array.isArray(res.jsonBody.error.details)).toBe(true);
  });

  it('retorna 400 quando valor é inválido', () => {
    const { req, res, next } = buildReqRes({ nome: 'sensor', valor: -5 });
    validate(schema)(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('valida target "query" quando especificado', () => {
    const querySchema = Joi.object({ page: Joi.number().integer().min(1).default(1) });
    const { req, res, next } = buildReqRes({}, { page: 'abc' });
    validate(querySchema, 'query')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});
