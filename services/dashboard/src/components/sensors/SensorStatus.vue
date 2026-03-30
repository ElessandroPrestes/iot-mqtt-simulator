<template>
  <div class="card p-4 flex items-center gap-4">
    <div class="flex flex-col gap-1 flex-1">
      <span class="metric-label">total</span>
      <span class="font-mono text-2xl font-bold text-ink">{{ total }}</span>
    </div>
    <div class="flex flex-col gap-1 flex-1">
      <span class="metric-label">críticos</span>
      <span class="font-mono text-2xl font-bold" :class="critical > 0 ? 'text-critical' : 'text-ink-muted'">
        {{ critical }}
      </span>
    </div>
    <div class="flex flex-col gap-1 flex-1">
      <span class="metric-label">alertas</span>
      <span class="font-mono text-2xl font-bold" :class="warning > 0 ? 'text-warning' : 'text-ink-muted'">
        {{ warning }}
      </span>
    </div>
    <div class="flex flex-col gap-1 flex-1">
      <span class="metric-label">normais</span>
      <span class="font-mono text-2xl font-bold text-normal">{{ normal }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  readings: { type: Array, default: () => [] },
});

const total    = computed(() => props.readings.length);
const critical = computed(() => props.readings.filter(r => r.status === 'critical').length);
const warning  = computed(() => props.readings.filter(r => r.status === 'warning').length);
const normal   = computed(() => props.readings.filter(r => r.status === 'normal').length);
</script>
