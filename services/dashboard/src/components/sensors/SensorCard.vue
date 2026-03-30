<template>
  <div :class="['sensor-card', `sensor-card--${reading.status}`]">
    <div :class="['absolute inset-0 pointer-events-none', gradientClass]" />

    <div class="relative z-10 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-mono text-ink-muted uppercase tracking-widest">
          {{ reading.sensorId }}
        </span>
        <span :class="['status-badge', `status-badge--${reading.status}`]">
          <span :class="['status-dot', `status-dot--${reading.status}`]" />
          {{ reading.status }}
        </span>
      </div>

      <div class="flex items-baseline gap-1">
        <span class="sensor-value">{{ formattedValue }}</span>
        <span class="sensor-unit">{{ reading.unit }}</span>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-border">
        <span class="text-2xs font-mono text-ink-dim uppercase">{{ reading.type }}</span>
        <span class="text-2xs font-mono text-ink-dim">{{ timeAgo }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const props = defineProps({
  reading: { type: Object, required: true },
});

const formattedValue = computed(() => props.reading.value.toFixed(1));
const timeAgo        = computed(() => dayjs(props.reading.timestamp).fromNow(true));
const gradientClass  = computed(() => ({
  'gradient-critical': props.reading.status === 'critical',
  'gradient-warning':  props.reading.status === 'warning',
  'gradient-accent':   props.reading.status === 'normal',
}));
</script>
