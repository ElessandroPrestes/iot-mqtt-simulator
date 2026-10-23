const { createIngress } = require('../../../src/ingress/createIngress');
const { LocalMqttIngress } = require('../../../src/ingress/localMqttIngress');
const { AzureEventHubsIngress } = require('../../../src/ingress/azureEventHubsIngress');

describe('createIngress', () => {
  it('creates the local ingress', () => {
    expect(createIngress('local')).toBeInstanceOf(LocalMqttIngress);
  });

  it('creates the Azure Event Hubs ingress', () => {
    expect(createIngress('azure')).toBeInstanceOf(AzureEventHubsIngress);
  });

  it('rejects an unknown transport', () => {
    expect(() => createIngress('aws')).toThrow('transport must be local or azure');
  });
});
