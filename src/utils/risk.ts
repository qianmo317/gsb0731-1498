/**
 * 风险评估核心逻辑
 * 基于作业、活跃度、成绩、沟通四个维度实时计算学生风险等级
 */

import dayjs from 'dayjs'
import type { Student } from '@/types/student'
import type { Homework, HomeworkSubmission } from '@/types/homework'
import type { CommunicationRecord } from '@/types/communication'
import type {
  RiskLevel,
  RiskThresholdConfig,
  StudentRiskResult,
  RiskDimensionDetail,
  RiskOverview,
  RiskLevelMeta,
  FollowUpRecord,
  GroupThresholdMap,
  GroupThresholdOverride
} from '@/types/risk'
import { isSubmissionOverdue as isSubmissionOverdueByDueDate } from './homework'

/**
 * 将分组覆盖配置合并到全局阈值上，深拷贝合并嵌套字段
 */
export const mergeGroupThreshold = (
  global: RiskThresholdConfig,
  override: GroupThresholdOverride | undefined
): RiskThresholdConfig => {
  if (!override) return { ...global }
  return {
    overdueHomework: { ...global.overdueHomework, ...(override.overdueHomework || {}) },
    inactivity: { ...global.inactivity, ...(override.inactivity || {}) },
    scoreWarning: { ...global.scoreWarning, ...(override.scoreWarning || {}) },
    unresolvedCommunication: {
      ...global.unresolvedCommunication,
      ...(override.unresolvedCommunication || {})
    }
  }
}

/**
 * 解析某学生实际生效的阈值：有分组配置则用分组覆盖，否则用全局
 */
export const resolveStudentThreshold = (
  student: Student,
  globalThreshold: RiskThresholdConfig,
  groupOverrides: GroupThresholdMap
): { threshold: RiskThresholdConfig; source: 'global' | 'group'; group?: string } => {
  const override = student.group ? groupOverrides[student.group] : undefined
  if (override && Object.keys(override).length > 0) {
    return {
      threshold: mergeGroupThreshold(globalThreshold, override),
      source: 'group',
      group: student.group
    }
  }
  return { threshold: globalThreshold, source: 'global' }
}

// 默认阈值配置
export const DEFAULT_RISK_THRESHOLD: RiskThresholdConfig = {
  overdueHomework: {
    medium: 1,
    high: 3
  },
  inactivity: {
    mediumDays: 3,
    highDays: 7
  },
  scoreWarning: {
    mediumGap: 10,
    highGap: 20,
    baseline: 60
  },
  unresolvedCommunication: {
    medium: 1,
    high: 3
  }
}

// 风险等级元信息
export const RISK_LEVEL_META: Record<RiskLevel, RiskLevelMeta> = {
  high: {
    level: 'high',
    label: '高风险',
    color: '#ff4d4f',
    tagType: 'danger',
    description: '存在多项严重风险指标，需立即跟进'
  },
  medium: {
    level: 'medium',
    label: '中风险',
    color: '#faad14',
    tagType: 'warning',
    description: '存在风险指标，建议关注并适时跟进'
  },
  low: {
    level: 'low',
    label: '低风险',
    color: '#52c41a',
    tagType: 'success',
    description: '各项指标正常，继续保持'
  }
}

/**
 * 判断作业提交是否逾期（统一委托 homework 工具按截止时间实时判定）
 */
export const isSubmissionOverdue = (
  homework: Homework,
  submission: HomeworkSubmission,
  now: dayjs.Dayjs = dayjs()
): boolean => isSubmissionOverdueByDueDate(homework, submission, now)

/**
 * 统一的作业逾期判定口径：作业是否已过截止时间且未全部提交
 */
export const isHomeworkOverdue = (
  homework: Homework,
  now: dayjs.Dayjs = dayjs()
): boolean => {
  return dayjs(homework.dueDate).isBefore(now) && homework.submittedCount < homework.totalCount
}

/**
 * 统计某个学生的逾期作业数（实时按截止时间判定）
 */
