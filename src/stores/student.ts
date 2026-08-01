/**
 * 学生 Store
 */

import { defineStore } from 'pinia'
import type { Student, StudentFilterParams, StudentStudyRecord } from '@/types/student'
import type { PaginationParams } from '@/types/common'
import * as studentApi from '@/api/student'

export const useStudentStore = defineStore('student', {
  state: () => ({
    students: [] as Student[],
    currentStudent: null as Student | null,
    studyRecords: [] as StudentStudyRecord[],
    total: 0,
    loading: false,
    filterParams: {} as StudentFilterParams
  }),

  getters: {
    // 活跃学生数量
    activeStudentsCount: state => state.students.filter(s => s.status === 'active').length,

    // 学生分组统计
    groupStatistics: state => {
      const groups = new Map<string, number>()
      state.students.forEach(s => {
        const count = groups.get(s.group) || 0
        groups.set(s.group, count + 1)
      })
      return Array.from(groups.entries()).map(([group, count]) => ({ group, count }))
    },

    // 学生等级统计
    levelStatistics: state => {
      const levels = new Map<string, number>()
      state.students.forEach(s => {
        const count = levels.get(s.level) || 0
        levels.set(s.level, count + 1)
      })
      return Array.from(levels.entries()).map(([level, count]) => ({ level, count }))
    }
  },

  actions: {
    // 获取学生列表
    async fetchStudents(params: PaginationParams & StudentFilterParams) {
      this.loading = true
      try {
        const response = await studentApi.getStudentList(params)
        this.students = response.list
        this.total = response.total
        this.filterParams = params
        return response // 返回响应数据
      } catch (error) {
        console.error('获取学生列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取学生详情
    async fetchStudentDetail(id: string) {
      this.loading = true
      try {
        this.currentStudent = await studentApi.getStudentDetail(id)
      } catch (error) {
        console.error('获取学生详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 创建学生
    async createStudent(data: any) {
      this.loading = true
      try {
        const newStudent = await studentApi.createStudent(data)
        this.students.unshift(newStudent)
        this.total++
        return newStudent
      } catch (error) {
        console.error('创建学生失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 更新学生
    async updateStudent(id: string, data: any) {
      this.loading = true
      try {
        const updated = await studentApi.updateStudent(id, data)
        const index = this.students.findIndex(s => s.id === id)
        if (index !== -1) {
          this.students[index] = updated
        }
        if (this.currentStudent?.id === id) {
          this.currentStudent = updated
        }
        return updated
      } catch (error) {
        console.error('更新学生失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 删除学生
    async deleteStudent(id: string) {
      this.loading = true
      try {
        await studentApi.deleteStudent(id)
        this.students = this.students.filter(s => s.id !== id)
        this.total--
      } catch (error) {
        console.error('删除学生失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 批量删除学生
    async batchDeleteStudents(ids: string[]) {
      this.loading = true
      try {
        await studentApi.batchDeleteStudents(ids)
        this.students = this.students.filter(s => !ids.includes(s.id))
        this.total -= ids.length
      } catch (error) {
        console.error('批量删除学生失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取学生学习记录
    async fetchStudyRecords(studentId: string, params: PaginationParams) {
      this.loading = true
      try {
        const response = await studentApi.getStudentStudyRecords(studentId, params)
        this.studyRecords = response.list
      } catch (error) {
        console.error('获取学生学习记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 更新学生标签
    async updateStudentTags(id: string, tags: string[]) {
      try {
        const updated = await studentApi.updateStudentTags(id, tags)
        const index = this.students.findIndex(s => s.id === id)
        if (index !== -1) {
          this.students[index] = updated
        }
        if (this.currentStudent?.id === id) {
          this.currentStudent = updated
        }
        return updated
      } catch (error) {
        console.error('更新学生标签失败:', error)
        throw error
      }
    }
  },

  persist: {
    key: 'teacher-admin-student',
    paths: ['filterParams']
  }
})
