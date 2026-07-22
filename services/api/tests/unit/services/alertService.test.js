const Alert = require('../../../src/models/Alert');
const { findAll, resolve, countUnresolved } = require('../../../src/services/alertService');

const SAMPLE = [
  { sensorId: 'TEMP-01', type: 'temperature', level: 'critical', value: 95,  unit: '°C',  message: 'Critical',  resolved: false, timestamp: new Date() },
  { sensorId: 'PRES-01', type: 'pressure',    level: 'warning',  value: 9.2, unit: 'bar', message: 'Warning',   resolved: false, timestamp: new Date() },
  { sensorId: 'HUMI-01', type: 'humidity',    level: 'warning',  value: 85,  unit: '%',   message: 'Resolved',  resolved: true,  timestamp: new Date() },
];

beforeEach(async () => { await Alert.insertMany(SAMPLE); });

describe('findAll()', () => {
  it('retorna todos os alertas', async () => {
    const result = await findAll({});
    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('filtra por level', async () => {
    const result = await findAll({ level: 'critical' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].level).toBe('critical');
  });

  it('filtra por resolved=true', async () => {
    const result = await findAll({ resolved: true });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].resolved).toBe(true);
  });

  it('filtra por resolved=false', async () => {
    const result = await findAll({ resolved: false });
    expect(result.data).toHaveLength(2);
    expect(result.data.every(a => !a.resolved)).toBe(true);
  });

  it('aplica paginação', async () => {
    const result = await findAll({ limit: 2, page: 1 });
    expect(result.data).toHaveLength(2);
    expect(result.pages).toBe(2);
  });
});

describe('resolve()', () => {
  it('marca o alerta como resolvido', async () => {
    const alert = await Alert.findOne({ resolved: false });
    const updated = await resolve(alert._id);
    expect(updated.resolved).toBe(true);
    expect(updated.resolvedAt).toBeDefined();
  });

  it('retorna null para id inexistente', async () => {
    const { Types } = require('mongoose');
    const result = await resolve(new Types.ObjectId());
    expect(result).toBeNull();
  });
});

describe('countUnresolved()', () => {
  it('conta apenas alertas não resolvidos', async () => {
    const count = await countUnresolved();
    expect(count).toBe(2);
  });
});
