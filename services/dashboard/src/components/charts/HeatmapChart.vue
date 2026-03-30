<template>
  <div class="card p-4 flex flex-col gap-3">
    <span class="metric-label">{{ title }}</span>
    <v-chart class="h-56" :option="option" autoresize />
  </div>
</template>

<script setup>
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { HeatmapChart as EHeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { useHeatmapChart } from '@/composables/useCharts';

use([CanvasRenderer, EHeatmapChart, GridComponent, TooltipComponent, VisualMapComponent]);

const props = defineProps({
  data:    { type: Object, required: true },
  xLabels: { type: Object, required: true },
  yLabels: { type: Object, required: true },
  title:   { type: String, default: '' },
});

const { option } = useHeatmapChart(props.data, props.xLabels, props.yLabels);
</script>
