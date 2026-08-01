<template>
  <v-chart :option="chartOption" :style="{ height, width }" autoresize />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption, GridComponentOption } from 'echarts/components'

type ECOption = ComposeOption<BarSeriesOption | TooltipComponentOption | GridComponentOption>

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
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
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
        type: 'bar',
        data: props.data.map(item => item.value),
        itemStyle: {
          color: props.color,
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '60%'
      }
    ]
  }
})
</script>
