import { setActivePinia, createPinia } from 'pinia';
import { useConnectionStore } from '@/stores/connection';
import { describe, it, expect, beforeEach } from 'vitest';

describe('useConnectionStore', () => {
  beforeEach(() => { setActivePinia(createPinia()); });

  it('inicia desconectado', () => {
    const store = useConnectionStore();
    expect(store.status).toBe('disconnected');
    expect(store.isConnected).toBe(false);
    expect(store.socketId).toBeNull();
  });

  it('setStatus(connected) atualiza status e socketId', () => {
    const store = useConnectionStore();
    store.setStatus('connected', 'socket-abc');
    expect(store.status).toBe('connected');
    expect(store.socketId).toBe('socket-abc');
    expect(store.isConnected).toBe(true);
    expect(store.connectedAt).toBeInstanceOf(Date);
  });

  it('setStatus(disconnected) limpa socketId', () => {
    const store = useConnectionStore();
    store.setStatus('connected', 'socket-abc');
    store.setStatus('disconnected');
    expect(store.status).toBe('disconnected');
    expect(store.socketId).toBeNull();
    expect(store.isConnected).toBe(false);
  });

  it('setStatus(error) ativa isError', () => {
    const store = useConnectionStore();
    store.setStatus('error');
    expect(store.isError).toBe(true);
    expect(store.isConnected).toBe(false);
  });

  it('connectedAt é null antes de conectar', () => {
    const store = useConnectionStore();
    expect(store.connectedAt).toBeNull();
  });
});
