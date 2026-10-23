const readingRepository = require('../repositories/readingRepository');
const alertRepository = require('../repositories/alertRepository');
const processedMessageRepository = require('../repositories/processedMessageRepository');
const strategyContext = require('../strategies/thresholdStrategy');
const logger = require('../utils/logger');
const metrics = require('./metricsService');

function toPlain(value) {
  return value && typeof value.toObject === 'function' ? value.toObject() : value;
}

class TelemetryProcessor {
  constructor({
    readingRepo = readingRepository,
    alertRepo = alertRepository,
    processedMessageRepo = processedMessageRepository,
    strategy = strategyContext,
    log = logger,
    metric = metrics,
  } = {}) {
    this.readingRepository = readingRepo;
    this.alertRepository = alertRepo;
    this.processedMessageRepository = processedMessageRepo;
    this.strategyContext = strategy;
    this.logger = log;
    this.metrics = metric;
  }

  async process(data, { io, messageId, source = 'mqtt' } = {}) {
    const sensorType = data.sensorType || data.type;
    const messageKey = messageId ? `${source}:${messageId}` : null;
    let claimed = false;

    if (messageKey) {
      claimed = await this.processedMessageRepository.claim(messageKey, {
        source,
        sensorId: data.sensorId,
      });
      if (!claimed) {
        this.logger.info('Duplicate telemetry ignored', {
          event: 'telemetry.duplicate',
          messageId,
          source,
          sensorId: data.sensorId,
        });
        return { duplicate: true };
      }
    }

    try {
      const status = this.strategyContext.classify(sensorType, data.value);
      this.metrics.sensorValueGauge.set(
        { sensor_id: data.sensorId, sensor_type: sensorType, unit: data.unit },
        data.value
      );

      const reading = await this.readingRepository.create({
        sensorId: data.sensorId,
        type: sensorType,
        value: data.value,
        unit: data.unit,
        status,
        isAnomaly: data.isAnomaly,
        metadata: data.metadata,
        timestamp: data.timestamp,
      });

      let alert = null;
      if (status !== 'normal') {
        const existingAlert = await this.alertRepository.findActiveAlert(
          data.sensorId,
          status
        );

        if (!existingAlert) {
          try {
            alert = await this.alertRepository.create({
              sensorId: data.sensorId,
              type: sensorType,
              level: status,
              value: data.value,
              unit: data.unit,
              message: `Sensor ${data.sensorId}: ${data.value}${data.unit} (${status.toUpperCase()})`,
              timestamp: data.timestamp,
            });
            this.metrics.alertsTotal.inc({ level: status, sensor_type: sensorType });
            io?.emit('alert:new', toPlain(alert));
            this.logger.warn('Alert generated', {
              sensorId: data.sensorId,
              status,
              value: data.value,
            });
          } catch (err) {
            if (err.code !== 11000) throw err;
            this.logger.warn('Active alert already exists', {
              sensorId: data.sensorId,
              status,
            });
          }
        }
      } else {
        const result = await this.alertRepository.resolveAlertsBySensor(data.sensorId);
        if (result && result.modifiedCount > 0) {
          this.logger.info('Alerts auto-resolved', {
            sensorId: data.sensorId,
            count: result.modifiedCount,
          });
        }
      }

      io?.emit('reading:new', { ...toPlain(reading), status });

      if (claimed) {
        try {
          await this.processedMessageRepository.complete(messageKey);
        } catch (err) {
          this.logger.error('Processed message completion failed', {
            event: 'telemetry.completion_failed',
            messageId,
            error: err.message,
          });
        }
      }

      return { duplicate: false, reading, status, alert };
    } catch (err) {
      if (claimed) {
        try {
          await this.processedMessageRepository.release(messageKey);
        } catch (releaseErr) {
          this.logger.error('Processed message release failed', {
            event: 'telemetry.release_failed',
            messageId,
            error: releaseErr.message,
          });
        }
      }
      throw err;
    }
  }
}

module.exports = { TelemetryProcessor };
