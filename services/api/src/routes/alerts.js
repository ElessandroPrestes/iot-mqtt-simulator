const router = require('express').Router();
const Alert = require('../models/Alert');
const Joi = require('joi');
const { successResponse } = require('../utils/responseFormatter');

const querySchema = Joi.object({
  sensorId: Joi.string(),
  level:    Joi.string().valid('warning', 'critical'),
  resolved: Joi.boolean(),
  from:     Joi.date().iso(),
  to:       Joi.date().iso(),
  limit:    Joi.number().integer().min(1).max(1000).default(100),
  page:     Joi.number().integer().min(1).default(1),
});

// GET /api/v1/alerts
router.get('/', async (req, res, next) => {
  try {
    const { error, value } = querySchema.validate(req.query, { convert: true });
    if (error) {
      const err = new Error('Invalid query parameters');
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      err.details = error.details;
      return next(err);
    }

    const filter = {};
    if (value.sensorId !== undefined) filter.sensorId = value.sensorId;
    if (value.level    !== undefined) filter.level    = value.level;
    if (value.resolved !== undefined) filter.resolved = value.resolved;
    if (value.from || value.to) {
      filter.timestamp = {};
      if (value.from) filter.timestamp.$gte = value.from;
      if (value.to)   filter.timestamp.$lte = value.to;
    }

    const skip = (value.page - 1) * value.limit;
    const [data, total] = await Promise.all([
      Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(value.limit).lean(),
      Alert.countDocuments(filter),
    ]);

    res.json(successResponse(data, { 
      page: value.page, 
      limit: value.limit, 
      total, 
      pages: Math.ceil(total / value.limit) 
    }));
  } catch (err) { next(err); }
});

// PATCH /api/v1/alerts/:id/resolve
router.patch('/:id/resolve', async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) {
      const err = new Error('Alerta não encontrado');
      err.status = 404;
      err.code = 'NOT_FOUND';
      return next(err);
    }
    res.json(successResponse(alert));
  } catch (err) { next(err); }
});

// GET /api/v1/alerts/summary
router.get('/summary', async (req, res, next) => {
  try {
    const [total, unresolved, critical, warning] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ resolved: false }),
      Alert.countDocuments({ level: 'critical', resolved: false }),
      Alert.countDocuments({ level: 'warning',  resolved: false }),
    ]);
    res.json(successResponse({ total, unresolved, critical, warning }));
  } catch (err) { next(err); }
});

module.exports = router;
