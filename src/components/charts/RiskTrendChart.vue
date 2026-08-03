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
import { RISK_LEVEL_LABELS } from '@/utils/risk'
import type { RiskTrendPoint } from '@/types/risk'

type ECOption = ComposeOption<
  LineSeriesOption | TooltipComponentOption | GridComponentOption | LegendComponentOption
>

interface Props {
  data: RiskTrendPoint[]
  height?: string
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  width: '100%'
})

// 各等级颜色，与首页风险卡片保持一致
const LEVEL_COLORS = {
  high: '#ff4d4f',
  medium: '#faad14',
  low: '#52c41a'
}

const chartOption = computed<ECOption>(() => {
  if (!props.data || props.data.length === 0) {
    return {}
  }

  const weeks = props.data.map(item => (item.isCurrent ? `${item.week}(本周)` : item.week))

  const buildSeries = (
    key: 'high' | 'medium' | 'low'
  ): LineSeriesOption => ({
    name: RISK_LEVEL_LABELS[key],
    type: 'line',
    smooth: true,
    data: props.data.map(item => item[key]),
    itemStyle: { color: LEVEL_COLORS[key] },
    lineStyle: { color: LEVEL_COLORS[key] }
  })

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: [RISK_LEVEL_LABELS.high, RISK_LEVEL_LABELS.medium, RISK_LEVEL_LABELS.low]
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: weeks
      }
    ],
    yAxis: [
      {
        type: 'value',
        minInterval: 1
      }
    ],
    series: [buildSeries('high'), buildSeries('medium'), buildSeries('low')]
  }
})
</script>
