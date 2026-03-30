<template>
  <div class="card p-4 flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="metric-label">{{ title }}</span>
      <span :class="['status-badge', `status-badge--${status}`]">{{ status }}</span>
    </div>
    <v-chart class="h-48" :option="option" autoresize />
  </div>
</template>

<script setup>
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { useTimeSeriesChart } from '@/composables/useCharts';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent]);

const props = defineProps({
  series: { type: Object, required: true },
  title:  { type: String, default: '' },
  unit:   { type: String, default: '' },
  status: { type: String, default: 'normal' },
});

const { option } = useTimeSeriesChart(props.series, props.unit, props.status);
</script>
