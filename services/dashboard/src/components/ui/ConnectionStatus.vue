<template>
  <div class="flex items-center gap-2">
    <span :class="['status-dot', dotClass]" />
    <span class="text-xs font-mono text-ink-muted capitalize">{{ connStore.status }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useConnectionStore } from '@/stores/connection';

const connStore = useConnectionStore();

const dotClass = computed(() => ({
  'status-dot--connected':    connStore.status === 'connected',
  'status-dot--critical':     connStore.status === 'error',
  'status-dot--error':        connStore.status === 'disconnected',
}));
</script>
