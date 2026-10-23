function createIngress(transport, options = {}) {
  if (transport === 'local') {
    const { LocalMqttIngress } = require('./localMqttIngress');
    return new LocalMqttIngress(options);
  }

  if (transport === 'azure') {
    const { AzureEventHubsIngress } = require('./azureEventHubsIngress');
    return new AzureEventHubsIngress(options);
  }

  throw new Error('transport must be local or azure');
}

module.exports = { createIngress };
