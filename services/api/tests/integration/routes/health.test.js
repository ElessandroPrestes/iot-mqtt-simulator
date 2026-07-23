const request  = require('supertest');
const { createApp } = require('../../../src/app');

let app;

beforeAll(() => { app = createApp(); });

describe('GET /health', () => {
  it('retorna status healthy com mongodb conectado', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data.services.mongodb.status).toBe('connected');
  });

  it('retorna versão e memória', async () => {
    const res = await request(app).get('/health');
    expect(res.body.data).toHaveProperty('version');
    expect(res.body.data.services).toHaveProperty('memory');
  });

  it('retorna status degraded quando mongodb não estiver conectado', async () => {
    const mongoose = require('mongoose');
    const originalState = mongoose.connection.readyState;
    mongoose.connection.readyState = 0; // Desconectado

    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.services.mongodb.status).toBe('disconnected');

    mongoose.connection.readyState = originalState; // Restaura
  });
});
