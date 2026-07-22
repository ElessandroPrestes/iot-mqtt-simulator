import { TemperatureSensor } from '../src/sensors/temperatureSensor.js';
import { PressureSensor }    from '../src/sensors/pressureSensor.js';
import { HumiditySensor }    from '../src/sensors/humiditySensor.js';
import { VibrationSensor }   from '../src/sensors/vibrationSensor.js';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function readMany(sensor, n = 200) {
  return Array.from({ length: n }, () => sensor.read());
}

function assertReadingShape(reading, expectedType, expectedUnit) {
  expect(reading).toHaveProperty('sensorId');
  expect(reading).toHaveProperty('type', expectedType);
  expect(reading).toHaveProperty('value');
  expect(reading).toHaveProperty('unit', expectedUnit);
  expect(reading).toHaveProperty('isAnomaly');
  expect(reading).toHaveProperty('timestamp');
  expect(reading).toHaveProperty('metadata');
  expect(reading.metadata).toHaveProperty('location');
  expect(reading.metadata).toHaveProperty('equipment');
  expect(typeof reading.value).toBe('number');
  expect(typeof reading.isAnomaly).toBe('boolean');
  expect(() => new Date(reading.timestamp)).not.toThrow();
}

// ──────────────────────────────────────────────────────────
// TemperatureSensor
// ──────────────────────────────────────────────────────────
describe('TemperatureSensor', () => {
  const sensor = new TemperatureSensor('TEMP-01');

  it('cria sensor com valores padrão', () => {
    expect(sensor.id).toBe('TEMP-01');
    expect(sensor.type).toBe('temperature');
    expect(sensor.unit).toBe('°C');
    expect(sensor.baseValue).toBe(45);
  });

  it('aceita opções customizadas', () => {
    const s = new TemperatureSensor('T2', { baseValue: 80, variance: 5, anomalyProbability: 0.1 });
    expect(s.baseValue).toBe(80);
    expect(s.variance).toBe(5);
    expect(s.anomalyProbability).toBe(0.1);
  });

  it('read() retorna payload com forma correta', () => {
    assertReadingShape(sensor.read(), 'temperature', '°C');
  });

  it('valor permanece dentro do range [0, 150]', () => {
    const readings = readMany(sensor, 500);
    readings.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(150);
    });
  });

  it('valor tem 2 casas decimais', () => {
    const readings = readMany(sensor, 50);
    readings.forEach(r => {
      expect(r.value).toBe(parseFloat(r.value.toFixed(2)));
    });
  });

  it('sensorId no payload corresponde ao id do sensor', () => {
    expect(sensor.read().sensorId).toBe('TEMP-01');
  });

  it('anomalia injeta pico acima do baseValue', () => {
    const s = new TemperatureSensor('TEMP-A', { baseValue: 45, anomalyProbability: 1 });
    const r = s.read();
    expect(r.isAnomaly).toBe(true);
    expect(r.value).toBeGreaterThan(s.baseValue);
  });

  it('sem anomalia mantém valor próximo ao baseValue', () => {
    const s = new TemperatureSensor('TEMP-B', { baseValue: 45, anomalyProbability: 0 });
    const readings = readMany(s, 100);
    readings.forEach(r => expect(r.isAnomaly).toBe(false));
  });

  it('aplica mean reversion após desvio', () => {
    const s = new TemperatureSensor('TEMP-C', { baseValue: 45, anomalyProbability: 0 });
    s._lastValue = 140; // forçar desvio extremo
    const readings = readMany(s, 20);
    const last = readings[readings.length - 1].value;
    expect(last).toBeLessThan(140);
  });
});

