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

// GET /api/v1/readings/latest
router.get('/latest', async (req, res, next) => {
  try {
    const latest = await readingService.findLatestPerSensor();
    res.json(successResponse(latest));
  } catch (err) { next(err); }
});

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
