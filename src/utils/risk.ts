/**
 * 风险预警计算工具
 */

import dayjs from 'dayjs'
import type {
  RiskLevel,
  RiskFactorResult,
  StudentRisk,
  RiskThresholdConfig,
  RiskLevelMeta,
  RiskOverview,
  RiskWeeklySnapshot,
  RiskTrendPoint,
  GroupThresholdMap,
  ThresholdSource
} from '@/types/risk'
import type { Student } from '@/types/student'
import type { Homework, HomeworkSubmission } from '@/types/homework'
import type { CommunicationRecord } from '@/types/communication'

export const DEFAULT_RISK_THRESHOLDS: RiskThresholdConfig = {
  homework: {
    mediumThreshold: 1,
    highThreshold: 3
  },
  activity: {
    mediumThreshold: 3,
    highThreshold: 7
  },
  score: {
    warningLine: 70,
    mediumGap: 10,
    highGap: 20
  },
  communication: {
    mediumThreshold: 1,
    highThreshold: 3
  }
}

export const RISK_LEVEL_META: Record<RiskLevel, RiskLevelMeta> = {
  high: {
    label: '高风险',
    type: 'danger',
    color: '#f56c6c',
    bgColor: '#fef0f0'
  },
  medium: {
    label: '中风险',
    type: 'warning',
    color: '#e6a23c',
    bgColor: '#fdf6ec'
  },
  low: {
    label: '低风险',
    type: 'success',
    color: '#67c23a',
    bgColor: '#f0f9eb'
  }
}

const DIMENSION_LABELS: Record<string, string> = {
  homework: '作业逾期',
  activity: '学习活跃',
  score: '成绩预警',
  communication: '沟通跟进'
}

export const FOLLOW_UP_COMMUNICATION_TYPES = ['feedback', 'parent', 'other'] as const

export const isFollowUpCommunication = (type: string): boolean => {
  return (FOLLOW_UP_COMMUNICATION_TYPES as readonly string[]).includes(type)
}

export const isHomeworkOverdue = (
  homework: Homework,
  submission?: HomeworkSubmission
): boolean => {
  const now = dayjs()
  const dueDate = dayjs(homework.dueDate)

  if (!dueDate.isValid()) return false
  if (!dueDate.isBefore(now)) return false

  if (!submission) return true
  if (submission.status === 'not_submitted') return true

  return false
}

export const countOverdueHomework = (
  studentId: string,
  homeworks: Homework[],
  submissions: HomeworkSubmission[]
): number => {
  let count = 0

  for (const homework of homeworks) {
    if (!homework.assignedStudents.includes(studentId)) continue

    const submission = submissions.find(
      s => s.homeworkId === homework.id && s.studentId === studentId
    )

    if (isHomeworkOverdue(homework, submission)) {
      count++
    }
  }

  return count
}

export const calculateInactiveDays = (lastActiveDate: string): number => {
  const lastActive = dayjs(lastActiveDate)
  if (!lastActive.isValid()) return 0
  const now = dayjs()
  return Math.max(0, now.diff(lastActive, 'day'))
}

export const calculateScoreGap = (
  averageScore: number,
  warningLine: number
): number => {
  return Math.max(0, warningLine - averageScore)
}

export const countUnresolvedCommunications = (
  studentId: string,
  communications: CommunicationRecord[]
): number => {
  return communications.filter(
    c => c.studentId === studentId && !c.isResolved
  ).length
}

const calculateDimensionLevel = (
  value: number,
  mediumThreshold: number,
  highThreshold: number
): RiskLevel => {
  if (value >= highThreshold) return 'high'
  if (value >= mediumThreshold) return 'medium'
  return 'low'
}

const calculateOverallLevel = (factors: RiskFactorResult[]): RiskLevel => {
  if (factors.some(f => f.level === 'high')) return 'high'
  if (factors.some(f => f.level === 'medium')) return 'medium'
  return 'low'
}

const calculateRiskScore = (factors: RiskFactorResult[]): number => {
  const dimensionScores = factors.map(f => {
    if (f.level === 'high') return 100
    if (f.level === 'medium') return 50
    const ratio = f.mediumThreshold > 0 ? f.value / f.mediumThreshold : 0
    return Math.min(50, ratio * 50)
  })

  return Math.round(
    dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length
  )
}

const generateFactorDescription = (
  dimension: string,
  value: number,
  level: RiskLevel
): string => {
  if (level === 'low') {
    switch (dimension) {
      case 'homework':
        return value === 0 ? '无逾期作业' : `逾期${value}次（低于预警线）`
      case 'activity':
        return value === 0 ? '今日有活跃' : `${value}天未活跃`
      case 'score':
        return '成绩达标'
      case 'communication':
        return value === 0 ? '无待跟进沟通' : `${value}条未解决（低于预警线）`
      default:
        return ''
    }
  }

  switch (dimension) {
    case 'homework':
      return `逾期未交${value}次`
    case 'activity':
      return `${value}天无学习动态`
    case 'score':
      return `低于警戒线${value}分`
    case 'communication':
      return `${value}条沟通未解决`
    default:
      return ''
  }
}

