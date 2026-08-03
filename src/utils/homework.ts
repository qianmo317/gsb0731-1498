/**
 * 作业状态统一计算工具
 * 全站作业状态一律按"当前时间是否超过截止时间 + 提交/批改情况"实时判定，
 * 不依赖数据里写死的 status 字段。
 */

import dayjs from 'dayjs'
import type { Homework, HomeworkStatus, HomeworkSubmission } from '@/types/homework'

/**
 * 判断作业是否已过截止时间（统一口径）
 */
export const isHomeworkPastDue = (
  homework: Homework,
  now: dayjs.Dayjs = dayjs()
): boolean => {
  return dayjs(homework.dueDate).isBefore(now)
}

/**
 * 按当前时间实时计算作业状态：
 * - 已过截止时间且未全部提交：overdue
 * - 全部已批改：completed
 * - 已有提交（但未全部批改）：in_progress
 * - 其余（未到截止时间且无提交）：pending
 */
export const getHomeworkStatus = (
  homework: Homework,
  now: dayjs.Dayjs = dayjs()
): HomeworkStatus => {
  const pastDue = isHomeworkPastDue(homework, now)
  const allSubmitted = homework.submittedCount >= homework.totalCount
  const allGraded = homework.gradedCount >= homework.totalCount && homework.totalCount > 0

  if (allGraded) return 'completed'
  if (pastDue && !allSubmitted) return 'overdue'
  if (homework.submittedCount > 0 || homework.gradedCount > 0) return 'in_progress'
  return 'pending'
}

/**
 * 判断作业在当前时刻是否逾期（对外统一口径）
 */
export const isHomeworkOverdue = (
  homework: Homework,
  now: dayjs.Dayjs = dayjs()
): boolean => {
  return getHomeworkStatus(homework, now) === 'overdue'
}

/**
 * 批量统计逾期作业数（按实时状态）
 */
export const countOverdueHomeworks = (
  homeworks: Homework[],
  now: dayjs.Dayjs = dayjs()
): number => {
  return homeworks.filter(h => isHomeworkOverdue(h, now)).length
}

/**
 * 判断某学生的某条提交是否逾期：
 * 未提交/未批改且作业已过截止时间视为逾期；已提交或已批改不算逾期。
 */
export const isSubmissionOverdue = (
  homework: Homework,
  submission: HomeworkSubmission,
  now: dayjs.Dayjs = dayjs()
): boolean => {
  if (submission.status === 'submitted' || submission.status === 'graded') return false
  return isHomeworkPastDue(homework, now)
}

/**
 * 给批量作业附加实时状态（返回新数组，不修改原数据）
 */
export const withRealtimeStatus = (
  homeworks: Homework[],
  now: dayjs.Dayjs = dayjs()
): Homework[] => {
  return homeworks.map(h => ({ ...h, status: getHomeworkStatus(h, now) }))
}