// ──────────────────────────────────────────────────────────
// PressureSensor
// ──────────────────────────────────────────────────────────
describe('PressureSensor', () => {
  const sensor = new PressureSensor('PRES-01');

  it('cria sensor com valores padrão', () => {
    expect(sensor.type).toBe('pressure');
    expect(sensor.unit).toBe('bar');
    expect(sensor.baseValue).toBe(6.0);
  });

  it('read() retorna payload com forma correta', () => {
    assertReadingShape(sensor.read(), 'pressure', 'bar');
  });

  it('valor permanece dentro do range [0, 15]', () => {
    const readings = readMany(sensor, 500);
    readings.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(15);
    });
  });

  it('anomalia injeta pico acima do baseValue', () => {
    const s = new PressureSensor('PRES-A', { baseValue: 6, anomalyProbability: 1 });
    const r = s.read();
    expect(r.isAnomaly).toBe(true);
    expect(r.value).toBeGreaterThan(s.baseValue);
  });
});

// ──────────────────────────────────────────────────────────
// HumiditySensor
// ──────────────────────────────────────────────────────────
describe('HumiditySensor', () => {
  const sensor = new HumiditySensor('HUMI-01');

  it('cria sensor com valores padrão', () => {
    expect(sensor.type).toBe('humidity');
    expect(sensor.unit).toBe('%');
    expect(sensor.baseValue).toBe(55);
  });

  it('read() retorna payload com forma correta', () => {
    assertReadingShape(sensor.read(), 'humidity', '%');
  });

  it('valor permanece dentro do range [0, 100]', () => {
    const readings = readMany(sensor, 500);
    readings.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(100);
    });
  });

  it('valor nunca excede 100%', () => {
    const s = new HumiditySensor('HUMI-B', { baseValue: 55, anomalyProbability: 1 });
    const readings = readMany(s, 200);
    readings.forEach(r => expect(r.value).toBeLessThanOrEqual(100));
  });
});

// ──────────────────────────────────────────────────────────
// VibrationSensor
// ──────────────────────────────────────────────────────────
describe('VibrationSensor', () => {
  const sensor = new VibrationSensor('VIBR-01');

  it('cria sensor com valores padrão', () => {
    expect(sensor.type).toBe('vibration');
    expect(sensor.unit).toBe('mm/s');
    expect(sensor.baseValue).toBe(2.5);
  });

  it('read() retorna payload com forma correta', () => {
    assertReadingShape(sensor.read(), 'vibration', 'mm/s');
  });

  it('valor permanece dentro do range [0, 20]', () => {
    const readings = readMany(sensor, 500);
    readings.forEach(r => {
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(20);
    });
  });

  it('anomalia injeta pico acima do baseValue', () => {
    const s = new VibrationSensor('VIBR-A', { baseValue: 2.5, anomalyProbability: 1 });
    const r = s.read();
    expect(r.isAnomaly).toBe(true);
    expect(r.value).toBeGreaterThan(s.baseValue);
  });

  it('metadata inclui location e equipment com sensorId', () => {
    const r = sensor.read();
    expect(r.metadata.equipment).toContain('VIBR-01');
  });
});

// ──────────────────────────────────────────────────────────
// Propriedades estatísticas (smoke test)
// ──────────────────────────────────────────────────────────
describe('propriedades estatísticas dos sensores', () => {
  it('temperatura — média próxima ao baseValue em operação normal', () => {
    const s = new TemperatureSensor('T-STAT', { baseValue: 45, anomalyProbability: 0 });
    const readings = readMany(s, 1000);
    const avg = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
    expect(avg).toBeGreaterThan(30);
    expect(avg).toBeLessThan(60);
  });

  it('probabilidade de anomalia próxima ao configurado', () => {
    const prob = 0.2;
    const s = new TemperatureSensor('T-PROB', { anomalyProbability: prob });
    const readings = readMany(s, 2000);
    const anomalyRate = readings.filter(r => r.isAnomaly).length / readings.length;
    // Tolerância de ±10 pontos percentuais
    expect(anomalyRate).toBeGreaterThan(prob - 0.1);
    expect(anomalyRate).toBeLessThan(prob + 0.1);
  });
});
