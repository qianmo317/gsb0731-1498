/**
 * 日期处理工具函数
 */

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 格式化日期
export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

// 格式化日期时间
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化时间
export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm:ss')
}

// 相对时间
export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow()
}

// 获取今天的日期
export const getToday = (): string => {
  return dayjs().format('YYYY-MM-DD')
}

// 获取本周的开始和结束日期
export const getThisWeek = (): [string, string] => {
  const start = dayjs().startOf('week').format('YYYY-MM-DD')
  const end = dayjs().endOf('week').format('YYYY-MM-DD')
  return [start, end]
}

// 获取本周一的日期（作为周快照的键）
export const getWeekStart = (): string => {
  return dayjs().startOf('week').format('YYYY-MM-DD')
}

// 获取本月的开始和结束日期
export const getThisMonth = (): [string, string] => {
  const start = dayjs().startOf('month').format('YYYY-MM-DD')
  const end = dayjs().endOf('month').format('YYYY-MM-DD')
  return [start, end]
}

// 获取最近N天的日期范围
export const getRecentDays = (days: number): [string, string] => {
  const end = dayjs().format('YYYY-MM-DD')
  const start = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')
  return [start, end]
}

// 计算两个日期之间的天数
export const getDaysBetween = (start: string | Date, end: string | Date): number => {
  return dayjs(end).diff(dayjs(start), 'day')
}

// 判断日期是否过期
export const isExpired = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs())
}

// 判断日期是否在今天
export const isToday = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day')
}

// 判断日期是否在本周
export const isThisWeek = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'week')
}

// 判断日期是否在本月
export const isThisMonth = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'month')
}

// 格式化时长（分钟转为小时分钟）
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}分钟`
  }

  if (mins === 0) {
    return `${hours}小时`
  }

  return `${hours}小时${mins}分钟`
}

// 获取星期几
export const getWeekday = (date: string | Date): string => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weekdays[dayjs(date).day()]
}
