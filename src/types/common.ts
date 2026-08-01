/**
 * 通用类型定义
 */

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// API 响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 排序参数
export interface SortParams {
  prop: string
  order: 'ascending' | 'descending' | null
}

// 时间范围
export interface DateRange {
  startDate: string
  endDate: string
}

// 选项类型
export interface Option {
  label: string
  value: string | number
}

// 统计卡片数据
export interface StatCard {
  title: string
  value: number | string
  icon: string
  color: string
  trend?: {
    value: number
    isUp: boolean
  }
}

// 图表数据点
export interface ChartDataPoint {
  name: string
  value: number
}

// 时间序列数据
export interface TimeSeriesData {
  date: string
  value: number
}
