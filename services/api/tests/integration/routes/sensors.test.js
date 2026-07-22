const request = require('supertest');
const { createApp } = require('../../../src/app');
const Reading = require('../../../src/models/Reading');

let app;

beforeAll(() => { app = createApp(); });

describe('GET /api/v1/sensors', () => {
  beforeEach(async () => {
    await Reading.insertMany([
      { sensorId: 'TEMP-01', type: 'temperature', value: 55,  unit: '°C',  status: 'normal',  timestamp: new Date(Date.now() - 5000) },
      { sensorId: 'TEMP-01', type: 'temperature', value: 75,  unit: '°C',  status: 'warning', timestamp: new Date() },
      { sensorId: 'PRES-01', type: 'pressure',    value: 7.0, unit: 'bar', status: 'normal',  timestamp: new Date() },
    ]);
  });

  it('retorna lista de sensores únicos', async () => {
    const res = await request(app).get('/api/v1/sensors');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const ids = res.body.data.map(s => s.sensorId);
    expect(ids).toContain('TEMP-01');
    expect(ids).toContain('PRES-01');
  });

  it('retorna lastValue como a leitura mais recente', async () => {
    const res = await request(app).get('/api/v1/sensors');
    const temp = res.body.data.find(s => s.sensorId === 'TEMP-01');
    expect(temp.lastValue).toBe(75);
    expect(temp.lastStatus).toBe('warning');
  });
});

describe('GET /api/v1/sensors/:id', () => {
  beforeEach(async () => {
    await Reading.insertMany([
      { sensorId: 'VIBR-01', type: 'vibration', value: 2.1, unit: 'mm/s', status: 'normal', timestamp: new Date() },
    ]);
  });

  it('retorna histórico do sensor', async () => {
    const res = await request(app).get('/api/v1/sensors/VIBR-01');
    expect(res.status).toBe(200);
    expect(res.body.data[0].sensorId).toBe('VIBR-01');
  });

  it('retorna 404 para sensor inexistente', async () => {
    const res = await request(app).get('/api/v1/sensors/NOPE-99');
    expect(res.status).toBe(404);
  });
});
