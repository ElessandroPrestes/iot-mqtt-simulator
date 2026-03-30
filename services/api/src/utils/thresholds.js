const thresholds = {
  temperature: {
    warn:     parseFloat(process.env.TEMP_WARN_THRESHOLD)     || 70,
    critical: parseFloat(process.env.TEMP_CRITICAL_THRESHOLD) || 90,
    unit: '°C',
  },
  pressure: {
    warn:     parseFloat(process.env.PRESSURE_WARN_THRESHOLD)     || 8.5,
    critical: parseFloat(process.env.PRESSURE_CRITICAL_THRESHOLD) || 10,
    unit: 'bar',
  },
  humidity: {
    warn:     parseFloat(process.env.HUMIDITY_WARN_THRESHOLD)     || 80,
    critical: parseFloat(process.env.HUMIDITY_CRITICAL_THRESHOLD) || 90,
    unit: '%',
  },
  vibration: {
    warn:     parseFloat(process.env.VIBRATION_WARN_THRESHOLD)     || 4.5,
    critical: parseFloat(process.env.VIBRATION_CRITICAL_THRESHOLD) || 6.0,
    unit: 'mm/s',
  },
};

function classify(type, value) {
  const t = thresholds[type];
  if (!t) return 'normal';
  if (value >= t.critical) return 'critical';
  if (value >= t.warn)     return 'warning';
  return 'normal';
}

module.exports = { thresholds, classify };
