<template>
  <div class="card p-3 flex flex-col gap-1">
    <span class="metric-label">{{ label }}</span>
    <div class="flex items-baseline gap-1">
      <span class="font-mono text-2xl font-bold" :class="valueClass">{{ value }}</span>
      <span v-if="unit" class="font-mono text-xs text-ink-muted">{{ unit }}</span>
    </div>
    <span v-if="sub" class="text-2xs text-ink-dim font-mono">{{ sub }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label:   { type: String, required: true },
  value:   { type: [String, Number], required: true },
  unit:    { type: String, default: '' },
  sub:     { type: String, default: '' },
  variant: { type: String, default: 'default' },
});

const valueClass = computed(() => ({
  'text-critical': props.variant === 'critical',
  'text-warning':  props.variant === 'warning',
  'text-normal':   props.variant === 'normal',
  'text-accent':   props.variant === 'accent',
  'text-ink':      props.variant === 'default',
}));
</script>
