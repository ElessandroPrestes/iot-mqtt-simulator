const { LocalMqttIngress } = require('../../../src/ingress/localMqttIngress');

describe('LocalMqttIngress', () => {
  it('delegates start and status to the MQTT service', () => {
    const client = { end: jest.fn() };
    const mqtt = {
      init: jest.fn().mockReturnValue(client),
      getStatus: jest.fn().mockReturnValue({ connected: true, status: 'connected' }),
    };
    const ingress = new LocalMqttIngress({ mqtt });
    const io = { emit: jest.fn() };
    const config = { url: 'mqtt://localhost:1883' };

    expect(ingress.start(io, config)).toBe(client);
    expect(mqtt.init).toHaveBeenCalledWith(io, config);
    expect(ingress.getStatus()).toEqual({ connected: true, status: 'connected' });
  });

  it('closes the MQTT client once and tolerates repeated stops', async () => {
    const client = {
      end: jest.fn((force, options, callback) => callback()),
    };
    const ingress = new LocalMqttIngress({
      mqtt: { init: jest.fn().mockReturnValue(client) },
    });
    ingress.start({}, {});

    await ingress.stop();
    await ingress.stop();

    expect(client.end).toHaveBeenCalledTimes(1);
    expect(client.end).toHaveBeenCalledWith(false, {}, expect.any(Function));
  });

  it('does nothing when stopped before start', async () => {
    const mqtt = { init: jest.fn(), getStatus: jest.fn() };
    const ingress = new LocalMqttIngress({ mqtt });

    await expect(ingress.stop()).resolves.toBeUndefined();
    expect(mqtt.init).not.toHaveBeenCalled();
  });
});
