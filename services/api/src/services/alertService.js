const Alert = require('../models/Alert');

async function findAll({ sensorId, level, resolved, from, to, limit = 100, page = 1 }) {
  const filter = {};
  if (sensorId)          filter.sensorId = sensorId;
  if (level)             filter.level    = level;
  if (resolved !== undefined) filter.resolved = resolved === 'true' || resolved === true;
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to)   filter.timestamp.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    Alert.countDocuments(filter),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

async function resolve(id) {
  return Alert.findByIdAndUpdate(
    id,
    { resolved: true, resolvedAt: new Date() },
    { new: true }
  );
}

async function countUnresolved() {
  return Alert.countDocuments({ resolved: false });
}

module.exports = { findAll, resolve, countUnresolved };
