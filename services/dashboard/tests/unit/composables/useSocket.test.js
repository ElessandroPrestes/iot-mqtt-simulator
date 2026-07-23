import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { useSocket } from '@/composables/useSocket';
import { useConnectionStore } from '@/stores/connection';
import { useSensorsStore } from '@/stores/sensors';
import { useAlertsStore } from '@/stores/alerts';
import { io } from 'socket.io-client';

vi.mock('socket.io-client');

describe('useSocket.js', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      on: vi.fn(),
      disconnect: vi.fn(),
    };
    io.mockReturnValue(mockSocket);
    vi.clearAllMocks();
  });

  const TestComponent = {
    template: '<div></div>',
    setup() {
      return useSocket();
    }
  };

  it('initializes socket and stores on mount', () => {
    const wrapper = mount(TestComponent, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    });

    expect(io).toHaveBeenCalled();
    expect(wrapper.vm.socket).toEqual(mockSocket);

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reading:new', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('alert:new', expect.any(Function));
  });

  it('updates connection store when connect event fires', () => {
    mount(TestComponent, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    });
    const connStore = useConnectionStore();
    
    const connectCb = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectCb();

    expect(connStore.setStatus).toHaveBeenCalledWith('connected', 'test-socket-id');
  });

  it('updates stores on new reading and alert events', () => {
    mount(TestComponent, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    });
    const sensorsStore = useSensorsStore();
    const alertsStore = useAlertsStore();
    
    const readingCb = mockSocket.on.mock.calls.find(call => call[0] === 'reading:new')[1];
    const alertCb = mockSocket.on.mock.calls.find(call => call[0] === 'alert:new')[1];

    const mockReading = { sensorId: 'S-1', value: 10 };
    const mockAlert = { id: 'A-1', message: 'test alert' };

    readingCb(mockReading);
    alertCb(mockAlert);

    expect(sensorsStore.updateReading).toHaveBeenCalledWith(mockReading);
    expect(alertsStore.addAlert).toHaveBeenCalledWith(mockAlert);
  });

  it('disconnects on unmount', () => {
    const wrapper = mount(TestComponent, {
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    });
    expect(mockSocket.disconnect).not.toHaveBeenCalled();

    wrapper.unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
