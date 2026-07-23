const request  = require('supertest');
const mqttService = require('../../../src/services/mqttService');
const { createApp } = require('../../../src/app');

let app;

beforeAll(() => { app = createApp(); });

describe('GET /health', () => {
  beforeEach(() => {
    jest.spyOn(mqttService, 'getStatus').mockReturnValue({
      connected: true,
      status: 'connected',
    });
  });

  it('retorna status healthy com mongodb conectado', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data.services.mongodb.status).toBe('connected');
    expect(res.body.data.services.mqtt.status).toBe('connected');
  });

  it('retorna versão sem expor detalhes de processo', async () => {
    const res = await request(app).get('/health');
    expect(res.body.data).toHaveProperty('version');
    expect(res.body.data).not.toHaveProperty('uptime');
    expect(res.body.data.services).not.toHaveProperty('memory');
    expect(res.body.data.services.mongodb).not.toHaveProperty('state');
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

  it('retorna status degraded quando MQTT não estiver conectado', async () => {
    mqttService.getStatus.mockReturnValueOnce({
      connected: false,
      status: 'reconnecting',
    });

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.services.mqtt.status).toBe('reconnecting');
  });
});
