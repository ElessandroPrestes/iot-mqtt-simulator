import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@/api/client';

export const useAlertsStore = defineStore('alerts', () => {
  const alerts  = ref([]);
  const loading = ref(false);
  const error   = ref(null);

  const unresolvedAlerts  = computed(() => alerts.value.filter(a => !a.resolved));
  const criticalAlerts    = computed(() => unresolvedAlerts.value.filter(a => a.level === 'critical'));
  const warningAlerts     = computed(() => unresolvedAlerts.value.filter(a => a.level === 'warning'));
  const unresolvedCount   = computed(() => unresolvedAlerts.value.length);

  function addAlert(alert) {
    alerts.value.unshift(alert);
    if (alerts.value.length > 200) alerts.value.pop();
  }

  async function fetchAlerts(params = {}) {
    loading.value = true;
    try {
      const { data } = await apiClient.get('/alerts', { params });
      alerts.value = data.data;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function resolveAlert(id) {
    try {
      const { data } = await apiClient.patch(`/alerts/${id}/resolve`);
      const idx = alerts.value.findIndex(a => a._id === id);
      if (idx !== -1) alerts.value[idx] = data.data;
    } catch (e) { error.value = e.message; }
  }

  return {
    alerts, loading, error,
    unresolvedAlerts, criticalAlerts, warningAlerts, unresolvedCount,
    addAlert, fetchAlerts, resolveAlert,
  };
});
