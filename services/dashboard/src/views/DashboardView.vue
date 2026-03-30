<template>
  <div class="grid grid-cols-dashboard h-screen">
    <AppSidebar />

    <div class="flex flex-col overflow-hidden">
      <AppHeader />

      <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Status geral -->
        <SensorStatus :readings="sensorsStore.sensorList" />

        <!-- Grid de sensores -->
        <section>
          <h2 class="metric-label mb-3">leituras em tempo real</h2>
          <SensorGrid
            :readings="sensorsStore.sensorList"
            :loading="sensorsStore.loading"
          />
        </section>

        <!-- Linha: gráficos + alertas -->
        <div class="grid grid-cols-charts gap-6">
          <section class="col-span-2">
            <h2 class="metric-label mb-3">histórico — temperatura</h2>
            <TimeSeriesChart
              :series="tempSeries"
              title="Temperatura"
              unit="°C"
              :status="tempStatus"
            />
          </section>

          <section>
            <h2 class="metric-label mb-3">alertas ativos</h2>
            <AlertPanel />
          </section>
        </div>

        <!-- Métricas rápidas -->
        <div class="grid grid-cols-4 gap-4">
          <MetricBadge label="mensagens/min" :value="msgsPerMin" variant="accent" />
          <MetricBadge
            label="críticos"
            :value="sensorsStore.criticalSensors.length"
            :variant="sensorsStore.criticalSensors.length > 0 ? 'critical' : 'default'"
          />
          <MetricBadge
            label="alertas pendentes"
            :value="alertsStore.unresolvedCount"
            :variant="alertsStore.unresolvedCount > 0 ? 'warning' : 'default'"
          />
          <MetricBadge label="sensores" :value="sensorsStore.sensorList.length" variant="normal" />
        </div>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSensorsStore } from '@/stores/sensors';
import { useAlertsStore } from '@/stores/alerts';
import { useSocket } from '@/composables/useSocket';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import SensorStatus from '@/components/sensors/SensorStatus.vue';
import SensorGrid from '@/components/sensors/SensorGrid.vue';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue';
import AlertPanel from '@/components/alerts/AlertPanel.vue';
import MetricBadge from '@/components/ui/MetricBadge.vue';

const sensorsStore = useSensorsStore();
const alertsStore  = useAlertsStore();

useSocket();

const msgsPerMin = ref(0);

const tempReadings = computed(() =>
  sensorsStore.history
    .filter(r => r.type === 'temperature')
    .slice(0, 60)
    .reverse()
);

const tempSeries = computed(() =>
  tempReadings.value.map(r => [new Date(r.timestamp).getTime(), r.value])
);

const tempStatus = computed(() => {
  const latest = sensorsStore.sensorList.find(r => r.type === 'temperature');
  return latest?.status || 'normal';
});

onMounted(async () => {
  await sensorsStore.fetchLatest();
  await alertsStore.fetchAlerts({ resolved: false, limit: 50 });

  // Conta mensagens por minuto
  const startCount = sensorsStore.history.length;
  setTimeout(() => {
    msgsPerMin.value = (sensorsStore.history.length - startCount) * 2;
  }, 30_000);
});
</script>
