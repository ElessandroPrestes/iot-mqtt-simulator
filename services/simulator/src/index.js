import mqtt from 'mqtt';
import { config } from './config.js';
import { TemperatureSensor } from './sensors/temperatureSensor.js';
import { PressureSensor } from './sensors/pressureSensor.js';
import { HumiditySensor } from './sensors/humiditySensor.js';
import { VibrationSensor } from './sensors/vibrationSensor.js';

const SENSOR_TYPES = [
  { Cls: TemperatureSensor, topic: config.topics.temperature, prefix: 'TEMP' },
  { Cls: PressureSensor,    topic: config.topics.pressure,    prefix: 'PRES' },
  { Cls: HumiditySensor,    topic: config.topics.humidity,    prefix: 'HUMI' },
  { Cls: VibrationSensor,   topic: config.topics.vibration,   prefix: 'VIBR' },
];

function buildSensors(count, anomalyProb) {
  return SENSOR_TYPES.flatMap(({ Cls, topic, prefix }) =>
    Array.from({ length: count / 2 }, (_, i) =>
      ({
        sensor: new Cls(`${prefix}-${String(i + 1).padStart(2, '0')}`, {
          anomalyProbability: anomalyProb,
        }),
        topic: `${topic}/${prefix}-${String(i + 1).padStart(2, '0')}`,
      })
    )
  );
}

async function main() {
  console.log('[Simulator] Connecting to broker...');

  const client = mqtt.connect(`mqtt://${config.mqtt.host}:${config.mqtt.port}`, {
    clientId: config.mqtt.clientId,
    username: config.mqtt.username,
    password: config.mqtt.password,
    clean: true,
    reconnectPeriod: 3000,
  });

  client.on('connect', () => {
    console.log('[Simulator] Connected. Starting sensor simulation...');

    const sensors = buildSensors(
      config.simulator.sensorsCount,
      config.simulator.anomalyProbability
    );

    setInterval(() => {
      sensors.forEach(({ sensor, topic }) => {
        const reading = sensor.read();
        const payload = JSON.stringify(reading);

        client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
          if (err) console.error(`[Simulator] Publish error on ${topic}:`, err.message);
        });

        if (reading.isAnomaly) {
          console.warn(`[Simulator] ⚠ ANOMALY detected: ${sensor.id} = ${reading.value}${reading.unit}`);
        }
      });
    }, config.simulator.intervalMs);
  });

  client.on('error', (err) => console.error('[Simulator] MQTT error:', err.message));
  client.on('reconnect', () => console.log('[Simulator] Reconnecting...'));
}

main();
