const mqttService = require('../services/mqttService');

class LocalMqttIngress {
  constructor({ mqtt = mqttService } = {}) {
    this.mqtt = mqtt;
    this.client = null;
  }

  start(io, config) {
    this.client = this.mqtt.init(io, config);
    return this.client;
  }

  async stop() {
    if (!this.client) return;
    const client = this.client;
    this.client = null;

    await new Promise((resolve) => {
      client.end(false, {}, resolve);
    });
  }

  getStatus() {
    return this.mqtt.getStatus();
  }
}

module.exports = { LocalMqttIngress };
