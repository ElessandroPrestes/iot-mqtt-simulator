const alertRepository = require('../repositories/alertRepository');

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
    alertRepository.findPaginated(filter, skip, limit),
    alertRepository.count(filter),
  ]);

  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}

async function resolve(id) {
  return alertRepository.updateById(
    id,
    { resolved: true, resolvedAt: new Date() }
  );
}

async function countUnresolved() {
  return alertRepository.count({ resolved: false });
}

module.exports = { findAll, resolve, countUnresolved };
