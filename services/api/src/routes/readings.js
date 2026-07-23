const router = require('express').Router();
const Joi = require('joi');
const readingService = require('../services/readingService');
const { successResponse } = require('../utils/responseFormatter');

const querySchema = Joi.object({
  sensorId:  Joi.string(),
  type:      Joi.string().valid('temperature', 'pressure', 'humidity', 'vibration'),
  status:    Joi.string().valid('normal', 'warning', 'critical'),
  from:      Joi.date().iso(),
  to:        Joi.date().iso(),
  limit:     Joi.number().integer().min(1).max(1000).default(100),
  page:      Joi.number().integer().min(1).default(1),
});

/**
 * @swagger
 * /api/v1/readings:
 *   get:
 *     summary: Retorna leituras com filtros e paginação.
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sensorId
 *         schema:
 *           type: string
 *         description: Filtrar por ID do sensor
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [temperature, pressure, humidity, vibration]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [normal, warning, critical]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leituras retornadas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 */
// GET /api/v1/readings
router.get('/', async (req, res, next) => {
  try {
    const { error, value } = querySchema.validate(req.query);
    if (error) {
      const err = new Error('Invalid query parameters');
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      err.details = error.details;
      return next(err);
    }

    const result = await readingService.findAll(value);

    res.json(successResponse(result.data, {
      page:  result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages,
    }));
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/v1/readings/latest:
 *   get:
 *     summary: Retorna a última leitura de cada sensor.
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Últimas leituras retornadas
 *       401:
 *         description: Não autorizado
 */
// GET /api/v1/readings/latest
router.get('/latest', async (req, res, next) => {
  try {
    const latest = await readingService.findLatestPerSensor();
    res.json(successResponse(latest));
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/v1/readings/stats:
 *   get:
 *     summary: Retorna estatísticas de leituras.
 *     tags: [Readings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         schema:
 *           type: integer
 *         description: Janela de tempo em milissegundos (default 1 hora)
 *     responses:
 *       200:
 *         description: Estatísticas retornadas
 *       401:
 *         description: Não autorizado
 */
// GET /api/v1/readings/stats
router.get('/stats', async (req, res, next) => {
  try {
    const sinceMs = parseInt(req.query.since) || 3600000;
    const since = new Date(Date.now() - sinceMs);

    const stats = await readingService.findStats(sinceMs);
    res.json(successResponse(stats, { since }));
  } catch (err) { next(err); }
});

module.exports = router;
