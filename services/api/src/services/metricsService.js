const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const mqttMessagesTotal = new client.Counter({
  name: 'mqtt_messages_total',
  help: 'Total de mensagens MQTT recebidas',
  labelNames: ['sensor_type', 'outcome'],
  registers: [register],
});

const mqttMessagesRejectedTotal = new client.Counter({
  name: 'mqtt_messages_rejected_total',
  help: 'Total de mensagens MQTT rejeitadas antes do processamento',
  labelNames: ['reason'],
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

const securityEventsTotal = new client.Counter({
  name: 'security_events_total',
  help: 'Total de eventos de autenticação, autorização e limitação',
  labelNames: ['event', 'outcome'],
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
  mqttMessagesRejectedTotal,
  sensorValueGauge,
  alertsTotal,
  securityEventsTotal,
  httpRequestDuration,
};
