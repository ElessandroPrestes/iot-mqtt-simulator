import { setActivePinia, createPinia } from 'pinia';
import { useSensorsStore } from '@/stores/sensors';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/api/client';

describe('useSensorsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('inicia vazio', () => {
    const store = useSensorsStore();
    expect(store.sensorList).toHaveLength(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('updateReading adiciona leitura nova', () => {
    const store = useSensorsStore();
    store.updateReading({ sensorId: 'TEMP-01', value: 55, status: 'normal' });
    expect(store.sensorList).toHaveLength(1);
  });

  it('updateReading substitui leitura existente do mesmo sensor', () => {
    const store = useSensorsStore();
    store.updateReading({ sensorId: 'TEMP-01', value: 55, status: 'normal' });
    store.updateReading({ sensorId: 'TEMP-01', value: 75, status: 'warning' });
    expect(store.sensorList).toHaveLength(1);
    expect(store.sensorList[0].value).toBe(75);
  });

  it('updateReading adiciona ao histórico', () => {
    const store = useSensorsStore();
    store.updateReading({ sensorId: 'TEMP-01', value: 55, status: 'normal' });
    store.updateReading({ sensorId: 'TEMP-01', value: 75, status: 'warning' });
    expect(store.history).toHaveLength(2);
  });

  it('histórico limitado a 500 entradas', () => {
    const store = useSensorsStore();
    for (let i = 0; i < 510; i++) {
      store.updateReading({ sensorId: `S-${i}`, value: i, status: 'normal' });
    }
    expect(store.history.length).toBeLessThanOrEqual(500);
  });

  it('criticalSensors filtra corretamente', () => {
    const store = useSensorsStore();
    store.updateReading({ sensorId: 'A', value: 95, status: 'critical' });
    store.updateReading({ sensorId: 'B', value: 75, status: 'warning' });
    store.updateReading({ sensorId: 'C', value: 50, status: 'normal' });
    expect(store.criticalSensors).toHaveLength(1);
    expect(store.criticalSensors[0].sensorId).toBe('A');
  });

  it('warningSensors filtra corretamente', () => {
    const store = useSensorsStore();
    store.updateReading({ sensorId: 'A', value: 95, status: 'critical' });
    store.updateReading({ sensorId: 'B', value: 75, status: 'warning' });
    expect(store.warningSensors).toHaveLength(1);
    expect(store.warningSensors[0].sensorId).toBe('B');
  });

  it('fetchLatest popula readings via API', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [{ sensorId: 'HUMI-01', value: 60, status: 'normal' }] },
    });
    const store = useSensorsStore();
    await store.fetchLatest();
    expect(store.readings.size).toBe(1);
    expect(store.loading).toBe(false);
  });

  it('fetchLatest define error em caso de falha', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('network error'));
    const store = useSensorsStore();
    await store.fetchLatest();
    expect(store.error).toBe('network error');
    expect(store.loading).toBe(false);
  });

  it('fetchStats popula stats', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: [{ _id: 'x', avg: 55 }] } });
    const store = useSensorsStore();
    await store.fetchStats();
    expect(store.stats).toHaveLength(1);
  });
});
