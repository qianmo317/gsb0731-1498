/**
 * 学情风险预警相关 API
 */

import type { Student } from '@/types/student'
import type { Homework, HomeworkSubmission } from '@/types/homework'
import type { CommunicationRecord } from '@/types/communication'
import type { PaginationParams, PaginationResponse } from '@/types/common'
import type {
  RiskFilterParams,
  RiskOverview,
  RiskThresholds,
  GroupThresholds,
  StudentRisk,
  RiskTrendPoint,
  RiskWeekCounts,
  RiskTrendSnapshotStore,
  StudentRiskProfile,
  RiskExportRow
} from '@/types/risk'
import { getMockData } from '@/mock'
import { delay, paginate } from '@/mock/utils'
import {
  computeStudentRisk,
  getThresholdsSignature,
  DEFAULT_RISK_THRESHOLDS
} from '@/utils/risk'
import type { RiskComputeContext } from '@/utils/risk'
import { getLocal, setLocal } from '@/utils/storage'
import { formatDateTime } from '@/utils/date'
import dayjs from 'dayjs'

// 风险趋势快照本地存储键（沿用 storage 工具自动加前缀 teacher-admin-）
const TREND_SNAPSHOT_KEY = 'risk-trend-snapshots'

// 趋势展示周数
const TREND_WEEKS = 8

// 阈值配置：全局阈值 + 按分组覆盖
export interface RiskThresholdConfig {
  thresholds: RiskThresholds
  groupThresholds?: GroupThresholds
}

const DEFAULT_CONFIG: RiskThresholdConfig = { thresholds: DEFAULT_RISK_THRESHOLDS }

// 组装风险计算上下文
const buildContext = (config: RiskThresholdConfig): RiskComputeContext => {
  const mockData = getMockData()
  return {
    homeworks: mockData.homeworks as Homework[],
    submissions: mockData.submissions as HomeworkSubmission[],
    communications: mockData.communications as CommunicationRecord[],
    thresholds: config.thresholds,
    groupThresholds: config.groupThresholds
  }
}

// 给所有学生标注风险信息
const annotateStudents = (context: RiskComputeContext): StudentRisk[] => {
  const mockData = getMockData()
  const students = mockData.students as Student[]
  return students.map(student => ({
    ...student,
    risk: computeStudentRisk(student, context)
  }))
}

// 按筛选参数过滤并排序（供列表分页与导出复用，保证口径一致）
const filterAndSortStudents = (
  list: StudentRisk[],
  params: RiskFilterParams
): StudentRisk[] => {
  let result = list

  // 学生基础筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    result = result.filter(
      s =>
        s.name.toLowerCase().includes(keyword) ||
        s.phone.includes(keyword) ||
        s.parentPhone.includes(keyword)
    )
  }

  if (params.status) {
    result = result.filter(s => s.status === params.status)
  }

  if (params.level) {
    result = result.filter(s => s.level === params.level)
  }

  if (params.group) {
    result = result.filter(s => s.group === params.group)
  }

  if (params.grade) {
    result = result.filter(s => s.grade === params.grade)
  }

  if (params.tags && params.tags.length > 0) {
    result = result.filter(s => params.tags!.some(tag => s.tags.includes(tag)))
  }

  // 风险等级筛选
  if (params.riskLevel) {
    result = result.filter(s => s.risk.level === params.riskLevel)
  }

  // 排序：默认按风险分从高到低，支持升序
  const ascending = params.sortOrder === 'ascending'
  return [...result].sort((a, b) =>
    ascending ? a.risk.score - b.risk.score : b.risk.score - a.risk.score
  )
}

// 获取带风险信息的学生列表（先筛选排序再分页，避免翻页串数据）
export const getStudentRiskList = async (
  params: PaginationParams & RiskFilterParams,
  config: RiskThresholdConfig = DEFAULT_CONFIG
): Promise<PaginationResponse<StudentRisk>> => {
  await delay()

  const context = buildContext(config)
  const list = filterAndSortStudents(annotateStudents(context), params)

  const page = params.page || 1
  const pageSize = params.pageSize || 20

  return paginate(list, page, pageSize)
}

