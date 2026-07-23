const router = require('express').Router();
const Reading = require('../models/Reading');
const Joi = require('joi');
const { validate } = require('../middleware/validate');
const { successResponse } = require('../utils/responseFormatter');

const emptyQuerySchema = Joi.object({}).unknown(false);
const sensorParamsSchema = Joi.object({
  id: Joi.string().pattern(/^[A-Z][A-Z0-9_-]{2,63}$/).required(),
}).unknown(false);
const sensorQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(1000).default(100),
}).unknown(false);

/**
 * @swagger
 * /api/v1/sensors:
 *   get:
 *     summary: Lista sensores únicos e sua última leitura.
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sensores retornada com sucesso
 *       401:
 *         description: Não autorizado
 */
// GET /api/v1/sensors — lista sensores únicos com última leitura
router.get('/', validate(emptyQuerySchema, 'query'), async (req, res, next) => {
  try {
    const sensors = await Reading.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: {
        _id:       '$sensorId',
        type:      { $first: '$type' },
        lastValue: { $first: '$value' },
        lastUnit:  { $first: '$unit' },
        lastStatus:{ $first: '$status' },
        lastSeen:  { $first: '$timestamp' },
        metadata:  { $first: '$metadata' },
      }},
      { $project: {
        _id: 0,
        sensorId:   '$_id',
        type:       1,
        lastValue:  1,
        lastUnit:   1,
        lastStatus: 1,
        lastSeen:   1,
        metadata:   1,
      }},
      { $sort: { sensorId: 1 } },
    ]);
    res.json(successResponse(sensors));
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/v1/sensors/{id}:
 *   get:
 *     summary: Retorna o histórico de leituras de um sensor específico.
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do sensor
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Limite de resultados
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
 *       404:
 *         description: Sensor não encontrado
 *       401:
 *         description: Não autorizado
 */
// GET /api/v1/sensors/:id — histórico de um sensor
router.get(
  '/:id',
  validate(sensorParamsSchema, 'params'),
  validate(sensorQuerySchema, 'query'),
  async (req, res, next) => {
  try {
    const limit = req.query.limit;
    const readings = await Reading.find({ sensorId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    if (!readings.length) {
      const err = new Error('Sensor não encontrado');
      err.status = 404;
      err.code = 'NOT_FOUND';
      return next(err);
    }
    res.json(successResponse(readings));
  } catch (err) { next(err); }
  }
);

module.exports = router;
