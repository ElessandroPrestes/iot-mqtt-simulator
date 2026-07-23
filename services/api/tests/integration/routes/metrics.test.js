const request = require('supertest');
const { createApp } = require('../../../src/app');
const { register } = require('../../../src/services/metricsService');

let app;

beforeAll(() => { app = createApp(); });

describe('GET /metrics', () => {
  it('retorna 200 e as métricas do prometheus no formato correto', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe(register.contentType);
    expect(res.text).toContain('nodejs_version_info'); // Métrica padrão exportada
  });

  it('retorna 500 se o registry lançar erro', async () => {
    jest.spyOn(register, 'metrics').mockRejectedValueOnce(new Error('Erro interno do registry'));
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
