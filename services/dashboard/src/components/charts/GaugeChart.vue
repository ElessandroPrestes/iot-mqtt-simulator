<template>
  <div class="card p-4 flex flex-col gap-3">
    <span class="metric-label text-center">{{ title }}</span>
    <v-chart class="h-40" :option="option" autoresize />
  </div>
</template>

<script setup>
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GaugeChart as EGaugeChart } from 'echarts/charts';
import VChart from 'vue-echarts';
import { useGaugeChart } from '@/composables/useCharts';
import { toRef } from 'vue';

use([CanvasRenderer, EGaugeChart]);

const props = defineProps({
  value:  { type: Object, required: true },
  title:  { type: String, default: '' },
  min:    { type: Number, default: 0 },
  max:    { type: Number, default: 100 },
  unit:   { type: String, default: '' },
  status: { type: String, default: 'normal' },
});

const { option } = useGaugeChart(props.value, props.min, props.max, props.unit, props.status);
</script>
