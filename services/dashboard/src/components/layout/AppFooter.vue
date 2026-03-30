<template>
  <footer class="h-8 bg-bg-card border-t border-border flex items-center px-6 gap-4">
    <span class="text-2xs font-mono text-ink-dim">
      IoT Sensor Dashboard
    </span>
    <div class="flex-1" />
    <span class="text-2xs font-mono text-ink-dim">
      {{ now }}
    </span>
  </footer>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';

const now = ref(dayjs().format('HH:mm:ss'));
let timer;

onMounted(() => {
  timer = setInterval(() => { now.value = dayjs().format('HH:mm:ss'); }, 1000);
});
onUnmounted(() => clearInterval(timer));
</script>
