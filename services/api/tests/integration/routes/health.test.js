const request  = require('supertest');
const { createApp } = require('../../../src/app');

let app;

beforeAll(() => { app = createApp(); });

describe('GET /health', () => {
  it('retorna status healthy com mongodb conectado', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body.services.mongodb.status).toBe('connected');
  });

  it('retorna versão e memória', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('version');
    expect(res.body.services).toHaveProperty('memory');
  });
});
