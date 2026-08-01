/**
 * ECharts 配置和导出
 * 统一管理 ECharts 的组件注册和类型导出
 */

import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'

// 注册必要的组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

// 导出类型
export type { EChartsOption } from 'echarts'
