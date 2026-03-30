export class PressureSensor {
  constructor(id, options = {}) {
    this.id = id;
    this.type = 'pressure';
    this.unit = 'bar';
    this.baseValue = options.baseValue ?? 6.0;
    this.variance = options.variance ?? 3;
    this.anomalyProbability = options.anomalyProbability ?? 0.05;
    this._lastValue = this.baseValue;
  }

  read() {
    const isAnomaly = Math.random() < this.anomalyProbability;

    let value;
    if (isAnomaly) {
      value = this.baseValue * (1.2 + Math.random() * 0.3);
    } else {
      const noise = (Math.random() - 0.5) * this.variance * 0.2;
      const reversion = (this.baseValue - this._lastValue) * 0.1;
      value = this._lastValue + noise + reversion;
    }

    value = Math.max(0, Math.min(15, value));
    this._lastValue = value;

    return {
      sensorId: this.id,
      type: this.type,
      value: parseFloat(value.toFixed(2)),
      unit: this.unit,
      isAnomaly,
      timestamp: new Date().toISOString(),
      metadata: {
        location: `Zone-${Math.ceil(this.id.charCodeAt(this.id.length - 1) / 2)}`,
        equipment: `Machine-${this.id}`,
      },
    };
  }
}
