<template>
  <div class="grid grid-cols-dashboard h-screen">
    <AppSidebar />

    <div class="flex flex-col overflow-hidden">
      <AppHeader />

      <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="font-mono text-lg font-semibold text-ink">Sensores</h1>
          <div class="flex items-center gap-3">
            <!-- Filtro por tipo -->
            <select
              v-model="filterType"
              class="bg-bg-card border border-border rounded px-3 py-1.5 text-sm font-mono text-ink-muted
                     focus:outline-none focus:border-accent"
            >
              <option value="">todos os tipos</option>
              <option value="temperature">temperatura</option>
              <option value="pressure">pressão</option>
              <option value="humidity">umidade</option>
              <option value="vibration">vibração</option>
            </select>
            <!-- Filtro por status -->
            <select
              v-model="filterStatus"
              class="bg-bg-card border border-border rounded px-3 py-1.5 text-sm font-mono text-ink-muted
                     focus:outline-none focus:border-accent"
            >
              <option value="">todos os status</option>
              <option value="normal">normal</option>
              <option value="warning">alerta</option>
              <option value="critical">crítico</option>
            </select>
          </div>
        </div>

        <SensorStatus :readings="sensorsStore.sensorList" />

        <SensorGrid
          :readings="filteredReadings"
          :loading="sensorsStore.loading"
        />

        <!-- Gráficos por tipo -->
        <section v-if="selectedSensor">
          <h2 class="metric-label mb-3">histórico — {{ selectedSensor }}</h2>
          <TimeSeriesChart
            :series="selectedSeries"
            :title="selectedSensor"
            :unit="selectedUnit"
            :status="selectedStatus"
          />
        </section>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSensorsStore } from '@/stores/sensors';
import { useSocket } from '@/composables/useSocket';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import SensorStatus from '@/components/sensors/SensorStatus.vue';
import SensorGrid from '@/components/sensors/SensorGrid.vue';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue';

const sensorsStore  = useSensorsStore();
const filterType    = ref('');
const filterStatus  = ref('');
const selectedSensor = ref('');

useSocket();

const filteredReadings = computed(() =>
  sensorsStore.sensorList.filter(r => {
    if (filterType.value   && r.type   !== filterType.value)   return false;
    if (filterStatus.value && r.status !== filterStatus.value) return false;
    return true;
  })
);

const selectedReading = computed(() =>
  selectedSensor.value ? sensorsStore.readings.get(selectedSensor.value) : null
);

const selectedUnit   = computed(() => selectedReading.value?.unit || '');
const selectedStatus = computed(() => selectedReading.value?.status || 'normal');

const selectedSeries = computed(() =>
  sensorsStore.history
    .filter(r => r.sensorId === selectedSensor.value)
    .slice(0, 100)
    .reverse()
    .map(r => [new Date(r.timestamp).getTime(), r.value])
);

onMounted(() => sensorsStore.fetchLatest());
</script>
