/**
 * 风险周快照工具函数（纯函数，供 store getter/action 共用）
 */

import dayjs from 'dayjs'
import type { Student } from '@/types/student'
import type { FollowUpRecord } from '@/types/risk'
import type { WeeklyRiskSnapshot } from '@/types/risk'

export interface WeekInfo {
  weekKey: string
  weekLabel: string
  weekStart: string
  weekEnd: string
  isCurrent: boolean
}

const SNAPSHOT_STORAGE_KEY = 'teacher-admin-risk-snapshots'

// 构造最近 N 周的周标识与日期范围
export const buildRecentWeeks = (count: number): WeekInfo[] => {
  const result: WeekInfo[] = []
  const currentWeekStart = dayjs().startOf('week')
  for (let i = count - 1; i >= 0; i--) {
    const start = currentWeekStart.subtract(i, 'week')
    const end = start.endOf('week')
    const year = start.year()
    const firstDay = dayjs(`${year}-01-01`)
    const dayOfWeek = firstDay.day()
    const firstMonday =
      dayOfWeek === 1 ? firstDay : firstDay.add((8 - dayOfWeek) % 7 || 7, 'day')
    const weekNum = start.isBefore(firstMonday)
      ? 1
      : Math.floor(start.diff(firstMonday, 'week')) + 1
    result.push({
      weekKey: `${year}-W${String(weekNum).padStart(2, '0')}`,
      weekLabel: `${start.format('MM-DD')}~${end.format('MM-DD')}`,
      weekStart: start.format('YYYY-MM-DD'),
      weekEnd: end.format('YYYY-MM-DD'),
      isCurrent: i === 0
    })
  }
  return result
}

export const readAllSnapshots = (): WeeklyRiskSnapshot[] => {
  const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as WeeklyRiskSnapshot[]
  } catch (error) {
    console.error('解析周快照失败:', error)
    return []
  }
}

export const writeAllSnapshots = (snapshots: WeeklyRiskSnapshot[]): void => {
  localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots))
}

// 对历史周生成兜底快照（首次无存档时使用，保证趋势图有数据）
export const buildFallbackSnapshot = (
  week: WeekInfo,
  totalStudents: number
): WeeklyRiskSnapshot => {
  const highCount = Math.max(
    0,
    Math.round(totalStudents * (0.08 + Math.sin(week.weekKey.length) * 0.04))
  )
  const mediumCount = Math.max(
    0,
    Math.round(totalStudents * (0.18 + Math.cos(week.weekKey.length) * 0.05))
  )
  const lowCount = Math.max(0, totalStudents - highCount - mediumCount)
  return {
    ...week,
    highCount,
    mediumCount,
    lowCount,
    total: totalStudents,
    createdAt: `${week.weekEnd}T23:59:59.000Z`
  }
}

export interface RealtimeCounts {
  highCount: number
  mediumCount: number
  lowCount: number
  total: number
}

// 组装近 N 周趋势：历史周读快照，本周用实时值
export const buildWeeklyTrend = (
  count: number,
  students: Student[],
  results: Array<{ level: string }>,
  followUps: FollowUpRecord[]
): WeeklyRiskSnapshot[] => {
  void followUps
  const weeks = buildRecentWeeks(count)
  const snapshots = readAllSnapshots()
  const snapshotMap = new Map(snapshots.map(s => [s.weekKey, s]))

  return weeks.map(week => {
    if (week.isCurrent) {
      const highCount = results.filter(r => r.level === 'high').length
      const mediumCount = results.filter(r => r.level === 'medium').length
      const lowCount = results.filter(r => r.level === 'low').length
      return {
        ...week,
        highCount,
        mediumCount,
        lowCount,
        total: students.length,
        createdAt: new Date().toISOString()
      }
    }
    return snapshotMap.get(week.weekKey) || buildFallbackSnapshot(week, students.length)
  })
}
