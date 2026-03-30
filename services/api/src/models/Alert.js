const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    sensorId:  { type: String, required: true, index: true },
    type:      { type: String, required: true },
    level:     { type: String, enum: ['warning', 'critical'], required: true },
    value:     { type: Number, required: true },
    unit:      { type: String },
    threshold: { type: Number },
    message:   { type: String, required: true },
    resolved:  { type: Boolean, default: false },
    resolvedAt: { type: Date },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
