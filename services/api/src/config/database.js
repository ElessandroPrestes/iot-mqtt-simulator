const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./index');

async function connect() {
  await mongoose.connect(config.mongo.uri, { dbName: config.mongo.dbName });
  logger.info('MongoDB connected', { uri: config.mongo.uri });
}

async function disconnect() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

module.exports = { connect, disconnect };
