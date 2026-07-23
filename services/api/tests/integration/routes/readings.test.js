const request           = require('supertest');
const { createApp }     = require('../../../src/app');
const readingRepository = require('../../../src/repositories/readingRepository');
const Reading           = require('../../../src/models/Reading');

jest.mock('../../../src/middleware/authenticate', () => (req, res, next) => next());

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
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtra por sensorId', async () => {
    const res = await request(app).get('/api/v1/readings?sensorId=TEMP-01');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every(r => r.sensorId === 'TEMP-01')).toBe(true);
  });

  it('filtra por status', async () => {
    const res = await request(app).get('/api/v1/readings?status=warning');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every(r => r.status === 'warning')).toBe(true);
  });

  it('filtra por type', async () => {
    const res = await request(app).get('/api/v1/readings?type=pressure');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every(r => r.type === 'pressure')).toBe(true);
  });

  it('retorna 400 para status inválido', async () => {
    const res = await request(app).get('/api/v1/readings?status=invalid');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna 400 para type inválido', async () => {
    const res = await request(app).get('/api/v1/readings?type=invalid');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('error');
  });

  it('rejeita operador NoSQL e propriedades desconhecidas', async () => {
    const noSql = await request(app)
      .get('/api/v1/readings')
      .query({ 'sensorId[$ne]': 'TEMP-01' });
    const unknown = await request(app)
      .get('/api/v1/readings')
      .query({ unexpected: 'value' });

    expect(noSql.status).toBe(400);
    expect(unknown.status).toBe(400);
  });

  it('aplica paginação via query params', async () => {
    const res = await request(app).get('/api/v1/readings?limit=2&page=1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.limit).toBe(2);
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
    expect(res.body.success).toBe(true);
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
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.meta).toHaveProperty('since');
  });

  it('rejeita janelas fora do limite e query desconhecida', async () => {
    const excessive = await request(app).get('/api/v1/readings/stats?since=9999999999');
    const unknown = await request(app).get('/api/v1/readings/stats?unexpected=true');

    expect(excessive.status).toBe(400);
    expect(unknown.status).toBe(400);
  });
});

describe('GET /api/v1/readings - Filtro por data e Erros', () => {
  it('filtra por from e to', async () => {
    const res = await request(app).get(`/api/v1/readings?from=${new Date(Date.now() - 60000).toISOString()}&to=${new Date(Date.now() + 60000).toISOString()}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('deve repassar erro 500 caso o DB falhe', async () => {
    jest.spyOn(readingRepository, 'aggregate').mockRejectedValueOnce(new Error('DB falhou'));
    const res = await request(app).get('/api/v1/readings/stats');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('error');
  });
});
