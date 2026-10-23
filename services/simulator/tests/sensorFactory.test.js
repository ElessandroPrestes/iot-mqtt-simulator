import { describe, expect, it } from '@jest/globals';
import { buildSensors } from '../src/sensors/factory.js';

function countByType(sensors) {
  return sensors.reduce((counts, { sensor }) => {
    counts[sensor.type] = (counts[sensor.type] || 0) + 1;
    return counts;
  }, {});
}

describe('sensor factory', () => {
  it('creates exactly the requested total number of sensors', () => {
    const sensors = buildSensors(8, 0);

    expect(sensors).toHaveLength(8);
    expect(countByType(sensors)).toEqual({
      temperature: 2,
      pressure: 2,
      humidity: 2,
      vibration: 2,
    });
  });

  it('distributes an odd total deterministically across all types', () => {
    const sensors = buildSensors(10, 0);

    expect(sensors).toHaveLength(10);
    expect(countByType(sensors)).toEqual({
      temperature: 3,
      pressure: 3,
      humidity: 2,
      vibration: 2,
    });
  });

  it('builds stable ids and topics', () => {
    const sensors = buildSensors(8, 0);

    expect(sensors[0]).toEqual(expect.objectContaining({
      topic: 'factory/sensors/temperature/TEMP-01',
    }));
    expect(sensors[1].topic).toBe('factory/sensors/pressure/PRES-01');
    expect(sensors[2].topic).toBe('factory/sensors/humidity/HUMI-01');
    expect(sensors[3].topic).toBe('factory/sensors/vibration/VIBR-01');
    expect(sensors[4].topic).toBe('factory/sensors/temperature/TEMP-02');
    expect(sensors[4].sensor.id).toBe('TEMP-02');
  });

  it('passes the anomaly probability to every sensor', () => {
    const sensors = buildSensors(4, 0.42);

    expect(sensors.every(({ sensor }) => sensor.anomalyProbability === 0.42)).toBe(true);
  });

  it('rejects invalid counts', () => {
    expect(() => buildSensors(0, 0)).toThrow(/positive integer/);
    expect(() => buildSensors(1.5, 0)).toThrow(/positive integer/);
    expect(() => buildSensors('8', 0)).toThrow(/positive integer/);
  });
});
