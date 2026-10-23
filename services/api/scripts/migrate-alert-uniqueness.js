require('dotenv').config();

const tls = require('tls');
const mongoose = require('mongoose');
const Alert = require('../src/models/Alert');
const { readSecretFile } = require('../src/config/security');
const { sanitizeString } = require('../src/utils/redact');

const INDEX_NAME = 'uniq_active_alert_per_sensor_level';
const INDEX_OPTIONS = {
  unique: true,
  partialFilterExpression: { resolved: false },
  name: INDEX_NAME,
};

function mongoOptions(env = process.env) {
  const options = { dbName: env.MONGODB_DB_NAME || 'iot_dashboard' };

  if (env.NODE_ENV === 'production') {
    options.tls = true;
    options.secureContext = tls.createSecureContext({
      ca: readSecretFile(env.INTERNAL_CA_FILE, 'INTERNAL_CA'),
      cert: readSecretFile(env.API_CLIENT_CERT_FILE, 'API_CLIENT_CERT'),
      key: readSecretFile(env.API_CLIENT_KEY_FILE, 'API_CLIENT_KEY'),
      minVersion: 'TLSv1.2',
    });
  }

  return options;
}

async function migrateAlertUniqueness({ AlertModel = Alert, now = new Date() } = {}) {
  const duplicateGroups = await AlertModel.aggregate([
    { $match: { resolved: false } },
    { $sort: { timestamp: -1, _id: -1 } },
    {
      $group: {
        _id: { sensorId: '$sensorId', level: '$level' },
        ids: { $push: '$_id' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  let resolved = 0;
  for (const group of duplicateGroups) {
    const duplicates = group.ids.slice(1);
    const result = await AlertModel.updateMany(
      { _id: { $in: duplicates }, resolved: false },
      { $set: { resolved: true, resolvedAt: now } }
    );
    resolved += result.modifiedCount;
  }

  await AlertModel.collection.createIndex(
    { sensorId: 1, level: 1 },
    INDEX_OPTIONS
  );

  return { duplicateGroups: duplicateGroups.length, resolved };
}

async function main() {
  const uri = readSecretFile(process.env.MONGODB_URI_FILE, 'MONGODB_URI')
    || process.env.MONGODB_URI;

  if (!uri) throw new Error('MONGODB_URI or MONGODB_URI_FILE is required');

  await mongoose.connect(uri, mongoOptions());
  try {
    const result = await migrateAlertUniqueness();
    console.log(JSON.stringify(result));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(sanitizeString(err.message));
    process.exitCode = 1;
  });
}

module.exports = {
  INDEX_NAME,
  INDEX_OPTIONS,
  migrateAlertUniqueness,
  mongoOptions,
};
