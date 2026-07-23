import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@/api/client';

export const useSensorsStore = defineStore('sensors', () => {
  const readings  = ref(new Map()); // Map<sensorId, lastReading>
  const history   = ref([]);
  const stats     = ref([]);
  const loading   = ref(false);
  const error     = ref(null);

  const sensorList      = computed(() => Array.from(readings.value.values()));
  const criticalSensors = computed(() => sensorList.value.filter(r => r.status === 'critical'));
  const warningSensors  = computed(() => sensorList.value.filter(r => r.status === 'warning'));

  function updateReading(reading) {
    readings.value.set(reading.sensorId, reading);
    history.value.unshift(reading);
    if (history.value.length > 500) history.value.pop();
  }

  async function fetchLatest() {
    loading.value = true;
    try {
      const response = await apiClient.get('/readings/latest');
      // O interceptor do client.js já retorna response.data (envelope completo).
      // response.data é o array de leituras — não usar .data.data.
      response.data.forEach(r => readings.value.set(r.sensorId, r));
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats(since = 3600000) {
    try {
      const response = await apiClient.get('/readings/stats', { params: { since } });
      stats.value = response.data;
    } catch (e) { error.value = e.message; }
  }

  return {
    readings, history, stats, loading, error,
    sensorList, criticalSensors, warningSensors,
    updateReading, fetchLatest, fetchStats,
  };
});
