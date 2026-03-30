const router = require('express').Router();
const Reading = require('../models/Reading');

// GET /api/v1/sensors — lista sensores únicos com última leitura
router.get('/', async (req, res, next) => {
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
    res.json({ data: sensors });
  } catch (err) { next(err); }
});

// GET /api/v1/sensors/:id — histórico de um sensor
router.get('/:id', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const readings = await Reading.find({ sensorId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    if (!readings.length) return res.status(404).json({ error: 'Sensor não encontrado' });
    res.json({ data: readings });
  } catch (err) { next(err); }
});

module.exports = router;
