const request = require('supertest');
const { createApp } = require('../../../src/app');
const Alert   = require('../../../src/models/Alert');

let app;

beforeAll(() => { app = createApp(); });

const SAMPLE = [
  { sensorId: 'TEMP-01', type: 'temperature', level: 'critical', value: 95,  unit: '°C',  message: 'Critical', resolved: false, timestamp: new Date() },
  { sensorId: 'PRES-01', type: 'pressure',    level: 'warning',  value: 9.2, unit: 'bar', message: 'Warning',  resolved: false, timestamp: new Date() },
];

describe('GET /api/v1/alerts', () => {
  beforeEach(async () => { await Alert.insertMany(SAMPLE); });

  it('retorna lista de alertas', async () => {
    const res = await request(app).get('/api/v1/alerts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtra por level', async () => {
    const res = await request(app).get('/api/v1/alerts?level=critical');
    expect(res.status).toBe(200);
    expect(res.body.data.every(a => a.level === 'critical')).toBe(true);
  });

  it('filtra por resolved', async () => {
    const res = await request(app).get('/api/v1/alerts?resolved=false');
    expect(res.status).toBe(200);
    expect(res.body.data.every(a => !a.resolved)).toBe(true);
  });

  it('retorna 400 para level inválido', async () => {
    const res = await request(app).get('/api/v1/alerts?level=invalid');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/alerts/summary', () => {
  beforeEach(async () => { await Alert.insertMany(SAMPLE); });

  it('retorna resumo de contagens', async () => {
    const res = await request(app).get('/api/v1/alerts/summary');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('unresolved');
    expect(res.body.data).toHaveProperty('critical');
    expect(res.body.data).toHaveProperty('warning');
  });
});

describe('PATCH /api/v1/alerts/:id/resolve', () => {
  it('marca alerta como resolvido', async () => {
    const [alert] = await Alert.insertMany([SAMPLE[0]]);
    const res = await request(app).patch(`/api/v1/alerts/${alert._id}/resolve`);
    expect(res.status).toBe(200);
    expect(res.body.data.resolved).toBe(true);
    expect(res.body.data.resolvedAt).toBeDefined();
  });

  it('retorna 404 para id inexistente', async () => {
    const { Types } = require('mongoose');
    const res = await request(app).patch(`/api/v1/alerts/${new Types.ObjectId()}/resolve`);
    expect(res.status).toBe(404);
  });
});
