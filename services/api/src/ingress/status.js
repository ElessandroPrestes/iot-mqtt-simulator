let activeTransport = 'local';
let azureEventHubs = { connected: false, status: 'disabled' };

function configureTransport(transport) {
  if (transport !== 'local' && transport !== 'azure') {
    throw new Error('transport must be local or azure');
  }
  activeTransport = transport;
  if (transport === 'local') {
    azureEventHubs = { connected: false, status: 'disabled' };
  }
}

function getTransport() {
  return activeTransport;
}

function setAzureIngressStatus(status) {
  if (!status || typeof status.status !== 'string') {
    throw new Error('status is required');
  }
  azureEventHubs = {
    connected: status.connected === true,
    status: status.status,
  };
}

function getAzureIngressStatus() {
  return { ...azureEventHubs };
}

module.exports = {
  configureTransport,
  getAzureIngressStatus,
  getTransport,
  setAzureIngressStatus,
};
