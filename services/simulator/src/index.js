import mqtt from 'mqtt';
import { config } from './config.js';
import { TemperatureSensor } from './sensors/temperatureSensor.js';
import { PressureSensor } from './sensors/pressureSensor.js';
import { HumiditySensor } from './sensors/humiditySensor.js';
import { VibrationSensor } from './sensors/vibrationSensor.js';
import { logger } from './logger.js';

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
  logger.info('Connecting to MQTT broker');

  const client = mqtt.connect(`${config.mqtt.protocol}://${config.mqtt.host}:${config.mqtt.port}`, {
    clientId: config.mqtt.clientId,
    clean: true,
    reconnectPeriod: 3000,
    ...(config.mqtt.protocol === 'mqtts'
      ? {
          ca: config.mqtt.ca,
          cert: config.mqtt.cert,
          key: config.mqtt.key,
          rejectUnauthorized: true,
          servername: config.mqtt.host,
          minVersion: 'TLSv1.2',
          ciphers: config.mqtt.ciphers,
        }
      : {
          username: config.mqtt.username,
          password: config.mqtt.password,
        }),
  });

  client.on('connect', () => {
    logger.info('Connected to MQTT broker');

    const sensors = buildSensors(
      config.simulator.sensorsCount,
      config.simulator.anomalyProbability
    );

    setInterval(() => {
      sensors.forEach(({ sensor, topic }) => {
        const reading = sensor.read();
        const payload = JSON.stringify(reading);

        client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
          if (err) logger.error('MQTT publish failed', { topic, error: err.message });
        });

        if (reading.isAnomaly) {
          logger.warn('Sensor anomaly detected', {
            sensorId: sensor.id,
            value: reading.value,
            unit: reading.unit,
          });
        }
      });
    }, config.simulator.intervalMs);
  });

  client.on('error', (err) => logger.error('MQTT connection error', {
    error: err.message,
  }));
  client.on('reconnect', () => logger.info('Reconnecting to MQTT broker'));
}

main();
