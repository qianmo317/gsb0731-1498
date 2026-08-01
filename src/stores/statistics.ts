/**
 * 统计数据 Store
 */

import { defineStore } from 'pinia'
import type {
  DashboardOverview,
  StudyTimeTrend,
  CompletionRateTrend,
  StudentProgressComparison,
  TimeRangeType
} from '@/types/statistics'
import * as statisticsApi from '@/api/statistics'

export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    dashboardOverview: null as DashboardOverview | null,
    studyTimeTrend: null as StudyTimeTrend | null,
    completionRateTrend: null as CompletionRateTrend | null,
    studentProgressComparison: null as StudentProgressComparison | null,
    loading: false
  }),

  actions: {
    // 获取首页概览数据
    async fetchDashboardOverview() {
      this.loading = true
      try {
        this.dashboardOverview = await statisticsApi.getDashboardOverview()
      } catch (error) {
        console.error('获取首页概览数据失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取学习时长趋势
    async fetchStudyTimeTrend(timeRange: TimeRangeType) {
      this.loading = true
      try {
        this.studyTimeTrend = await statisticsApi.getStudyTimeTrend(timeRange)
      } catch (error) {
        console.error('获取学习时长趋势失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取作业完成率趋势
    async fetchCompletionRateTrend(timeRange: TimeRangeType) {
      this.loading = true
      try {
        this.completionRateTrend = await statisticsApi.getCompletionRateTrend(timeRange)
      } catch (error) {
        console.error('获取作业完成率趋势失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取学生进度对比
    async fetchStudentProgressComparison(studentIds?: string[]) {
      this.loading = true
      try {
        this.studentProgressComparison = await statisticsApi.getStudentProgressComparison(studentIds)
      } catch (error) {
        console.error('获取学生进度对比失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
