const router = require('express').Router();
const mongoose = require('mongoose');
const mqttService = require('../services/mqttService');
const {
  getAzureIngressStatus,
  getTransport,
} = require('../ingress/status');
const { successResponse } = require('../utils/responseFormatter');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Retorna o status de saúde da API e suas dependências.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API está saudável.
 *       503:
 *         description: "API está degradada (ex: sem conexão com banco de dados)."
 * /api/v1/health:
 *   get:
 *     summary: Retorna o mesmo status de saúde pela rota versionada.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API está saudável.
 *       503:
 *         description: API está degradada.
 */
router.get('/', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoOk = mongoState === 1;
  const transport = getTransport();
  const mqtt = mqttService.getStatus();
  const azureEventHubs = getAzureIngressStatus();
  const activeIngress = transport === 'azure' ? azureEventHubs : mqtt;
  const healthy = mongoOk && activeIngress.connected;

  const status = healthy ? 'healthy' : 'degraded';
  const code   = healthy ? 200 : 503;

  const data = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    transport,
    services: {
      mongodb: { status: mongoOk ? 'connected' : 'disconnected' },
      mqtt: { status: transport === 'local' ? mqtt.status : 'disabled' },
      azureEventHubs: {
        status: transport === 'azure' ? azureEventHubs.status : 'disabled',
      },
    },
  };

  res.status(code).json(successResponse(data));
});

module.exports = router;
