/**
 * 学情风险预警计算工具
 *
 * 全站共享的风险计算与作业逾期口径，避免各页面各算一套。
 * 纯函数，仅依赖类型与日期工具。
 */

import dayjs from 'dayjs'
import type { Student } from '@/types/student'
import type { Homework, HomeworkSubmission } from '@/types/homework'
import type { CommunicationRecord } from '@/types/communication'
import type {
  RiskLevel,
  RiskThresholds,
  RiskDimension,
  RiskDimensions,
  RiskResult,
  GroupThresholds,
  ThresholdSource
} from '@/types/risk'

// 默认阈值配置
export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  overdueCount: 3, // 逾期未交 >= 3 次为高风险
  inactiveDays: 7, // 连续 7 天无学习动态为高风险
  scoreLine: 60, // 平均分警戒线 60
  unresolvedCount: 2 // 未解决沟通 >= 2 条为高风险
}

// 风险等级中文标签
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险'
}

// 风险维度中文名称（沿用四个维度：作业、活跃度、成绩、沟通）
export const RISK_DIMENSION_LABELS: Record<keyof RiskDimensions, string> = {
  homework: '作业逾期',
  activity: '学习活跃度',
  score: '平均成绩',
  communication: '沟通跟进'
}

// 风险等级对应的 el-tag 类型
export const RISK_LEVEL_TAG_TYPES: Record<RiskLevel, 'danger' | 'warning' | 'success'> = {
  high: 'danger',
  medium: 'warning',
  low: 'success'
}

// 各风险等级的排序权重（用于综合风险分与列表排序）
const RISK_LEVEL_WEIGHT: Record<RiskLevel, number> = {
  high: 2,
  medium: 1,
  low: 0
}

/**
 * 全站统一的作业逾期口径：按参考时间判断是否过了截止时间。
 * 不依赖数据里写死的 status 字段。asOf 默认当前时间，用于历史周快照重算。
 */
export const isHomeworkOverdue = (
  homework: Pick<Homework, 'dueDate'>,
  asOf: dayjs.Dayjs = dayjs()
): boolean => {
  return dayjs(homework.dueDate).isBefore(asOf)
}

/**
 * 全站统一的作业状态计算：实时结合截止时间与提交/批改进度。
 * 覆盖数据中可能过期的 status 字段。
 */
export const resolveHomeworkStatus = (homework: Homework): Homework['status'] => {
  if (isHomeworkOverdue(homework) && homework.submittedCount < homework.totalCount) {
    return 'overdue'
  }
  if (homework.totalCount > 0 && homework.gradedCount === homework.totalCount) {
    return 'completed'
  }
  if (homework.submittedCount > 0) {
    return 'in_progress'
  }
  return 'pending'
}

/**
 * 统计某个学生的逾期未交次数：
 * 该学生被布置、且已过截止时间（相对 asOf）、且未提交的作业数量。
 */
export const countStudentOverdue = (
  studentId: string,
  homeworks: Homework[],
  submissions: HomeworkSubmission[],
  asOf: dayjs.Dayjs = dayjs()
): number => {
  return homeworks.reduce((count, homework) => {
    if (!homework.assignedStudents.includes(studentId)) return count
    if (!isHomeworkOverdue(homework, asOf)) return count

    const submission = submissions.find(
      s => s.homeworkId === homework.id && s.studentId === studentId
    )
    // 无提交记录或状态为未提交，均视为逾期未交
    if (!submission || submission.status === 'not_submitted') {
      return count + 1
    }
    return count
  }, 0)
}

/**
 * 统计某个学生连续无学习动态的天数（相对 asOf 距最后活跃时间）。
 */
export const getInactiveDays = (student: Student, asOf: dayjs.Dayjs = dayjs()): number => {
  const days = asOf.diff(dayjs(student.lastActiveDate), 'day')
  return days > 0 ? days : 0
}

/**
 * 统计某个学生未解决的沟通条数（相对 asOf，历史周只计入当时已存在的记录）。
 */
export const countUnresolvedCommunication = (
  studentId: string,
  communications: CommunicationRecord[],
  asOf: dayjs.Dayjs = dayjs()
): number => {
  return communications.filter(
    c =>
      c.studentId === studentId &&
      !c.isResolved &&
      dayjs(c.createdAt).isBefore(asOf)
  ).length
}

// 基于「计数类」阈值划分风险等级
const levelFromCount = (value: number, highThreshold: number): RiskLevel => {
  const mediumThreshold = Math.max(1, Math.ceil(highThreshold / 2))
  if (value >= highThreshold) return 'high'
  if (value >= mediumThreshold) return 'medium'
  return 'low'
}

