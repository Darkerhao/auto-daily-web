<template>
  <div ref="chartRef" class="token-chart glass-panel section-card"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { init, use, graphic, type ComposeOption, type ECharts } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { LineSeriesOption } from 'echarts/charts'
import type { TokenTrendPoint } from '@/types/dashboard'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

type ECOption = ComposeOption<GridComponentOption | TooltipComponentOption | LineSeriesOption>

const props = defineProps<{
  data: TokenTrendPoint[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function renderChart() {
  if (!chartRef.value) {
    return
  }

  chart ??= init(chartRef.value)
  const option: ECOption = {
    grid: {
      left: 12,
      right: 12,
      top: 20,
      bottom: 12,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: props.data.map((item) => item.date),
      axisLine: { lineStyle: { color: 'rgba(151, 196, 255, 0.18)' } },
      axisLabel: { color: 'rgba(190, 201, 230, 0.56)' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(151, 196, 255, 0.08)' } },
      axisLabel: { color: 'rgba(190, 201, 230, 0.56)' },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: props.data.map((item) => item.value),
        lineStyle: { color: '#7aa2ff', width: 3 },
        symbolSize: 8,
        itemStyle: { color: '#7af0d1' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(122, 162, 255, 0.35)' },
            { offset: 1, color: 'rgba(122, 162, 255, 0.02)' },
          ]),
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(7, 12, 24, 0.92)',
      borderColor: 'rgba(122, 162, 255, 0.2)',
      textStyle: { color: '#f4f7ff' },
    },
  }

  chart.setOption(option)
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })

onMounted(() => {
  if (!chartRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(() => {
    chart?.resize()
  })
  resizeObserver.observe(chartRef.value)
  window.addEventListener('resize', handleWindowResize)
})

function handleWindowResize() {
  chart?.resize()
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', handleWindowResize)
  chart?.dispose()
})
</script>

<style scoped lang="less">
.token-chart {
  min-height: 320px;
}
</style>
