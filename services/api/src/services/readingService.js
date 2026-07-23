const readingRepository = require('../repositories/readingRepository');

async function findAll({ sensorId, type, status, from, to, limit = 100, page = 1 }) {
  const filter = {};
  if (sensorId) filter.sensorId = sensorId;
  if (type)     filter.type     = type;
  if (status)   filter.status   = status;
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to)   filter.timestamp.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    readingRepository.findPaginated(filter, skip, limit),
    readingRepository.count(filter),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

async function findLatestPerSensor() {
  return readingRepository.aggregate([
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$sensorId', doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { sensorId: 1 } },
  ]);
}

async function findStats(sinceMs = 3_600_000) {
  const since = new Date(Date.now() - sinceMs);
  return readingRepository.aggregate([
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
}

module.exports = { findAll, findLatestPerSensor, findStats };