export const evaluateStudentRisk = (
  student: Student,
  homeworks: Homework[],
  submissions: HomeworkSubmission[],
  communications: CommunicationRecord[],
  thresholds: RiskThresholdConfig,
  thresholdSource: ThresholdSource = 'global'
): StudentRisk => {
  const overdueHomeworkCount = countOverdueHomework(
    student.id,
    homeworks,
    submissions
  )
  const inactiveDays = calculateInactiveDays(student.lastActiveDate)
  const scoreGap = calculateScoreGap(
    student.averageScore,
    thresholds.score.warningLine
  )
  const unresolvedCommunicationCount = countUnresolvedCommunications(
    student.id,
    communications
  )

  const homeworkLevel = calculateDimensionLevel(
    overdueHomeworkCount,
    thresholds.homework.mediumThreshold,
    thresholds.homework.highThreshold
  )
  const activityLevel = calculateDimensionLevel(
    inactiveDays,
    thresholds.activity.mediumThreshold,
    thresholds.activity.highThreshold
  )
  const scoreLevel = calculateDimensionLevel(
    scoreGap,
    thresholds.score.mediumGap,
    thresholds.score.highGap
  )
  const communicationLevel = calculateDimensionLevel(
    unresolvedCommunicationCount,
    thresholds.communication.mediumThreshold,
    thresholds.communication.highThreshold
  )

  const factors: RiskFactorResult[] = [
    {
      dimension: 'homework',
      label: DIMENSION_LABELS.homework,
      value: overdueHomeworkCount,
      mediumThreshold: thresholds.homework.mediumThreshold,
      highThreshold: thresholds.homework.highThreshold,
      level: homeworkLevel,
      description: generateFactorDescription('homework', overdueHomeworkCount, homeworkLevel)
    },
    {
      dimension: 'activity',
      label: DIMENSION_LABELS.activity,
      value: inactiveDays,
      mediumThreshold: thresholds.activity.mediumThreshold,
      highThreshold: thresholds.activity.highThreshold,
      level: activityLevel,
      description: generateFactorDescription('activity', inactiveDays, activityLevel)
    },
    {
      dimension: 'score',
      label: DIMENSION_LABELS.score,
      value: scoreGap,
      mediumThreshold: thresholds.score.mediumGap,
      highThreshold: thresholds.score.highGap,
      level: scoreLevel,
      description: generateFactorDescription('score', scoreGap, scoreLevel)
    },
    {
      dimension: 'communication',
      label: DIMENSION_LABELS.communication,
      value: unresolvedCommunicationCount,
      mediumThreshold: thresholds.communication.mediumThreshold,
      highThreshold: thresholds.communication.highThreshold,
      level: communicationLevel,
      description: generateFactorDescription('communication', unresolvedCommunicationCount, communicationLevel)
    }
  ]

  const level = calculateOverallLevel(factors)
  const score = calculateRiskScore(factors)

  const studentComms = communications
    .filter(c => c.studentId === student.id && isFollowUpCommunication(c.type))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const latestFollowUpAt = studentComms.length > 0 ? studentComms[0].createdAt : null

  return {
    studentId: student.id,
    studentName: student.name,
    studentAvatar: student.avatar,
    studentGroup: student.group,
    level,
    score,
    factors,
    hasUnresolvedCommunication: unresolvedCommunicationCount > 0,
    overdueHomeworkCount,
    inactiveDays,
    scoreGap,
    unresolvedCommunicationCount,
    thresholdSource,
    latestFollowUpAt,
    updatedAt: new Date().toISOString()
  }
}

export const mergeThresholds = (
  global: RiskThresholdConfig,
  groupOverride?: Partial<RiskThresholdConfig>
): RiskThresholdConfig => {
  if (!groupOverride) return { ...global }
  return {
    homework: { ...global.homework, ...groupOverride.homework },
    activity: { ...global.activity, ...groupOverride.activity },
    score: { ...global.score, ...groupOverride.score },
    communication: { ...global.communication, ...groupOverride.communication }
  }
}

export const getEffectiveThresholds = (
  globalThresholds: RiskThresholdConfig,
  groupThresholds: GroupThresholdMap,
  group?: string
): { thresholds: RiskThresholdConfig; source: ThresholdSource } => {
  if (group && groupThresholds[group]) {
    return {
      thresholds: mergeThresholds(globalThresholds, groupThresholds[group]),
      source: 'group'
    }
  }
  return { thresholds: { ...globalThresholds }, source: 'global' }
}

export const evaluateAllStudentsRisk = (
  students: Student[],
  homeworks: Homework[],
  submissions: HomeworkSubmission[],
  communications: CommunicationRecord[],
  globalThresholds: RiskThresholdConfig,
  groupThresholds: GroupThresholdMap = {}
): StudentRisk[] => {
  return students.map(student => {
    const { thresholds, source } = getEffectiveThresholds(
      globalThresholds,
      groupThresholds,
      student.group
    )
    return evaluateStudentRisk(
      student,
      homeworks,
      submissions,
      communications,
      thresholds,
      source
    )
  })
}

