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

alertSchema.index(
  { sensorId: 1, level: 1 },
  {
    unique: true,
    partialFilterExpression: { resolved: false },
    name: 'uniq_active_alert_per_sensor_level',
  }
);

module.exports = mongoose.model('Alert', alertSchema);
