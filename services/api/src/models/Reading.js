const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema(
  {
    sensorId:  { type: String, required: true, index: true },
    type:      { type: String, required: true, enum: ['temperature', 'pressure', 'humidity', 'vibration'] },
    value:     { type: Number, required: true },
    unit:      { type: String, required: true },
    status:    { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
    isAnomaly: { type: Boolean, default: false },
    metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'sensorId',
      granularity: 'seconds',
    },
  }
);

// TTL: apaga leituras com mais de 7 dias
readingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Reading', readingSchema);