// 获取首页风险概览
export const getRiskOverview = async (
  config: RiskThresholdConfig = DEFAULT_CONFIG
): Promise<RiskOverview> => {
  await delay()

  const context = buildContext(config)
  const list = annotateStudents(context)

  const high = list.filter(s => s.risk.level === 'high').length
  const medium = list.filter(s => s.risk.level === 'medium').length
  const low = list.filter(s => s.risk.level === 'low').length

  // 待跟进：存在未解决沟通的学生数
  const pendingFollowUp = list.filter(
    s => s.risk.dimensions.communication.value > 0
  ).length

  return {
    high,
    medium,
    low,
    total: list.length,
    pendingFollowUp
  }
}

// 统计某一参考时间点各等级人数
const countLevelsAt = (context: RiskComputeContext, asOf: dayjs.Dayjs): RiskWeekCounts => {
  const mockData = getMockData()
  const students = mockData.students as Student[]
  const counts: RiskWeekCounts = { high: 0, medium: 0, low: 0 }
  students.forEach(student => {
    const level = computeStudentRisk(student, context, asOf).level
    counts[level] += 1
  })
  return counts
}

// 获取近八周各等级人数趋势：历史周读快照，本周实时计算
export const getRiskTrend = async (
  config: RiskThresholdConfig = DEFAULT_CONFIG
): Promise<RiskTrendPoint[]> => {
  await delay()

  const context = buildContext(config)
  const signature = getThresholdsSignature(config.thresholds, config.groupThresholds)

  // 读取快照；阈值签名变化时作废历史快照重算
  let snapshotStore = getLocal<RiskTrendSnapshotStore>(TREND_SNAPSHOT_KEY)
  if (!snapshotStore || snapshotStore.signature !== signature) {
    snapshotStore = { signature, weeks: {} }
  }

  const currentWeekStart = dayjs().startOf('week')
  const points: RiskTrendPoint[] = []

  for (let i = TREND_WEEKS - 1; i >= 0; i--) {
    const weekStart = currentWeekStart.subtract(i, 'week')
    const weekKey = weekStart.format('YYYY-MM-DD')
    const isCurrent = i === 0

    let counts: RiskWeekCounts
    if (isCurrent) {
      // 本周：实时值
      counts = countLevelsAt(context, dayjs())
    } else if (snapshotStore.weeks[weekKey]) {
      // 历史周：已有快照
      counts = snapshotStore.weeks[weekKey]
    } else {
      // 历史周：无快照则按当时时间计算并存快照（以周末作为该周的结算点）
      const asOf = weekStart.endOf('week')
      counts = countLevelsAt(context, asOf)
      snapshotStore.weeks[weekKey] = counts
    }

    points.push({
      week: weekStart.format('MM-DD'),
      weekStart: weekKey,
      high: counts.high,
      medium: counts.medium,
      low: counts.low,
      isCurrent
    })
  }

  // 持久化快照（含新补算的历史周）
  setLocal(TREND_SNAPSHOT_KEY, snapshotStore)

  return points
}

// 获取单个学生的风险档案（按该学生实际生效阈值实时计算，阈值一改随之重算）
export const getStudentRiskProfile = async (
  studentId: string,
  config: RiskThresholdConfig = DEFAULT_CONFIG
): Promise<StudentRiskProfile> => {
  await delay()

  const context = buildContext(config)
  const mockData = getMockData()
  const student = (mockData.students as Student[]).find(s => s.id === studentId)

  if (!student) {
    throw new Error('学生不存在')
  }

  return {
    studentId,
    risk: computeStudentRisk(student, context)
  }
}

// 查询学生最近一次跟进沟通时间
const getLastFollowUpTime = (
  studentId: string,
  communications: CommunicationRecord[]
): string => {
  const records = communications
    .filter(c => c.studentId === studentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return records.length > 0 ? formatDateTime(records[0].createdAt) : ''
}

// 导出当前筛选后的预警名单（不分页，含最近跟进时间）
export const exportStudentRiskList = async (
  params: RiskFilterParams,
  config: RiskThresholdConfig = DEFAULT_CONFIG
): Promise<RiskExportRow[]> => {
  await delay()

  const context = buildContext(config)
  const list = filterAndSortStudents(annotateStudents(context), params)
  const communications = context.communications

  return list.map(student => ({
    ...student,
    lastFollowUpTime: getLastFollowUpTime(student.id, communications)
  }))
}
