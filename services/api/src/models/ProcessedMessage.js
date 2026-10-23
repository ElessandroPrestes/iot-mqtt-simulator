const mongoose = require('mongoose');

const processedMessageSchema = new mongoose.Schema(
  {
    _id:       { type: String, required: true },
    source:    { type: String, required: true },
    sensorId:  { type: String },
    status:    { type: String, enum: ['processing', 'processed'], required: true },
    claimedAt: { type: Date, required: true },
    leaseUntil: { type: Date, required: true },
    processedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

processedMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ProcessedMessage', processedMessageSchema);
