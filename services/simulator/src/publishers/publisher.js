export class TelemetryPublisher {
  async start() {}

  async publish() {
    throw new Error('publish() must be implemented by a telemetry publisher');
  }

  async stop() {}
}
