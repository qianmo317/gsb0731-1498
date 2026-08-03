/**
 * 学情风险预警相关类型定义
 */

// 风险等级
export type RiskLevel = 'high' | 'medium' | 'low'

// 风险因素维度
export type RiskFactorType = 'overdue' | 'inactive' | 'score' | 'communication'

// 阈值来源：全局阈值或学生所在分组的单独阈值
export type RiskThresholdSource = 'global' | 'group'

// 风险预警阈值（全局可配置）
export interface RiskThresholds {
  overdueCount: number // 逾期未交作业达到该次数判为高风险
  inactiveDays: number // 连续无学习动态达到该天数判为高风险
  averageScoreLine: number // 平均分警戒线，低于该分数线产生成绩风险
  unresolvedCount: number // 未解决沟通达到该条数判为高风险
}

// 单个风险因素
export interface RiskFactor {
  type: RiskFactorType
  level: Exclude<RiskLevel, 'low'>
  value: number
  description: string
}

// 学生风险评估结果
export interface StudentRiskProfile {
  studentId: string
  studentName: string
  group: string // 学生所在分组
  level: RiskLevel
  factors: RiskFactor[]
  overdueCount: number // 实时判定的逾期未交次数
  inactiveDays: number // 连续未活跃天数
  averageScore: number // 参与判定的平均分
  unresolvedCount: number // 未解决沟通条数
  lastFollowUpAt: string | null // 最近跟进沟通时间，无记录为 null
  thresholdSource: RiskThresholdSource // 本次评估实际生效的阈值来源
  appliedThresholds: RiskThresholds // 本次评估实际生效的阈值
  evaluatedAt: string // 评估时间
}

// 风险概览统计
export interface RiskOverview {
  high: number
  medium: number
  low: number
  pendingFollowUp: number // 待跟进数量（高风险学生数）
  total: number
}

// 风险预警周快照
export interface RiskWeeklySnapshot {
  weekStart: string // 周一日期（YYYY-MM-DD）
  high: number
  medium: number
  low: number
}

// 风险趋势数据点（历史周无快照时各等级人数为 null）
export interface RiskTrendPoint {
  weekStart: string
  high: number | null
  medium: number | null
  low: number | null
}
