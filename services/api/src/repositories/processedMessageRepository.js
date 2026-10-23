const ProcessedMessage = require('../models/ProcessedMessage');

const PROCESSING_LEASE_MS = 60_000;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

class ProcessedMessageRepository {
  async claim(messageKey, {
    source,
    sensorId,
    now = new Date(),
    leaseMs = PROCESSING_LEASE_MS,
    retentionMs = RETENTION_MS,
  }) {
    if (!messageKey) throw new Error('messageKey is required');

    const leaseUntil = new Date(now.getTime() + leaseMs);
    const expiresAt = new Date(now.getTime() + retentionMs);

    try {
      await ProcessedMessage.create({
        _id: messageKey,
        source,
        sensorId,
        status: 'processing',
        claimedAt: now,
        leaseUntil,
        expiresAt,
      });
      return true;
    } catch (err) {
      if (err.code !== 11000) throw err;
    }

    const result = await ProcessedMessage.updateOne(
      {
        _id: messageKey,
        status: 'processing',
        leaseUntil: { $lte: now },
      },
      {
        $set: {
          source,
          sensorId,
          status: 'processing',
          claimedAt: now,
          leaseUntil,
          expiresAt,
        },
        $unset: { processedAt: 1 },
      }
    );

    return result.modifiedCount === 1;
  }

  async complete(messageKey, { now = new Date(), retentionMs = RETENTION_MS } = {}) {
    return ProcessedMessage.updateOne(
      { _id: messageKey, status: 'processing' },
      {
        $set: {
          status: 'processed',
          processedAt: now,
          expiresAt: new Date(now.getTime() + retentionMs),
        },
        $unset: { leaseUntil: 1 },
      }
    );
  }

  async release(messageKey) {
    return ProcessedMessage.deleteOne({ _id: messageKey, status: 'processing' });
  }

  async findById(messageKey) {
    return ProcessedMessage.findById(messageKey).lean();
  }
}

module.exports = new ProcessedMessageRepository();
module.exports.PROCESSING_LEASE_MS = PROCESSING_LEASE_MS;
module.exports.RETENTION_MS = RETENTION_MS;
