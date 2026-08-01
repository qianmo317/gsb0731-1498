/**
 * 图表逻辑组合式函数
 */

import { ref, onUnmounted, nextTick } from 'vue'
import echarts from '@/utils/echarts'
import type { EChartsOption } from '@/utils/echarts'

export interface UseChartOptions {
  theme?: string
  autoResize?: boolean
}

export function useChart(options: UseChartOptions = {}) {
  const { theme = 'light', autoResize = true } = options

  const chartRef = ref<HTMLElement>()
  const chartInstance = ref<echarts.ECharts>()
  let initPromise: Promise<echarts.ECharts | undefined> | null = null
  let resizeListenerAttached = false

  // 设置图表配置
  const setOption = async (option: EChartsOption, notMerge?: boolean, lazyUpdate?: boolean) => {
    // 如果图表实例不存在，先初始化
    if (!chartInstance.value) {
      await initChart()
    }

    if (!chartInstance.value) {
      console.error('图表实例不存在')
      return
    }

    // 使用 nextTick 确保在 Vue 渲染完成后再调用 setOption
    await nextTick()
    chartInstance.value.setOption(option, notMerge, lazyUpdate)
    // 避免初始化时容器尺寸未稳定导致画布为 0
    chartInstance.value.resize()
  }

  // 调整图表大小
  const resize = () => {
    chartInstance.value?.resize()
  }

  // 处理窗口大小变化
  const handleResize = () => {
    resize()
  }

  const attachResizeListener = () => {
    if (!autoResize || resizeListenerAttached) return
    window.addEventListener('resize', handleResize)
    resizeListenerAttached = true
  }

  const detachResizeListener = () => {
    if (!resizeListenerAttached) return
    window.removeEventListener('resize', handleResize)
    resizeListenerAttached = false
  }

  // 初始化图表
  const initChart = async () => {
    if (chartInstance.value) {
      attachResizeListener()
      return chartInstance.value
    }

    if (initPromise) return initPromise

    initPromise = (async () => {
      await nextTick()

      if (!chartRef.value) {
        console.error('图表容器不存在')
        return
      }

      chartInstance.value = echarts.init(chartRef.value, theme)
      attachResizeListener()
      return chartInstance.value
    })()

    try {
      return await initPromise
    } finally {
      initPromise = null
    }
  }

  // 显示加载动画
  const showLoading = () => {
    chartInstance.value?.showLoading()
  }

  // 隐藏加载动画
  const hideLoading = () => {
    chartInstance.value?.hideLoading()
  }

  // 清空图表
  const clear = () => {
    chartInstance.value?.clear()
  }

  // 销毁图表
  const dispose = () => {
    detachResizeListener()
    chartInstance.value?.dispose()
    chartInstance.value = undefined
  }

  // 获取图表实例
  const getInstance = () => {
    return chartInstance.value
  }

  // 组件卸载时销毁
  onUnmounted(() => {
    dispose()
  })

  return {
    chartRef,
    chartInstance,
    initChart,
    setOption,
    resize,
    showLoading,
    hideLoading,
    clear,
    dispose,
    getInstance
  }
}
