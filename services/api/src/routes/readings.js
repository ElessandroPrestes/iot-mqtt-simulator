const router = require('express').Router();
const Reading = require('../models/Reading');
const Joi = require('joi');

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
    if (error) return res.status(400).json({ error: error.details[0].message });

    const filter = {};
    if (value.sensorId) filter.sensorId = value.sensorId;
    if (value.type)     filter.type     = value.type;
    if (value.status)   filter.status   = value.status;
    if (value.from || value.to) {
      filter.timestamp = {};
      if (value.from) filter.timestamp.$gte = value.from;
      if (value.to)   filter.timestamp.$lte = value.to;
    }

    const skip = (value.page - 1) * value.limit;
    const [readings, total] = await Promise.all([
      Reading.find(filter).sort({ timestamp: -1 }).skip(skip).limit(value.limit).lean(),
      Reading.countDocuments(filter),
    ]);

    res.json({
      data: readings,
      pagination: { page: value.page, limit: value.limit, total, pages: Math.ceil(total / value.limit) },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/readings/latest
router.get('/latest', async (req, res, next) => {
  try {
    const latest = await Reading.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$sensorId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { sensorId: 1 } },
    ]);
    res.json({ data: latest });
  } catch (err) { next(err); }
});

// GET /api/v1/readings/stats
router.get('/stats', async (req, res, next) => {
  try {
    const sinceMs = parseInt(req.query.since) || 3600000;
    const since = new Date(Date.now() - sinceMs);

    const stats = await Reading.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: {
        _id: { sensorId: '$sensorId', type: '$type' },
        avg:       { $avg: '$value' },
        max:       { $max: '$value' },
        min:       { $min: '$value' },
        count:     { $sum: 1 },
        anomalies: { $sum: { $cond: ['$isAnomaly', 1, 0] } },
      }},
      { $sort: { '_id.sensorId': 1 } },
    ]);
    res.json({ data: stats, since });
  } catch (err) { next(err); }
});

module.exports = router;
