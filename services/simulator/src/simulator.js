export class Simulator {
  constructor({
    sensors,
    publisher,
    intervalMs,
    logger,
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
  }) {
    this.sensors = sensors;
    this.publisher = publisher;
    this.intervalMs = intervalMs;
    this.logger = logger;
    this.setIntervalFn = setIntervalFn;
    this.clearIntervalFn = clearIntervalFn;
    this.timer = null;
    this.stopped = false;
  }

  start() {
    if (this.timer || this.stopped) return false;

    this.timer = this.setIntervalFn(() => this.publishOnce(), this.intervalMs);

    return true;
  }

  publishOnce() {
    const pending = this.sensors.map(({ sensor, topic }) => {
      const reading = sensor.read();
      const payload = JSON.stringify(reading);

      if (reading.isAnomaly) {
        this.logger.warn('Sensor anomaly detected', {
          sensorId: sensor.id,
          value: reading.value,
          unit: reading.unit,
        });
      }

      return Promise.resolve()
        .then(() => this.publisher.publish(topic, payload))
        .catch((err) => {
          this.logger.error('Telemetry publish failed', {
            topic,
            error: err.message,
          });
        });
    });

    return Promise.allSettled(pending);
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;

    if (this.timer) {
      this.clearIntervalFn(this.timer);
      this.timer = null;
    }
  }

  get running() {
    return this.timer !== null;
  }
}