// 基于平均分与警戒线的差距划分风险等级
const levelFromScore = (averageScore: number, scoreLine: number): RiskLevel => {
  const gap = scoreLine - averageScore
  if (gap >= 10) return 'high'
  if (gap > 0) return 'medium'
  return 'low'
}

export interface RiskComputeContext {
  homeworks: Homework[]
  submissions: HomeworkSubmission[]
  communications: CommunicationRecord[]
  thresholds: RiskThresholds // 全局阈值
  groupThresholds?: GroupThresholds // 按分组的阈值覆盖，未配置的分组回退全局
}

/**
 * 解析学生实际生效的阈值：所在分组已配置则用分组阈值，否则回退全局。
 */
export const resolveEffectiveThresholds = (
  group: string,
  globalThresholds: RiskThresholds,
  groupThresholds?: GroupThresholds
): { thresholds: RiskThresholds; source: ThresholdSource } => {
  const override = groupThresholds?.[group]
  if (override) {
    return { thresholds: override, source: 'group' }
  }
  return { thresholds: globalThresholds, source: 'global' }
}

/**
 * 计算单个学生的四维风险与综合风险等级。
 * 按该学生实际生效的阈值（分组覆盖或全局）计算。
 * asOf 默认当前时间；传入历史时间可用于风险趋势快照重算。
 */
export const computeStudentRisk = (
  student: Student,
  context: RiskComputeContext,
  asOf: dayjs.Dayjs = dayjs()
): RiskResult => {
  const { homeworks, submissions, communications } = context
  const { thresholds, source: thresholdSource } = resolveEffectiveThresholds(
    student.group,
    context.thresholds,
    context.groupThresholds
  )

  const overdue = countStudentOverdue(student.id, homeworks, submissions, asOf)
  const inactiveDays = getInactiveDays(student, asOf)
  const unresolved = countUnresolvedCommunication(student.id, communications, asOf)
  const scoreGap = Math.max(0, Math.round((thresholds.scoreLine - student.averageScore) * 10) / 10)

  const homework: RiskDimension = {
    level: levelFromCount(overdue, thresholds.overdueCount),
    value: overdue,
    label: `逾期未交 ${overdue} 次`
  }
  const activity: RiskDimension = {
    level: levelFromCount(inactiveDays, thresholds.inactiveDays),
    value: inactiveDays,
    label: `连续 ${inactiveDays} 天无学习动态`
  }
  const score: RiskDimension = {
    level: levelFromScore(student.averageScore, thresholds.scoreLine),
    value: scoreGap,
    label: scoreGap > 0 ? `平均分低于警戒线 ${scoreGap} 分` : '平均分达标'
  }
  const communication: RiskDimension = {
    level: levelFromCount(unresolved, thresholds.unresolvedCount),
    value: unresolved,
    label: `${unresolved} 条沟通未解决`
  }

  const dimensions: RiskDimensions = { homework, activity, score, communication }

  const dimensionList = [homework, activity, score, communication]
  const highCount = dimensionList.filter(d => d.level === 'high').length
  const mediumCount = dimensionList.filter(d => d.level === 'medium').length

  // 综合等级：任一维度高风险、或两个及以上维度中风险 -> 高；有中风险 -> 中；否则低
  let level: RiskLevel = 'low'
  if (highCount > 0 || mediumCount >= 2) {
    level = 'high'
  } else if (mediumCount > 0) {
    level = 'medium'
  }

  const riskScore = dimensionList.reduce((sum, d) => sum + RISK_LEVEL_WEIGHT[d.level], 0)

  const reasons = dimensionList
    .filter(d => d.level !== 'low')
    .map(d => d.label)

  return {
    level,
    score: riskScore,
    dimensions,
    reasons,
    thresholdSource,
    effectiveThresholds: thresholds
  }
}

/**
 * 生成阈值签名，用于判断阈值是否变化（含全局与分组阈值）。
 * 阈值一改，签名随之变化，据此让历史周快照失效并重算。
 */
export const getThresholdsSignature = (
  thresholds: RiskThresholds,
  groupThresholds?: GroupThresholds
): string => {
  const globalSig = [
    thresholds.overdueCount,
    thresholds.inactiveDays,
    thresholds.scoreLine,
    thresholds.unresolvedCount
  ].join('-')

  const groupSig = groupThresholds
    ? Object.keys(groupThresholds)
        .sort()
        .map(
          group =>
            `${group}:${groupThresholds[group].overdueCount}-${groupThresholds[group].inactiveDays}-${groupThresholds[group].scoreLine}-${groupThresholds[group].unresolvedCount}`
        )
        .join('|')
    : ''

  return `${globalSig}#${groupSig}`
}
