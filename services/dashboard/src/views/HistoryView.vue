<template>
  <div class="grid grid-cols-dashboard h-screen">
    <AppSidebar />

    <div class="flex flex-col overflow-hidden">
      <AppHeader />

      <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="font-mono text-lg font-semibold text-ink">Histórico</h1>
          <div class="flex items-center gap-3">
            <select
              v-model="selectedType"
              class="bg-bg-card border border-border rounded px-3 py-1.5 text-sm font-mono text-ink-muted
                     focus:outline-none focus:border-accent"
            >
              <option value="temperature">temperatura (°C)</option>
              <option value="pressure">pressão (bar)</option>
              <option value="humidity">umidade (%)</option>
              <option value="vibration">vibração (mm/s)</option>
            </select>
            <select
              v-model="timeRange"
              class="bg-bg-card border border-border rounded px-3 py-1.5 text-sm font-mono text-ink-muted
                     focus:outline-none focus:border-accent"
            >
              <option :value="3600000">última hora</option>
              <option :value="21600000">últimas 6h</option>
              <option :value="86400000">último dia</option>
            </select>
          </div>
        </div>

        <!-- Gráfico de série temporal -->
        <TimeSeriesChart
          :series="historySeries"
          :title="selectedType"
          :unit="unitMap[selectedType]"
          :status="latestStatus"
        />

        <!-- Estatísticas do período -->
        <div v-if="stats" class="grid grid-cols-4 gap-4">
          <MetricBadge label="média" :value="stats.avg?.toFixed(2)" :unit="unitMap[selectedType]" variant="accent" />
          <MetricBadge label="máximo" :value="stats.max?.toFixed(2)" :unit="unitMap[selectedType]"
            :variant="stats.maxStatus || 'default'" />
          <MetricBadge label="mínimo" :value="stats.min?.toFixed(2)" :unit="unitMap[selectedType]" variant="normal" />
          <MetricBadge label="anomalias" :value="stats.anomalies || 0"
            :variant="stats.anomalies > 0 ? 'warning' : 'default'" />
        </div>

        <!-- Heatmap de intensidade por sensor -->
        <section>
          <h2 class="metric-label mb-3">intensidade por sensor</h2>
          <HeatmapChart
            :data="heatmapData"
            :x-labels="heatmapXLabels"
            :y-labels="heatmapYLabels"
            title="intensidade"
          />
        </section>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useSensorsStore } from '@/stores/sensors';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue';
import HeatmapChart from '@/components/charts/HeatmapChart.vue';
import MetricBadge from '@/components/ui/MetricBadge.vue';

const sensorsStore = useSensorsStore();
const selectedType = ref('temperature');
const timeRange    = ref(3600000);

const unitMap = {
  temperature: '°C',
  pressure:    'bar',
  humidity:    '%',
  vibration:   'mm/s',
};

const historySeries = computed(() => {
  const since = Date.now() - timeRange.value;
  return sensorsStore.history
    .filter(r => r.type === selectedType.value && new Date(r.timestamp).getTime() >= since)
    .slice(0, 500)
    .reverse()
    .map(r => [new Date(r.timestamp).getTime(), r.value]);
});

const latestStatus = computed(() => {
  const latest = sensorsStore.sensorList.find(r => r.type === selectedType.value);
  return latest?.status || 'normal';
});

const stats = computed(() => {
  const data = sensorsStore.stats.find(
    s => s._id?.type === selectedType.value
  );
  return data || null;
});

const heatmapXLabels = computed(() =>
  [...new Set(sensorsStore.history.map(r => r.type))]
);
const heatmapYLabels = computed(() =>
  [...new Set(sensorsStore.sensorList.map(r => r.sensorId))].slice(0, 10)
);
const heatmapData = computed(() =>
  heatmapYLabels.value.flatMap((sid, yi) =>
    heatmapXLabels.value.map((type, xi) => {
      const r = sensorsStore.sensorList.find(s => s.sensorId === sid && s.type === type);
      return [xi, yi, r ? Math.round(r.value) : 0];
    })
  )
);

onMounted(async () => {
  await sensorsStore.fetchLatest();
  await sensorsStore.fetchStats(timeRange.value);
});

watch(timeRange, () => sensorsStore.fetchStats(timeRange.value));
</script>