export const countStudentOverdueHomework = (
  studentId: string,
  homeworks: Homework[],
  submissions: HomeworkSubmission[],
  now: dayjs.Dayjs = dayjs()
): number => {
  let count = 0
  for (const homework of homeworks) {
    if (!homework.assignedStudents.includes(studentId)) continue
    const submission = submissions.find(
      s => s.homeworkId === homework.id && s.studentId === studentId
    )
    if (!submission) {
      if (dayjs(homework.dueDate).isBefore(now)) {
        count++
      }
      continue
    }
    if (isSubmissionOverdue(homework, submission, now)) {
      count++
    }
  }
  return count
}

/**
 * 计算学生不活跃天数
 */
export const getInactiveDays = (student: Student, now: dayjs.Dayjs = dayjs()): number => {
  const lastActive = dayjs(student.lastActiveDate)
  return Math.max(0, now.diff(lastActive, 'day'))
}

/**
 * 计算学生平均分与警戒线的差距（低于警戒线的分数差，0 表示未低于）
 */
export const getScoreGap = (student: Student, baseline: number): number => {
  if (student.averageScore >= baseline) return 0
  return Number((baseline - student.averageScore).toFixed(1))
}

/**
 * 统计学生未解决的沟通记录数量
 */
export const countUnresolvedCommunications = (
  studentId: string,
  communications: CommunicationRecord[],
  followUps: FollowUpRecord[]
): number => {
  const unresolvedCommunicationCount = communications.filter(
    c => c.studentId === studentId && !c.isResolved
  ).length
  const pendingFollowUpCount = followUps.filter(
    f => f.studentId === studentId && f.status !== 'resolved'
  ).length
  return unresolvedCommunicationCount + pendingFollowUpCount
}

/**
 * 判定单个维度触发的风险等级
 */
const getDimensionLevel = (
  value: number,
  mediumThreshold: number,
  highThreshold: number
): RiskLevel | null => {
  if (value >= highThreshold) return 'high'
  if (value >= mediumThreshold) return 'medium'
  return null
}

/**
 * 综合多个维度等级取最高
 */
const combineLevels = (levels: (RiskLevel | null)[]): RiskLevel => {
  if (levels.includes('high')) return 'high'
  if (levels.includes('medium')) return 'medium'
  return 'low'
}

/**
 * 评估单个学生的风险
 * @param threshold 该学生实际生效的阈值（已解析分组覆盖）
 * @param thresholdSource 阈值来源
 * @param thresholdGroup 若为分组阈值，记录分组名
 */
