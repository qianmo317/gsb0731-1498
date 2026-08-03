/**
 * 学情风险预警相关类型定义
 */

import type { Student, StudentFilterParams } from './student'

// 风险等级
export type RiskLevel = 'high' | 'medium' | 'low'

// 风险维度标识
export type RiskDimensionKey = 'homework' | 'activity' | 'score' | 'communication'

// 预警阈值配置（全局可配置）
export interface RiskThresholds {
  overdueCount: number // 逾期未交次数达到该值触发高风险
  inactiveDays: number // 连续无学习动态天数
  scoreLine: number // 平均分警戒线
  unresolvedCount: number // 未解决沟通条数
}

// 按分组的阈值覆盖（未配置的分组回退全局阈值），键为分组名
export type GroupThresholds = Record<string, RiskThresholds>

// 阈值来源：分组阈值 or 全局阈值
export type ThresholdSource = 'group' | 'global'

// 单维度评估结果
export interface RiskDimension {
  level: RiskLevel
  value: number // 该维度的关键数值（逾期次数 / 不活跃天数 / 分差 / 未解决条数）
  label: string // 维度描述文案
}

// 四个维度的评估结果
export interface RiskDimensions {
  homework: RiskDimension
  activity: RiskDimension
  score: RiskDimension
  communication: RiskDimension
}

// 学生风险计算结果
export interface RiskResult {
  level: RiskLevel
  score: number // 综合风险分（各维度加权求和）
  dimensions: RiskDimensions
  reasons: string[] // 命中的风险原因文案
  thresholdSource: ThresholdSource // 该学生实际生效的阈值来源
  effectiveThresholds: RiskThresholds // 该学生实际生效的阈值
}

// 学生 + 风险信息
export interface StudentRisk extends Student {
  risk: RiskResult
}

// 风险学生列表筛选参数
export interface RiskFilterParams extends StudentFilterParams {
  riskLevel?: RiskLevel
  sortOrder?: 'ascending' | 'descending' | null
}

// 首页风险概览
export interface RiskOverview {
  high: number
  medium: number
  low: number
  total: number
  pendingFollowUp: number // 待跟进数量
}

// 单周各等级人数（风险趋势数据点）
export interface RiskTrendPoint {
  week: string // 周标签，如 '07-28'
  weekStart: string // 周起始日期 ISO
  high: number
  medium: number
  low: number
  isCurrent: boolean // 是否本周（本周为实时值，历史周为快照）
}

// 单周快照人数
export interface RiskWeekCounts {
  high: number
  medium: number
  low: number
}

// 风险趋势快照存储（持久化到浏览器本地）
export interface RiskTrendSnapshotStore {
  signature: string // 阈值签名，变化时触发历史周重算
  weeks: Record<string, RiskWeekCounts> // 以周起始日期为键
}

// 学生风险档案（当前等级 + 各指标命中情况）
export interface StudentRiskProfile {
  studentId: string
  risk: RiskResult
}

// 预警名单导出行（学生基础信息 + 风险等级 + 各指标命中值 + 最近跟进时间）
export interface RiskExportRow extends StudentRisk {
  lastFollowUpTime: string // 最近一次跟进沟通时间，无则为空
}
