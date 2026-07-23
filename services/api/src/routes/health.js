const router = require('express').Router();
const mongoose = require('mongoose');
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
 */
router.get('/', async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoOk = mongoState === 1;

  const status = mongoOk ? 'healthy' : 'degraded';
  const code   = mongoOk ? 200 : 503;

  const data = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      mongodb: { status: mongoOk ? 'connected' : 'disconnected', state: mongoState },
      memory: process.memoryUsage(),
    },
  };

  res.status(code).json(successResponse(data));
});

module.exports = router;
