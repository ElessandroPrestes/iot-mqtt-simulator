const { EventHubConsumerClient, earliestEventPosition } = require('@azure/event-hubs');
const metricsService = require('../services/metricsService');
const { TelemetryProcessor } = require('../services/telemetryProcessor');
const { invalidMessage, parseTelemetryPayload } = require('../services/telemetryPayload');
const logger = require('../utils/logger');
const { setAzureIngressStatus } = require('./status');

function extractMessageId(event) {
  const candidates = [
    event?.messageId,
    event?.properties?.messageId,
    event?.properties?.['message-id'],
    event?.systemProperties?.['message-id'],
    event?.systemProperties?.['iothub-messageid'],
    event?.systemProperties?.['iothub-message-id'],
  ];

  const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.length > 0);
  return value || null;
}

function eventBody(event) {
  const body = event?.body;

  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body && typeof body === 'object') return Buffer.from(JSON.stringify(body), 'utf8');
  return null;
}

class AzureEventHubsIngress {
  constructor({
    Client = EventHubConsumerClient,
    processor = new TelemetryProcessor(),
    log = logger,
    metrics = metricsService,
    io,
    setStatus = setAzureIngressStatus,
    maxBatchSize = 50,
    maxWaitTimeInSeconds = 5,
  } = {}) {
    this.Client = Client;
    this.processor = processor;
    this.logger = log;
    this.metrics = metrics;
    this.io = io;
    this.setStatus = setStatus;
    this.maxBatchSize = maxBatchSize;
    this.maxWaitTimeInSeconds = maxWaitTimeInSeconds;
    this.client = null;
    this.subscription = null;
    this.stopped = false;
    this.status = { connected: false, status: 'disabled' };
  }

  updateStatus(status) {
    this.status = { ...status };
    this.setStatus(this.status);
  }

  async start({ connectionString, eventHubName, consumerGroup = '$Default' } = {}) {
    if (this.client) throw new Error('Azure Event Hubs ingress already started');
    if (!connectionString) throw new Error('AZURE_EVENT_HUB_CONNECTION_STRING is required');
    if (!eventHubName) throw new Error('AZURE_EVENT_HUB_NAME is required');

    this.stopped = false;
    this.updateStatus({ connected: false, status: 'initializing' });

    try {
      this.client = new this.Client(consumerGroup, connectionString, eventHubName);
      this.subscription = await this.client.subscribe(
        {
          processEvents: (events, context) => this.handleEvents(events, context),
          processError: (err, context) => this.handleError(err, context),
          processInitialize: (context) => this.handleInitialize(context),
          processClose: (context) => this.handleClose(context),
        },
        {
          startPosition: earliestEventPosition,
          maxBatchSize: this.maxBatchSize,
          maxWaitTimeInSeconds: this.maxWaitTimeInSeconds,
        }
      );
      this.updateStatus({ connected: true, status: 'connected' });
    } catch (err) {
      this.metrics.telemetryIngressFailuresTotal.inc({
        transport: 'azure',
        reason: 'start',
      });
      this.updateStatus({ connected: false, status: 'error' });
      if (this.client) await this.client.close().catch(() => {});
      this.client = null;
      this.subscription = null;
      throw err;
    }
  }

  async handleEvents(events = []) {
    for (const event of events) {
      const started = process.hrtime.bigint();
      try {
        const messageId = extractMessageId(event);
        if (!messageId) throw invalidMessage('missing_message_id');

        const body = eventBody(event);
        if (!body || body.length === 0) throw invalidMessage('payload_size');

        const data = parseTelemetryPayload(body);
        this.metrics.telemetryMessagesTotal.inc({
          transport: 'azure',
          outcome: 'accepted',
        });

        const result = await this.processor.process(data, {
          io: this.io,
          messageId,
          source: 'azure',
        });

        this.metrics.telemetryMessagesTotal.inc({
          transport: 'azure',
          outcome: result.duplicate ? 'duplicate' : 'processed',
        });
      } catch (err) {
        const reason = err.reason || 'processing';
        this.metrics.telemetryMessagesTotal.inc({
          transport: 'azure',
          outcome: 'rejected',
        });
        this.metrics.telemetryMessagesRejectedTotal.inc({
          transport: 'azure',
          reason,
        });
        this.logger.warn('Azure Event Hubs message rejected', {
          event: 'azure.message_rejected',
          reason,
        });
      } finally {
        this.metrics.telemetryProcessingDurationSeconds.observe(
          { transport: 'azure' },
          Number(process.hrtime.bigint() - started) / 1e9
        );
      }
    }
  }

  handleError(err, context = {}) {
    this.metrics.telemetryIngressFailuresTotal.inc({
      transport: 'azure',
      reason: 'event_hubs_error',
    });
    this.updateStatus({ connected: false, status: 'error' });
    this.logger.error('Azure Event Hubs error', {
      event: 'azure.ingress_error',
      partitionId: context.partitionId,
      error: err.message,
    });
  }

  handleInitialize(context = {}) {
    this.updateStatus({ connected: true, status: 'connected' });
    this.logger.info('Azure Event Hubs partition initialized', {
      event: 'azure.partition_initialized',
      partitionId: context.partitionId,
    });
  }

  handleClose(context = {}) {
    this.updateStatus({ connected: false, status: 'disconnected' });
    this.logger.info('Azure Event Hubs partition closed', {
      event: 'azure.partition_closed',
      partitionId: context.partitionId,
    });
  }

  async stop() {
    if (this.stopped) return;
    this.stopped = true;

    const subscription = this.subscription;
    const client = this.client;
    this.subscription = null;
    this.client = null;

    let failure;
    try {
      if (subscription) await subscription.close();
    } catch (err) {
      failure = err;
    }
    try {
      if (client) await client.close();
    } catch (err) {
      failure = failure || err;
    }

    this.updateStatus({ connected: false, status: 'disconnected' });
    if (failure) throw failure;
  }

  getStatus() {
    return { ...this.status };
  }
}

module.exports = {
  AzureEventHubsIngress,
  eventBody,
  extractMessageId,
};
