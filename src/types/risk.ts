/**
 * 风险预警相关类型定义
 */

// 风险等级
export type RiskLevel = 'high' | 'medium' | 'low'

// 风险维度
export type RiskDimension = 'homework' | 'activity' | 'score' | 'communication'

// 单个维度的风险明细
export interface RiskDimensionDetail {
  dimension: RiskDimension
  label: string
  isTriggered: boolean
  currentValue: number
  thresholdValue: number
  description: string
}

// 单个学生的风险评估结果
export interface StudentRiskResult {
  studentId: string
  studentName: string
  studentAvatar?: string
  level: RiskLevel
  score: number
  dimensions: RiskDimensionDetail[]
  overdueHomeworkCount: number
  inactiveDays: number
  scoreGap: number
  unresolvedCommunicationCount: number
  hasPendingFollowUp: boolean
  evaluatedAt: string
  // 该学生实际生效的阈值（分组阈值或全局阈值）
  effectiveThreshold: RiskThresholdConfig
  // 阈值来源：global=全局阈值，group=分组阈值
  thresholdSource: 'global' | 'group'
  // 若为分组阈值，记录分组名
  thresholdGroup?: string
}

// 风险阈值配置
export interface RiskThresholdConfig {
  overdueHomework: {
    medium: number
    high: number
  }
  inactivity: {
    mediumDays: number
    highDays: number
  }
  scoreWarning: {
    mediumGap: number
    highGap: number
    baseline: number
  }
  unresolvedCommunication: {
    medium: number
    high: number
  }
}

// 分组阈值覆盖配置：分组名 -> 阈值（仅需配置与全局不同的字段）
export type GroupThresholdOverride = Partial<{
  overdueHomework: Partial<RiskThresholdConfig['overdueHomework']>
  inactivity: Partial<RiskThresholdConfig['inactivity']>
  scoreWarning: Partial<RiskThresholdConfig['scoreWarning']>
  unresolvedCommunication: Partial<RiskThresholdConfig['unresolvedCommunication']>
}>

export type GroupThresholdMap = Record<string, GroupThresholdOverride>

// 跟进记录状态
export type FollowUpStatus = 'pending' | 'in_progress' | 'resolved'

// 跟进记录
export interface FollowUpRecord {
  id: string
  studentId: string
  studentName: string
  studentAvatar?: string
  riskLevel: RiskLevel
  title: string
  content: string
  status: FollowUpStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

// 跟进记录筛选参数
export interface FollowUpFilterParams {
  keyword?: string
  studentId?: string
  riskLevel?: RiskLevel
  status?: FollowUpStatus
}

// 跟进记录表单数据
export interface FollowUpFormData {
  studentId: string
  title: string
  content: string
}

// 风险概览统计
export interface RiskOverview {
  total: number
  highCount: number
  mediumCount: number
  lowCount: number
  pendingFollowUpCount: number
  highFollowUpCount: number
}

// 风险等级元信息
export interface RiskLevelMeta {
  level: RiskLevel
  label: string
  color: string
  tagType: 'danger' | 'warning' | 'success'
  description: string
}

// 单周风险快照（每周的预警结果存档）
export interface WeeklyRiskSnapshot {
  weekKey: string // ISO 周标识，如 2026-W31
  weekLabel: string // 展示标签，如 07-28~08-03
  weekStart: string // 该周周一日期 YYYY-MM-DD
  weekEnd: string // 该周周日日期 YYYY-MM-DD
  highCount: number
  mediumCount: number
  lowCount: number
  total: number
  createdAt: string // 快照生成时间
  isCurrent: boolean // 是否为本周（本周显示实时值）
}
