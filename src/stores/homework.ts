/**
 * 作业 Store
 */

import { defineStore } from 'pinia'
import type { Homework, HomeworkSubmission, HomeworkFilterParams, GradeFormData } from '@/types/homework'
import type { PaginationParams } from '@/types/common'
import * as homeworkApi from '@/api/homework'
import { getHomeworkStatus, isHomeworkOverdue } from '@/utils/homework'

export const useHomeworkStore = defineStore('homework', {
  state: () => ({
    homeworks: [] as Homework[],
    currentHomework: null as Homework | null,
    submissions: [] as HomeworkSubmission[],
    currentSubmission: null as HomeworkSubmission | null,
    total: 0,
    loading: false,
    filterParams: {} as HomeworkFilterParams
  }),

  getters: {
    // 待批改作业数量
    pendingGradeCount: state =>
      state.submissions.filter(s => s.status === 'submitted').length,

    // 已完成作业数量（按实时状态判定）
    completedCount: state =>
      state.homeworks.filter(h => getHomeworkStatus(h) === 'completed').length,

    // 逾期作业数量（统一按截止时间实时判定，不读写死 status）
    overdueCount: state => state.homeworks.filter(h => isHomeworkOverdue(h)).length
  },

  actions: {
    // 获取作业列表
    async fetchHomeworks(params: PaginationParams & HomeworkFilterParams) {
      this.loading = true
      try {
        const response = await homeworkApi.getHomeworkList(params)
        this.homeworks = response.list
        this.total = response.total
        this.filterParams = params
        return response
      } catch (error) {
        console.error('获取作业列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取作业详情
    async fetchHomeworkDetail(id: string) {
      this.loading = true
      try {
        this.currentHomework = await homeworkApi.getHomeworkDetail(id)
      } catch (error) {
        console.error('获取作业详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取作业提交列表
    async fetchSubmissions(homeworkId: string, params?: { status?: string }) {
      this.loading = true
      try {
        this.submissions = await homeworkApi.getHomeworkSubmissions(homeworkId, params)
      } catch (error) {
        console.error('获取作业提交列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取提交详情
    async fetchSubmissionDetail(id: string) {
      this.loading = true
      try {
        this.currentSubmission = await homeworkApi.getSubmissionDetail(id)
      } catch (error) {
        console.error('获取提交详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 批改作业
    async gradeHomework(submissionId: string, data: GradeFormData) {
      this.loading = true
      try {
        const updated = await homeworkApi.gradeHomework(submissionId, data)
        const index = this.submissions.findIndex(s => s.id === submissionId)
        if (index !== -1) {
          this.submissions[index] = updated
        }
        if (this.currentSubmission?.id === submissionId) {
          this.currentSubmission = updated
        }
        return updated
      } catch (error) {
        console.error('批改作业失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 批量批改作业
    async batchGradeHomework(submissionIds: string[], data: GradeFormData) {
      this.loading = true
      try {
        await homeworkApi.batchGradeHomework(submissionIds, data)
        // 重新获取提交列表
        if (this.currentHomework) {
          await this.fetchSubmissions(this.currentHomework.id)
        }
      } catch (error) {
        console.error('批量批改作业失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
