<template>
  <div class="grid grid-cols-dashboard h-screen">
    <AppSidebar />

    <div class="flex flex-col overflow-hidden">
      <AppHeader />

      <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="font-mono text-lg font-semibold text-ink">Alertas</h1>
          <div class="flex items-center gap-3">
            <select
              v-model="filterLevel"
              class="bg-bg-card border border-border rounded px-3 py-1.5 text-sm font-mono text-ink-muted
                     focus:outline-none focus:border-accent"
            >
              <option value="">todos os níveis</option>
              <option value="warning">alerta</option>
              <option value="critical">crítico</option>
            </select>
            <select
              v-model="filterResolved"
              class="bg-bg-card border border-border rounded px-3 py-1.5 text-sm font-mono text-ink-muted
                     focus:outline-none focus:border-accent"
            >
              <option value="">todos</option>
              <option value="false">pendentes</option>
              <option value="true">resolvidos</option>
            </select>
          </div>
        </div>

        <!-- Resumo -->
        <div class="grid grid-cols-4 gap-4">
          <MetricBadge label="total" :value="alertsStore.alerts.length" variant="default" />
          <MetricBadge label="pendentes" :value="alertsStore.unresolvedCount"
            :variant="alertsStore.unresolvedCount > 0 ? 'warning' : 'default'" />
          <MetricBadge label="críticos" :value="alertsStore.criticalAlerts.length"
            :variant="alertsStore.criticalAlerts.length > 0 ? 'critical' : 'default'" />
          <MetricBadge label="alertas" :value="alertsStore.warningAlerts.length"
            :variant="alertsStore.warningAlerts.length > 0 ? 'warning' : 'default'" />
        </div>

        <!-- Lista de alertas -->
        <div class="card divide-y divide-border">
          <template v-if="alertsStore.loading">
            <LoadingSkeleton v-for="n in 5" :key="n" class="h-16 m-3" />
          </template>
          <template v-else-if="filteredAlerts.length">
            <div class="p-2 space-y-1">
              <AlertItem
                v-for="alert in filteredAlerts"
                :key="alert._id"
                :alert="alert"
                :show-resolve="!alert.resolved"
                @resolve="alertsStore.resolveAlert($event)"
              />
            </div>
          </template>
          <div v-else class="p-8 text-center text-sm text-ink-muted">
            Nenhum alerta encontrado
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAlertsStore } from '@/stores/alerts';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import AlertItem from '@/components/alerts/AlertItem.vue';
import MetricBadge from '@/components/ui/MetricBadge.vue';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue';

const alertsStore   = useAlertsStore();
const filterLevel    = ref('');
const filterResolved = ref('');

const filteredAlerts = computed(() =>
  alertsStore.alerts.filter(a => {
    if (filterLevel.value && a.level !== filterLevel.value) return false;
    if (filterResolved.value !== '') {
      const resolved = filterResolved.value === 'true';
      if (a.resolved !== resolved) return false;
    }
    return true;
  })
);

onMounted(() => alertsStore.fetchAlerts({ limit: 200 }));
</script>
