<template>
  <div :class="['alert-item', `alert-item--${alert.level}`]">
    <div :class="['flex-shrink-0 w-8 h-8 rounded flex items-center justify-center',
                  alert.level === 'critical' ? 'bg-critical-muted' : 'bg-warning-muted']">
      <svg :class="['w-4 h-4', alert.level === 'critical' ? 'text-critical' : 'text-warning']"
           fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>

    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-ink truncate">{{ alert.message }}</p>
      <div class="flex items-center gap-2 mt-0.5">
        <span class="text-2xs font-mono text-ink-muted">{{ alert.sensorId }}</span>
        <span class="text-2xs text-ink-dim">·</span>
        <span class="text-2xs font-mono text-ink-dim">{{ timeAgo }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-shrink-0">
      <span :class="['status-badge', `status-badge--${alert.level}`]">{{ alert.level }}</span>
      <button
        v-if="!alert.resolved && showResolve"
        class="btn-ghost text-2xs px-2 py-1"
        @click="$emit('resolve', alert._id)"
      >
        resolver
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

defineEmits(['resolve']);
const props = defineProps({
  alert:       { type: Object,  required: true },
  showResolve: { type: Boolean, default: false },
});

const timeAgo = computed(() => dayjs(props.alert.timestamp).fromNow(true));
</script>
