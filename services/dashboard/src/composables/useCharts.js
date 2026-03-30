import { computed } from 'vue';

const STATUS_COLORS = {
  normal:   '#10B981',
  warning:  '#FFB800',
  critical: '#FF3B3B',
  accent:   '#00D4FF',
};

const BASE_CHART = {
  backgroundColor: 'transparent',
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#111827',
    borderColor: '#1E2D40',
    textStyle: { color: '#E2E8F0', fontFamily: 'JetBrains Mono' },
  },
};

export function useTimeSeriesChart(series, unit = '', status = 'normal') {
  const color = STATUS_COLORS[status] || STATUS_COLORS.accent;

  const option = computed(() => ({
    ...BASE_CHART,
    xAxis: {
      type: 'time',
      axisLine:  { lineStyle: { color: '#1E2D40' } },
      axisLabel: { color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1E2D40', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 10,
                   formatter: (v) => `${v}${unit}` },
      splitLine: { lineStyle: { color: '#1E2D40', type: 'dashed' } },
    },
    series: [{
      type: 'line',
      data: series.value,
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 2 },
      areaStyle: { color: `${color}18` },
    }],
  }));

  return { option };
}

export function useGaugeChart(value, min = 0, max = 100, unit = '', status = 'normal') {
  const color = STATUS_COLORS[status] || STATUS_COLORS.accent;

  const option = computed(() => ({
    ...BASE_CHART,
    series: [{
      type: 'gauge',
      min, max,
      progress: { show: true, width: 10, itemStyle: { color } },
      axisLine: { lineStyle: { width: 10, color: [[1, '#1E2D40']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' },
      pointer: { itemStyle: { color } },
      detail: {
        valueAnimation: true,
        formatter: `{value}${unit}`,
        color: '#E2E8F0',
        fontSize: 20,
        fontFamily: 'JetBrains Mono',
        fontWeight: 'bold',
      },
      data: [{ value: value.value ?? 0 }],
    }],
  }));

  return { option };
}

export function useHeatmapChart(data, xLabels, yLabels) {
  const option = computed(() => ({
    ...BASE_CHART,
    xAxis: { type: 'category', data: xLabels.value,
             axisLabel: { color: '#64748B', fontSize: 10 } },
    yAxis: { type: 'category', data: yLabels.value,
             axisLabel: { color: '#64748B', fontSize: 10 } },
    visualMap: {
      min: 0, max: 100, calculable: true, orient: 'horizontal',
      left: 'center', bottom: '5%',
      inRange: { color: ['#064E3B', '#10B981', '#FFB800', '#FF3B3B'] },
      textStyle: { color: '#64748B' },
    },
    series: [{
      type: 'heatmap',
      data: data.value,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
  }));

  return { option };
}
