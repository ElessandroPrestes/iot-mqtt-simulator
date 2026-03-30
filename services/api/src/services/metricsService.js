const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const mqttMessagesTotal = new client.Counter({
  name: 'mqtt_messages_total',
  help: 'Total de mensagens MQTT recebidas',
  labelNames: ['topic', 'sensor_type'],
  registers: [register],
});

const sensorValueGauge = new client.Gauge({
  name: 'sensor_value',
  help: 'Valor atual do sensor',
  labelNames: ['sensor_id', 'sensor_type', 'unit'],
  registers: [register],
});

const alertsTotal = new client.Counter({
  name: 'alerts_total',
  help: 'Total de alertas gerados',
  labelNames: ['level', 'sensor_type'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

module.exports = {
  register,
  mqttMessagesTotal,
  sensorValueGauge,
  alertsTotal,
  httpRequestDuration,
};
