class SensorStrategy {
  constructor(warn, critical, unit) {
    this.warn = warn;
    this.critical = critical;
    this.unit = unit;
  }

  classify(value) {
    if (value >= this.critical) return 'critical';
    if (value >= this.warn) return 'warning';
    return 'normal';
  }
}

class TemperatureStrategy extends SensorStrategy {
  constructor() {
    super(parseFloat(process.env.TEMP_WARN_THRESHOLD) || 70, parseFloat(process.env.TEMP_CRITICAL_THRESHOLD) || 90, '°C');
  }
}

class PressureStrategy extends SensorStrategy {
  constructor() {
    super(parseFloat(process.env.PRESSURE_WARN_THRESHOLD) || 8.5, parseFloat(process.env.PRESSURE_CRITICAL_THRESHOLD) || 10, 'bar');
  }
}

class HumidityStrategy extends SensorStrategy {
  constructor() {
    super(parseFloat(process.env.HUMIDITY_WARN_THRESHOLD) || 80, parseFloat(process.env.HUMIDITY_CRITICAL_THRESHOLD) || 90, '%');
  }
}

class VibrationStrategy extends SensorStrategy {
  constructor() {
    super(parseFloat(process.env.VIBRATION_WARN_THRESHOLD) || 4.5, parseFloat(process.env.VIBRATION_CRITICAL_THRESHOLD) || 6.0, 'mm/s');
  }
}

class StrategyContext {
  constructor() {
    this.strategies = {
      temperature: new TemperatureStrategy(),
      pressure: new PressureStrategy(),
      humidity: new HumidityStrategy(),
      vibration: new VibrationStrategy(),
    };
  }

  classify(type, value) {
    const strategy = this.strategies[type];
    if (!strategy) return 'normal';
    return strategy.classify(value);
  }

  getUnit(type) {
    return this.strategies[type]?.unit || '';
  }
}

module.exports = new StrategyContext();
