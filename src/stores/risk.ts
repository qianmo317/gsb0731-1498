/**
 * 学情风险预警 Store
 *
 * 全局持有阈值配置与风险概览，作为风险计算的统一入口，
 * 避免各页面各算一套。阈值持久化到浏览器本地，刷新不丢。
 */

import { defineStore } from 'pinia'
import type { PaginationParams } from '@/types/common'
import type {
  RiskFilterParams,
  RiskOverview,
  RiskThresholds,
  GroupThresholds,
  StudentRisk,
  RiskTrendPoint,
  StudentRiskProfile,
  RiskExportRow
} from '@/types/risk'
import * as riskApi from '@/api/risk'
import type { RiskThresholdConfig } from '@/api/risk'
import { DEFAULT_RISK_THRESHOLDS } from '@/utils/risk'

export const useRiskStore = defineStore('risk', {
  state: () => ({
    thresholds: { ...DEFAULT_RISK_THRESHOLDS } as RiskThresholds,
    groupThresholds: {} as GroupThresholds,
    overview: null as RiskOverview | null,
    trend: [] as RiskTrendPoint[],
    students: [] as StudentRisk[],
    total: 0,
    loading: false,
    filterParams: {} as RiskFilterParams
  }),

  getters: {
    // 当前生效的阈值配置（全局 + 分组覆盖）
    thresholdConfig(state): RiskThresholdConfig {
      return {
        thresholds: state.thresholds,
        groupThresholds: state.groupThresholds
      }
    }
  },

  actions: {
    // 获取带风险信息的学生列表
    async fetchStudentRiskList(params: PaginationParams & RiskFilterParams) {
      this.loading = true
      try {
        const response = await riskApi.getStudentRiskList(params, this.thresholdConfig)
        this.students = response.list
        this.total = response.total
        this.filterParams = params
        return response
      } catch (error) {
        console.error('获取风险学生列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取风险概览
    async fetchRiskOverview() {
      this.loading = true
      try {
        this.overview = await riskApi.getRiskOverview(this.thresholdConfig)
        return this.overview
      } catch (error) {
        console.error('获取风险概览失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取近八周风险趋势
    async fetchRiskTrend() {
      this.loading = true
      try {
        this.trend = await riskApi.getRiskTrend(this.thresholdConfig)
        return this.trend
      } catch (error) {
        console.error('获取风险趋势失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取单个学生风险档案
    async fetchStudentRiskProfile(studentId: string): Promise<StudentRiskProfile> {
      try {
        return await riskApi.getStudentRiskProfile(studentId, this.thresholdConfig)
      } catch (error) {
        console.error('获取学生风险档案失败:', error)
        throw error
      }
    },

    // 导出当前筛选后的预警名单
    async exportStudentRiskList(params: RiskFilterParams): Promise<RiskExportRow[]> {
      try {
        return await riskApi.exportStudentRiskList(params, this.thresholdConfig)
      } catch (error) {
        console.error('导出预警名单失败:', error)
        throw error
      }
    },

    // 更新全局阈值配置（改完由调用方触发列表/概览重新计算）
    updateThresholds(thresholds: RiskThresholds) {
      this.thresholds = { ...thresholds }
    },

    // 设置某个分组的阈值覆盖
    setGroupThresholds(group: string, thresholds: RiskThresholds) {
      this.groupThresholds = { ...this.groupThresholds, [group]: { ...thresholds } }
    },

    // 移除某个分组的阈值覆盖（回退全局）
    removeGroupThresholds(group: string) {
      const next = { ...this.groupThresholds }
      delete next[group]
      this.groupThresholds = next
    },

    // 重置全局阈值为默认值
    resetThresholds() {
      this.thresholds = { ...DEFAULT_RISK_THRESHOLDS }
    }
  },

  persist: {
    key: 'teacher-admin-risk',
    paths: ['thresholds', 'groupThresholds']
  }
})
