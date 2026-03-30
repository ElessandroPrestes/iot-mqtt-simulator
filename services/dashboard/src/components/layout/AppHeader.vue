<template>
  <header class="h-16 bg-bg-card border-b border-border flex items-center px-6 gap-4 sticky top-0 z-50">
    <div class="flex items-center gap-2.5">
      <div class="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center">
        <svg class="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
        </svg>
      </div>
      <span class="font-mono text-sm font-semibold text-ink tracking-tight">
        IoT<span class="text-accent">.dashboard</span>
      </span>
    </div>

    <div class="flex-1" />

    <div class="hidden md:flex items-center gap-6">
      <div class="metric-row gap-3">
        <span class="metric-label">sensores</span>
        <span class="metric-value text-accent">{{ sensorsStore.sensorList.length }}</span>
      </div>
      <div class="metric-row gap-3">
        <span class="metric-label">alertas</span>
        <span :class="['metric-value', alertsStore.unresolvedCount > 0 ? 'text-critical' : 'text-ink-muted']">
          {{ alertsStore.unresolvedCount }}
        </span>
      </div>
    </div>

    <div class="w-px h-6 bg-border" />
    <ConnectionStatus />
  </header>
</template>

<script setup>
import { useSensorsStore } from '@/stores/sensors';
import { useAlertsStore } from '@/stores/alerts';
import ConnectionStatus from '@/components/ui/ConnectionStatus.vue';

const sensorsStore = useSensorsStore();
const alertsStore  = useAlertsStore();
</script>
