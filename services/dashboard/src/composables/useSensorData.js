import { ref, computed, watch } from 'vue';
import { apiClient } from '@/api/client';
import { useSensorsStore } from '@/stores/sensors';

export function useSensorData(sensorId) {
  const store   = useSensorsStore();
  const history = ref([]);
  const loading = ref(false);
  const error   = ref(null);

  const currentReading = computed(() =>
    sensorId ? store.readings.get(sensorId) : null
  );

  const chartSeries = computed(() =>
    history.value.map(r => [new Date(r.timestamp).getTime(), r.value])
  );

  async function fetchHistory(limit = 100) {
    if (!sensorId) return;
    loading.value = true;
    try {
      const { data } = await apiClient.get(`/sensors/${sensorId}`, { params: { limit } });
      history.value = data.data.reverse(); // mais antigo → mais recente
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  // Mantém o histórico local atualizado com novos readings via store
  watch(
    () => store.readings.get(sensorId),
    (reading) => {
      if (reading) {
        history.value.push(reading);
        if (history.value.length > 500) history.value.shift();
      }
    }
  );

  return { currentReading, history, chartSeries, loading, error, fetchHistory };
}
