import { TemperatureSensor } from './temperatureSensor.js';
import { PressureSensor } from './pressureSensor.js';
import { HumiditySensor } from './humiditySensor.js';
import { VibrationSensor } from './vibrationSensor.js';

export const SENSOR_TYPES = Object.freeze([
  {
    Cls: TemperatureSensor,
    topic: 'factory/sensors/temperature',
    prefix: 'TEMP',
  },
  {
    Cls: PressureSensor,
    topic: 'factory/sensors/pressure',
    prefix: 'PRES',
  },
  {
    Cls: HumiditySensor,
    topic: 'factory/sensors/humidity',
    prefix: 'HUMI',
  },
  {
    Cls: VibrationSensor,
    topic: 'factory/sensors/vibration',
    prefix: 'VIBR',
  },
]);

export function buildSensors(count, anomalyProbability) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('sensors count must be a positive integer');
  }

  return Array.from({ length: count }, (_, index) => {
    const type = SENSOR_TYPES[index % SENSOR_TYPES.length];
    const ordinal = Math.floor(index / SENSOR_TYPES.length) + 1;
    const id = `${type.prefix}-${String(ordinal).padStart(2, '0')}`;

    return {
      sensor: new type.Cls(id, { anomalyProbability }),
      topic: `${type.topic}/${id}`,
    };
  });
}
