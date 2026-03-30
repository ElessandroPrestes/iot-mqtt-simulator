const Reading = require('../../../src/models/Reading');
const { findAll, findLatestPerSensor, findStats } = require('../../../src/services/readingService');

const SAMPLE = [
  { sensorId: 'TEMP-01', type: 'temperature', value: 55, unit: '°C', status: 'normal',  timestamp: new Date(Date.now() - 5000) },
  { sensorId: 'TEMP-01', type: 'temperature', value: 85, unit: '°C', status: 'warning', timestamp: new Date() },
  { sensorId: 'PRES-01', type: 'pressure',    value: 9.5, unit: 'bar', status: 'warning', timestamp: new Date() },
];

beforeEach(async () => { await Reading.insertMany(SAMPLE); });

describe('findAll()', () => {
  it('retorna todas as leituras', async () => {
    const result = await findAll({});
    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('filtra por sensorId', async () => {
    const result = await findAll({ sensorId: 'TEMP-01' });
    expect(result.data.every(r => r.sensorId === 'TEMP-01')).toBe(true);
    expect(result.total).toBe(2);
  });

  it('filtra por type', async () => {
    const result = await findAll({ type: 'pressure' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].sensorId).toBe('PRES-01');
  });

  it('filtra por status', async () => {
    const result = await findAll({ status: 'warning' });
    expect(result.data).toHaveLength(2);
  });

  it('aplica paginação', async () => {
    const result = await findAll({ limit: 2, page: 1 });
    expect(result.data).toHaveLength(2);
    expect(result.pages).toBe(2);
  });

  it('filtra por intervalo de timestamps', async () => {
    const result = await findAll({ from: new Date(Date.now() - 1000).toISOString() });
    expect(result.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('findLatestPerSensor()', () => {
  it('retorna a leitura mais recente por sensor', async () => {
    const result = await findLatestPerSensor();
    const temp = result.find(r => r.sensorId === 'TEMP-01');
    expect(temp.value).toBe(85);
  });

  it('retorna um resultado por sensor', async () => {
    const result = await findLatestPerSensor();
    const ids = result.map(r => r.sensorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('findStats()', () => {
  it('retorna estatísticas agregadas', async () => {
    const result = await findStats(3_600_000);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(s => {
      expect(s).toHaveProperty('avg');
      expect(s).toHaveProperty('max');
      expect(s).toHaveProperty('min');
      expect(s).toHaveProperty('count');
    });
  });
});
