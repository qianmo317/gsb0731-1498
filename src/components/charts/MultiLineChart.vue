<template>
  <v-chart :option="chartOption" :style="{ height, width }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption
} from 'echarts/components'

type ECOption = ComposeOption<
  LineSeriesOption | TooltipComponentOption | GridComponentOption | LegendComponentOption
>

interface SeriesData {
  name: string
  data: number[]
  color: string
}

interface Props {
  xData: string[]
  series: SeriesData[]
  height?: string
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  width: '100%'
})

const chartOption = computed<ECOption>(() => {
  if (!props.xData || props.xData.length === 0) {
    return {}
  }

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: props.series.map(s => s.name),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: props.xData
      }
    ],
    yAxis: [
      {
        type: 'value',
        minInterval: 1
      }
    ],
    series: props.series.map(s => ({
      name: s.name,
      type: 'line',
      smooth: true,
      data: s.data,
      itemStyle: {
        color: s.color
      },
      lineStyle: {
        color: s.color,
        width: 2
      },
      symbol: 'circle',
      symbolSize: 6
    }))
  }
})
</script>
