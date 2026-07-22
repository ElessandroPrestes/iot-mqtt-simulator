import { setActivePinia, createPinia } from 'pinia';
import { useAlertsStore } from '@/stores/alerts';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: {
    get:   vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';

const makeAlert = (overrides = {}) => ({
  _id: `id-${Math.random()}`,
  sensorId: 'TEMP-01',
  level: 'warning',
  message: 'Test alert',
  resolved: false,
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe('useAlertsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('inicia vazio', () => {
    const store = useAlertsStore();
    expect(store.alerts).toHaveLength(0);
    expect(store.unresolvedCount).toBe(0);
  });

  it('addAlert adiciona no início da lista', () => {
    const store = useAlertsStore();
    store.addAlert(makeAlert({ message: 'primeiro' }));
    store.addAlert(makeAlert({ message: 'segundo' }));
    expect(store.alerts[0].message).toBe('segundo');
  });

  it('lista limitada a 200 alertas', () => {
    const store = useAlertsStore();
    for (let i = 0; i < 210; i++) store.addAlert(makeAlert());
    expect(store.alerts.length).toBeLessThanOrEqual(200);
  });

  it('unresolvedAlerts filtra resolved=false', () => {
    const store = useAlertsStore();
    store.addAlert(makeAlert({ resolved: false }));
    store.addAlert(makeAlert({ resolved: true }));
    expect(store.unresolvedAlerts).toHaveLength(1);
  });

  it('criticalAlerts filtra level=critical não resolvidos', () => {
    const store = useAlertsStore();
    store.addAlert(makeAlert({ level: 'critical', resolved: false }));
    store.addAlert(makeAlert({ level: 'warning',  resolved: false }));
    store.addAlert(makeAlert({ level: 'critical', resolved: true }));
    expect(store.criticalAlerts).toHaveLength(1);
  });

  it('warningAlerts filtra level=warning não resolvidos', () => {
    const store = useAlertsStore();
    store.addAlert(makeAlert({ level: 'warning', resolved: false }));
    store.addAlert(makeAlert({ level: 'critical', resolved: false }));
    expect(store.warningAlerts).toHaveLength(1);
  });

  it('unresolvedCount reflete alertas pendentes', () => {
    const store = useAlertsStore();
    store.addAlert(makeAlert({ resolved: false }));
    store.addAlert(makeAlert({ resolved: false }));
    store.addAlert(makeAlert({ resolved: true }));
    expect(store.unresolvedCount).toBe(2);
  });

  it('fetchAlerts popula lista via API', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: [makeAlert()] } });
    const store = useAlertsStore();
    await store.fetchAlerts();
    expect(store.alerts).toHaveLength(1);
    expect(store.loading).toBe(false);
  });

  it('fetchAlerts define error em caso de falha', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('timeout'));
    const store = useAlertsStore();
    await store.fetchAlerts();
    expect(store.error).toBe('timeout');
  });

  it('resolveAlert atualiza alerta na lista', async () => {
    const alert = makeAlert({ _id: 'abc', resolved: false });
    const resolved = { ...alert, resolved: true, resolvedAt: new Date().toISOString() };
    apiClient.patch.mockResolvedValueOnce({ data: { data: resolved } });
    const store = useAlertsStore();
    store.alerts.push(alert);
    await store.resolveAlert('abc');
    expect(store.alerts[0].resolved).toBe(true);
  });
});