export const evaluateStudentRisk = (
  student: Student,
  homeworks: Homework[],
  submissions: HomeworkSubmission[],
  communications: CommunicationRecord[],
  followUps: FollowUpRecord[],
  threshold: RiskThresholdConfig,
  now: dayjs.Dayjs = dayjs(),
  thresholdSource: 'global' | 'group' = 'global',
  thresholdGroup?: string
): StudentRiskResult => {
  const overdueHomeworkCount = countStudentOverdueHomework(
    student.id,
    homeworks,
    submissions,
    now
  )
  const inactiveDays = getInactiveDays(student, now)
  const scoreGap = getScoreGap(student, threshold.scoreWarning.baseline)
  const unresolvedCommunicationCount = countUnresolvedCommunications(
    student.id,
    communications,
    followUps
  )

  const hasPendingFollowUp = followUps.some(
    f => f.studentId === student.id && f.status !== 'resolved'
  )

  const dimensions: RiskDimensionDetail[] = [
    {
      dimension: 'homework',
      label: '作业逾期',
      isTriggered: overdueHomeworkCount >= threshold.overdueHomework.medium,
      currentValue: overdueHomeworkCount,
      thresholdValue: threshold.overdueHomework.medium,
      description:
        overdueHomeworkCount >= threshold.overdueHomework.medium
          ? `逾期未交作业 ${overdueHomeworkCount} 次`
          : '作业提交正常'
    },
    {
      dimension: 'activity',
      label: '学习活跃度',
      isTriggered: inactiveDays >= threshold.inactivity.mediumDays,
      currentValue: inactiveDays,
      thresholdValue: threshold.inactivity.mediumDays,
      description:
        inactiveDays >= threshold.inactivity.mediumDays
          ? `连续 ${inactiveDays} 天无学习动态`
          : '学习活跃正常'
    },
    {
      dimension: 'score',
      label: '成绩预警',
      isTriggered: scoreGap >= threshold.scoreWarning.mediumGap,
      currentValue: scoreGap,
      thresholdValue: threshold.scoreWarning.mediumGap,
      description:
        scoreGap >= threshold.scoreWarning.mediumGap
          ? `平均分低于警戒线 ${scoreGap} 分`
          : '成绩正常'
    },
    {
      dimension: 'communication',
      label: '沟通跟进',
      isTriggered: unresolvedCommunicationCount >= threshold.unresolvedCommunication.medium,
      currentValue: unresolvedCommunicationCount,
      thresholdValue: threshold.unresolvedCommunication.medium,
      description:
        unresolvedCommunicationCount >= threshold.unresolvedCommunication.medium
          ? `${unresolvedCommunicationCount} 条未解决沟通/跟进`
          : '沟通记录正常'
    }
  ]

  const homeworkLevel = getDimensionLevel(
    overdueHomeworkCount,
    threshold.overdueHomework.medium,
    threshold.overdueHomework.high
  )
  const activityLevel = getDimensionLevel(
    inactiveDays,
    threshold.inactivity.mediumDays,
    threshold.inactivity.highDays
  )
  const scoreLevel = getDimensionLevel(
    scoreGap,
    threshold.scoreWarning.mediumGap,
    threshold.scoreWarning.highGap
  )
  const communicationLevel = getDimensionLevel(
    unresolvedCommunicationCount,
    threshold.unresolvedCommunication.medium,
    threshold.unresolvedCommunication.high
  )

  const level = combineLevels([homeworkLevel, activityLevel, scoreLevel, communicationLevel])

  const score = [homeworkLevel, activityLevel, scoreLevel, communicationLevel].reduce(
    (sum, l) => sum + (l === 'high' ? 3 : l === 'medium' ? 1 : 0),
    0
  )

  return {
    studentId: student.id,
    studentName: student.name,
    studentAvatar: student.avatar,
    level,
    score,
    dimensions,
    overdueHomeworkCount,
    inactiveDays,
    scoreGap,
    unresolvedCommunicationCount,
    hasPendingFollowUp,
    evaluatedAt: now.toISOString(),
    effectiveThreshold: threshold,
    thresholdSource,
    thresholdGroup
  }
}

/**
 * 批量评估所有学生风险（按每个学生所属分组的生效阈值计算）
 */
export const evaluateAllStudentRisks = (
  students: Student[],
  homeworks: Homework[],
  submissions: HomeworkSubmission[],
  communications: CommunicationRecord[],
  followUps: FollowUpRecord[],
  threshold: RiskThresholdConfig,
  now: dayjs.Dayjs = dayjs(),
  groupOverrides: GroupThresholdMap = {}
): StudentRiskResult[] => {
  return students.map(student => {
    const resolved = resolveStudentThreshold(student, threshold, groupOverrides)
    return evaluateStudentRisk(
      student,
      homeworks,
      submissions,
      communications,
      followUps,
      resolved.threshold,
      now,
      resolved.source,
      resolved.group
    )
  })
}

/**
 * 计算风险概览统计
 */
export const calculateRiskOverview = (
  results: StudentRiskResult[],
  followUps: FollowUpRecord[]
): RiskOverview => {
  const highCount = results.filter(r => r.level === 'high').length
  const mediumCount = results.filter(r => r.level === 'medium').length
  const lowCount = results.filter(r => r.level === 'low').length
  const pendingFollowUpCount = followUps.filter(f => f.status !== 'resolved').length
  const highFollowUpCount = followUps.filter(
    f => f.status !== 'resolved' && f.riskLevel === 'high'
  ).length

  return {
    total: results.length,
    highCount,
    mediumCount,
    lowCount,
    pendingFollowUpCount,
    highFollowUpCount
  }
}
