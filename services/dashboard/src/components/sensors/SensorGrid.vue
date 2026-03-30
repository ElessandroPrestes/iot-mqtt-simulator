<template>
  <div class="grid grid-cols-sensors gap-4">
    <template v-if="loading">
      <LoadingSkeleton v-for="n in skeletonCount" :key="n" class="h-32" />
    </template>
    <template v-else-if="readings.length">
      <SensorCard
        v-for="reading in readings"
        :key="reading.sensorId"
        :reading="reading"
      />
    </template>
    <div v-else class="col-span-full flex items-center justify-center h-32 text-ink-muted text-sm">
      Nenhum sensor conectado
    </div>
  </div>
</template>

<script setup>
import SensorCard from './SensorCard.vue';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton.vue';

defineProps({
  readings:      { type: Array,   default: () => [] },
  loading:       { type: Boolean, default: false },
  skeletonCount: { type: Number,  default: 8 },
});
</script>
