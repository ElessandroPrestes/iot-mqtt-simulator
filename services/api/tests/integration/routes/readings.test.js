const request  = require('supertest');
const { createApp } = require('../../../src/app');
const Reading  = require('../../../src/models/Reading');

let app;

beforeAll(() => { app = createApp(); });

describe('GET /api/v1/readings', () => {
  beforeEach(async () => {
    await Reading.insertMany([
      { sensorId: 'TEMP-01', type: 'temperature', value: 55,  unit: '°C',  status: 'normal',  timestamp: new Date(Date.now() - 5000) },
      { sensorId: 'TEMP-01', type: 'temperature', value: 85,  unit: '°C',  status: 'warning', timestamp: new Date() },
      { sensorId: 'PRES-01', type: 'pressure',    value: 9.5, unit: 'bar', status: 'warning', timestamp: new Date() },
    ]);
  });

  it('retorna leituras paginadas', async () => {
    const res = await request(app).get('/api/v1/readings');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtra por sensorId', async () => {
    const res = await request(app).get('/api/v1/readings?sensorId=TEMP-01');
    expect(res.status).toBe(200);
    expect(res.body.data.every(r => r.sensorId === 'TEMP-01')).toBe(true);
  });

  it('filtra por status', async () => {
    const res = await request(app).get('/api/v1/readings?status=warning');
    expect(res.status).toBe(200);
    expect(res.body.data.every(r => r.status === 'warning')).toBe(true);
  });

  it('filtra por type', async () => {
    const res = await request(app).get('/api/v1/readings?type=pressure');
    expect(res.status).toBe(200);
    expect(res.body.data.every(r => r.type === 'pressure')).toBe(true);
  });

  it('retorna 400 para status inválido', async () => {
    const res = await request(app).get('/api/v1/readings?status=invalid');
    expect(res.status).toBe(400);
  });

  it('retorna 400 para type inválido', async () => {
    const res = await request(app).get('/api/v1/readings?type=invalid');
    expect(res.status).toBe(400);
  });

  it('aplica paginação via query params', async () => {
    const res = await request(app).get('/api/v1/readings?limit=2&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.limit).toBe(2);
  });
});

describe('GET /api/v1/readings/latest', () => {
  it('retorna a leitura mais recente por sensor', async () => {
    await Reading.insertMany([
      { sensorId: 'PRES-01', type: 'pressure', value: 6.0, unit: 'bar', status: 'normal',  timestamp: new Date(Date.now() - 10000) },
      { sensorId: 'PRES-01', type: 'pressure', value: 9.2, unit: 'bar', status: 'warning', timestamp: new Date() },
    ]);
    const res = await request(app).get('/api/v1/readings/latest');
    expect(res.status).toBe(200);
    const pres = res.body.data.find(r => r.sensorId === 'PRES-01');
    expect(pres.value).toBe(9.2);
  });
});

describe('GET /api/v1/readings/stats', () => {
  it('retorna estatísticas agregadas', async () => {
    await Reading.insertMany([
      { sensorId: 'TEMP-01', type: 'temperature', value: 55, unit: '°C', status: 'normal', timestamp: new Date() },
      { sensorId: 'TEMP-01', type: 'temperature', value: 75, unit: '°C', status: 'warning', timestamp: new Date() },
    ]);
    const res = await request(app).get('/api/v1/readings/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('since');
  });
});
