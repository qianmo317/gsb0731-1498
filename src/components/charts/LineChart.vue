<template>
  <v-chart :option="chartOption" :style="{ height, width }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption, GridComponentOption } from 'echarts/components'

type ECOption = ComposeOption<LineSeriesOption | TooltipComponentOption | GridComponentOption>

interface Props {
  data: Array<{ name: string; value: number }>
  height?: string
  width?: string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  width: '100%',
  color: '#4a90e2'
})

const chartOption = computed<ECOption>(() => {
  if (!props.data || props.data.length === 0) {
    return {}
  }

  return {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: props.data.map(item => item.name)
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        type: 'line',
        smooth: true,
        data: props.data.map(item => item.value),
        itemStyle: {
          color: props.color
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: props.color + '40' },
              { offset: 1, color: props.color + '00' }
            ]
          }
        }
      }
    ]
  }
})
</script>
