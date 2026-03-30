<template>
  <div class="card flex flex-col h-full">
    <div class="flex items-center justify-between px-4 py-3 border-b border-border">
      <span class="metric-label">alertas ativos</span>
      <span
        v-if="alertsStore.unresolvedCount"
        class="status-badge status-badge--critical"
      >
        {{ alertsStore.unresolvedCount }}
      </span>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <template v-if="alertsStore.loading">
        <LoadingSkeleton v-for="n in 4" :key="n" class="h-14" />
      </template>
      <template v-else-if="alertsStore.unresolvedAlerts.length">
        <AlertItem
          v-for="alert in alertsStore.unresolvedAlerts"
          :key="alert._id"
          :alert="alert"
          :show-resolve="true"
          @resolve="alertsStore.resolveAlert($event)"
        />
      </template>
      <div v-else class="flex items-center justify-center h-20 text-sm text-ink-muted">
        Nenhum alerta ativo
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAlertsStore } from '@/stores/alerts';
import AlertItem from './AlertItem.vue';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue';

const alertsStore = useAlertsStore();

onMounted(() => alertsStore.fetchAlerts({ resolved: false, limit: 50 }));
</script>