export const calculateRiskOverview = (risks: StudentRisk[]): RiskOverview => {
  const highCount = risks.filter(r => r.level === 'high').length
  const mediumCount = risks.filter(r => r.level === 'medium').length
  const lowCount = risks.filter(r => r.level === 'low').length
  const pendingFollowUpCount = risks.filter(
    r => r.hasUnresolvedCommunication || r.level === 'high'
  ).length

  return {
    total: risks.length,
    highCount,
    mediumCount,
    lowCount,
    pendingFollowUpCount
  }
}

export const getRiskTagType = (level: RiskLevel): 'danger' | 'warning' | 'success' => {
  return RISK_LEVEL_META[level].type
}

export const getRiskLabel = (level: RiskLevel): string => {
  return RISK_LEVEL_META[level].label
}

export const sortByRiskLevel = (a: StudentRisk, b: StudentRisk): number => {
  const levelOrder: Record<RiskLevel, number> = {
    high: 0,
    medium: 1,
    low: 2
  }
  return levelOrder[a.level] - levelOrder[b.level] || b.score - a.score
}

export const getWeekKey = (date: dayjs.Dayjs | Date | string = new Date()): string => {
  return dayjs(date).startOf('week').format('YYYY-MM-DD')
}

export const getWeekRange = (weekKey: string): { start: string; end: string } => {
  const start = dayjs(weekKey).startOf('week')
  const end = start.endOf('week')
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD')
  }
}

export const generateHistoricalSnapshots = (
  totalStudents: number,
  weeks: number = 7
): RiskWeeklySnapshot[] => {
  const total = Math.max(1, totalStudents)
  const snapshots: RiskWeeklySnapshot[] = []
  const now = dayjs()

  for (let i = weeks; i >= 1; i--) {
    const weekStart = now.subtract(i, 'week').startOf('week')
    const weekKey = weekStart.format('YYYY-MM-DD')
    const range = getWeekRange(weekKey)

    const seed = weekStart.date() + weekStart.month() * 3
    const pseudoRandom = (n: number): number => {
      const x = Math.sin(seed * 99 + n * 13) * 10000
      return x - Math.floor(x)
    }

    const baseHigh = Math.round(total * (0.3 + pseudoRandom(1) * 0.5))
    const baseMedium = Math.round(total * (0.1 + pseudoRandom(2) * 0.25))
    const high = Math.min(total, Math.max(0, baseHigh))
    const medium = Math.min(total - high, Math.max(0, baseMedium))
    const low = total - high - medium

    snapshots.push({
      weekKey,
      weekStart: range.start,
      weekEnd: range.end,
      highCount: high,
      mediumCount: medium,
      lowCount: low,
      total,
      snapshotAt: weekStart.endOf('week').toISOString()
    })
  }

  return snapshots
}

export const buildRiskTrend = (
  snapshots: RiskWeeklySnapshot[],
  currentRisks: StudentRisk[]
): RiskTrendPoint[] => {
  const points: RiskTrendPoint[] = snapshots.map(s => ({
    weekKey: s.weekKey,
    label: dayjs(s.weekKey).format('MM/DD'),
    highCount: s.highCount,
    mediumCount: s.mediumCount,
    lowCount: s.lowCount,
    isCurrentWeek: false
  }))

  const currentOverview = calculateRiskOverview(currentRisks)
  const currentWeekKey = getWeekKey()
  points.push({
    weekKey: currentWeekKey,
    label: dayjs(currentWeekKey).format('MM/DD') + ' 本周',
    highCount: currentOverview.highCount,
    mediumCount: currentOverview.mediumCount,
    lowCount: currentOverview.lowCount,
    isCurrentWeek: true
  })

  return points
}

export const buildStudentRiskProfile = (
  student: Pick<Student, 'id' | 'name'>,
  risks: StudentRisk[],
  communications: CommunicationRecord[]
) => {
  const risk = risks.find(r => r.studentId === student.id)
  const followUpComms = communications
    .filter(c => c.studentId === student.id && isFollowUpCommunication(c.type))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(c => ({
      id: c.id,
      title: c.title,
      type: c.type,
      method: c.method,
      isResolved: c.isResolved,
      isImportant: c.isImportant,
      createdAt: c.createdAt
    }))

  return {
    studentId: student.id,
    studentName: student.name,
    level: risk?.level ?? 'low' as RiskLevel,
    score: risk?.score ?? 0,
    factors: risk?.factors ?? [],
    overdueHomeworkCount: risk?.overdueHomeworkCount ?? 0,
    inactiveDays: risk?.inactiveDays ?? 0,
    scoreGap: risk?.scoreGap ?? 0,
    unresolvedCommunicationCount: risk?.unresolvedCommunicationCount ?? 0,
    followUpCommunications: followUpComms,
    thresholdSource: risk?.thresholdSource ?? 'global' as const,
    studentGroup: risk?.studentGroup,
    latestFollowUpAt: risk?.latestFollowUpAt ?? null,
    updatedAt: risk?.updatedAt ?? new Date().toISOString()
  }
}
