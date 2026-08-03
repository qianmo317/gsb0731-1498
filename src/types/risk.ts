/**
 * 风险预警相关类型定义
 */

// 风险等级
export type RiskLevel = 'high' | 'medium' | 'low'

// 风险维度
export type RiskDimension = 'homework' | 'activity' | 'score' | 'communication'

// 单个维度的风险评估结果
export interface RiskFactorResult {
  dimension: RiskDimension
  label: string
  value: number
  mediumThreshold: number
  highThreshold: number
  level: RiskLevel
  description: string
}

// 阈值来源
export type ThresholdSource = 'global' | 'group'

// 学生风险评估结果
export interface StudentRisk {
  studentId: string
  studentName: string
  studentAvatar?: string
  studentGroup?: string
  level: RiskLevel
  score: number
  factors: RiskFactorResult[]
  hasUnresolvedCommunication: boolean
  overdueHomeworkCount: number
  inactiveDays: number
  scoreGap: number
  unresolvedCommunicationCount: number
  thresholdSource: ThresholdSource
  latestFollowUpAt: string | null
  updatedAt: string
}

// 风险阈值配置
export interface RiskThresholdConfig {
  homework: {
    mediumThreshold: number
    highThreshold: number
  }
  activity: {
    mediumThreshold: number
    highThreshold: number
  }
  score: {
    warningLine: number
    mediumGap: number
    highGap: number
  }
  communication: {
    mediumThreshold: number
    highThreshold: number
  }
}

// 分组阈值映射（分组名 -> 部分阈值覆盖，未配置的维度回退全局）
export type GroupThresholdMap = Record<string, Partial<RiskThresholdConfig>>

// 风险概览统计
export interface RiskOverview {
  total: number
  highCount: number
  mediumCount: number
  lowCount: number
  pendingFollowUpCount: number
}

// 风险等级元数据
export interface RiskLevelMeta {
  label: string
  type: 'danger' | 'warning' | 'success'
  color: string
  bgColor: string
}

// 周风险快照（某一周结束时冻结的预警结果）
export interface RiskWeeklySnapshot {
  weekKey: string
  weekStart: string
  weekEnd: string
  highCount: number
  mediumCount: number
  lowCount: number
  total: number
  snapshotAt: string
}

// 趋势图数据点
export interface RiskTrendPoint {
  weekKey: string
  label: string
  highCount: number
  mediumCount: number
  lowCount: number
  isCurrentWeek: boolean
}

// 学生风险档案（详情页用）
export interface StudentRiskProfile {
  studentId: string
  studentName: string
  level: RiskLevel
  score: number
  factors: RiskFactorResult[]
  overdueHomeworkCount: number
  inactiveDays: number
  scoreGap: number
  unresolvedCommunicationCount: number
  followUpCommunications: Array<{
    id: string
    title: string
    type: string
    method: string
    isResolved: boolean
    isImportant: boolean
    createdAt: string
  }>
  thresholdSource: ThresholdSource
  studentGroup?: string
  latestFollowUpAt: string | null
  updatedAt: string
}
