/**
 * 学情风险预警 Store
 */

import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import type {
  RiskOverview,
  RiskThresholds,
  RiskTrendPoint,
  RiskWeeklySnapshot,
  StudentRiskProfile
} from '@/types/risk'
import * as riskApi from '@/api/risk'
import { getWeekStart } from '@/utils/date'

// 默认预警阈值
export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  overdueCount: 2,
  inactiveDays: 7,
  averageScoreLine: 60,
  unresolvedCount: 2
}

export const useRiskStore = defineStore('risk', {
  state: () => ({
    thresholds: { ...DEFAULT_RISK_THRESHOLDS } as RiskThresholds,
    groupThresholds: {} as Record<string, RiskThresholds>, // 按分组单独配置的阈值，未配置的分组回退全局阈值
    profiles: [] as StudentRiskProfile[],
    weeklySnapshots: [] as RiskWeeklySnapshot[],
    lastEvaluatedAt: null as string | null,
    loading: false
  }),

  getters: {
    // 按学生分组获取实际生效的阈值：分组单独配置优先，否则回退全局阈值
    getEffectiveThresholds: state => {
      return (group: string): RiskThresholds => state.groupThresholds[group] ?? state.thresholds
    },

    // 按学生ID获取风险评估结果
    getProfileById: state => {
      return (studentId: string): StudentRiskProfile | undefined =>
        state.profiles.find(p => p.studentId === studentId)
    },

    // 风险概览统计
    riskOverview: (state): RiskOverview => {
      const overview: RiskOverview = {
        high: 0,
        medium: 0,
        low: 0,
        pendingFollowUp: 0,
        total: state.profiles.length
      }
      state.profiles.forEach(p => {
        overview[p.level]++
      })
      // 高风险学生即为待跟进对象
      overview.pendingFollowUp = overview.high
      return overview
    },

    // 近八周风险趋势：历史周取快照（无快照为 null），本周取实时值
    weeklyTrend(state): RiskTrendPoint[] {
      const trend: RiskTrendPoint[] = []
      for (let i = 7; i >= 0; i--) {
        const weekStart = dayjs().startOf('week').subtract(i, 'week').format('YYYY-MM-DD')
        if (i === 0) {
          const overview = this.riskOverview
          trend.push({
            weekStart,
            high: overview.high,
            medium: overview.medium,
            low: overview.low
          })
        } else {
          const snapshot = state.weeklySnapshots.find(s => s.weekStart === weekStart)
          trend.push({
            weekStart,
            high: snapshot ? snapshot.high : null,
            medium: snapshot ? snapshot.medium : null,
            low: snapshot ? snapshot.low : null
          })
        }
      }
      return trend
    }
  },

  actions: {
    // 重新评估全部学生风险（按当前阈值实时计算）
    async evaluateAll() {
      this.loading = true
      try {
        this.profiles = await riskApi.evaluateStudentRisks(this.thresholds, this.groupThresholds)
        this.lastEvaluatedAt = new Date().toISOString()
        this.saveWeeklySnapshot()
      } catch (error) {
        console.error('评估学生风险失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 将本周预警结果落存为周快照，仅保留近八周
    saveWeeklySnapshot() {
      const weekStart = getWeekStart()
      const overview = this.riskOverview
      const snapshot: RiskWeeklySnapshot = {
        weekStart,
        high: overview.high,
        medium: overview.medium,
        low: overview.low
      }

      const index = this.weeklySnapshots.findIndex(s => s.weekStart === weekStart)
      if (index !== -1) {
        this.weeklySnapshots[index] = snapshot
      } else {
        this.weeklySnapshots.push(snapshot)
      }

      const earliest = dayjs().startOf('week').subtract(7, 'week').format('YYYY-MM-DD')
      this.weeklySnapshots = this.weeklySnapshots
        .filter(s => s.weekStart >= earliest)
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    },

    // 更新预警阈值（全局 + 分组）并立即按新值重算
    async updateThresholdConfig(
      thresholds: RiskThresholds,
      groupThresholds: Record<string, RiskThresholds>
    ) {
      this.thresholds = { ...thresholds }
      this.groupThresholds = { ...groupThresholds }
      await this.evaluateAll()
    }
  },

  persist: {
    key: 'teacher-admin-risk',
    paths: ['thresholds', 'groupThresholds', 'profiles', 'weeklySnapshots', 'lastEvaluatedAt']
  }
})
