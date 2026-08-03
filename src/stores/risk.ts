/**
 * 风险预警 Store
 * 管理阈值配置、风险评估结果、跟进记录
 */

import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import type { Student } from '@/types/student'
import type { Homework, HomeworkSubmission } from '@/types/homework'
import type { CommunicationRecord } from '@/types/communication'
import type {
  RiskThresholdConfig,
  StudentRiskResult,
  FollowUpRecord,
  FollowUpFormData,
  FollowUpStatus,
  RiskOverview,
  RiskLevel,
  WeeklyRiskSnapshot,
  GroupThresholdMap,
  GroupThresholdOverride
} from '@/types/risk'
import {
  DEFAULT_RISK_THRESHOLD,
  evaluateAllStudentRisks,
  calculateRiskOverview,
  resolveStudentThreshold,
  mergeGroupThreshold
} from '@/utils/risk'
import {
  buildWeeklyTrend,
  buildRecentWeeks,
  readAllSnapshots,
  writeAllSnapshots,
  buildFallbackSnapshot
} from '@/utils/riskSnapshot'
import { getMockData } from '@/mock'
import { generateId } from '@/mock/utils'

interface RiskState {
  threshold: RiskThresholdConfig
  groupOverrides: GroupThresholdMap
  followUps: FollowUpRecord[]
  loading: boolean
  lastEvaluatedAt: string | null
  _tick: number
}

export const useRiskStore = defineStore('risk', {
  state: (): RiskState => ({
    threshold: { ...DEFAULT_RISK_THRESHOLD },
    groupOverrides: {},
    followUps: [],
    loading: false,
    lastEvaluatedAt: null,
    _tick: 0
  }),

  getters: {
    // 获取原始数据
    rawStudents: (): Student[] => {
      const mockData = getMockData()
      return mockData.students as Student[]
    },
    rawHomeworks: (): Homework[] => {
      const mockData = getMockData()
      return mockData.homeworks as Homework[]
    },
    rawSubmissions: (): HomeworkSubmission[] => {
      const mockData = getMockData()
      return mockData.submissions as HomeworkSubmission[]
    },
    rawCommunications: (): CommunicationRecord[] => {
      const mockData = getMockData()
      return mockData.communications as CommunicationRecord[]
    },

    // 实时计算所有学生风险（基于当前时间、最新数据、各分组生效阈值）
    riskResults(state): StudentRiskResult[] {
      void state._tick
      void state.lastEvaluatedAt
      return evaluateAllStudentRisks(
        this.rawStudents,
        this.rawHomeworks,
        this.rawSubmissions,
        this.rawCommunications,
        state.followUps,
        state.threshold,
        dayjs(),
        state.groupOverrides
      )
    },

    // 按学生ID索引风险结果
    riskResultMap(): Record<string, StudentRiskResult> {
      const map: Record<string, StudentRiskResult> = {}
      this.riskResults.forEach(r => {
        map[r.studentId] = r
      })
      return map
    },

    // 风险概览
    riskOverview(state): RiskOverview {
      return calculateRiskOverview(this.riskResults, state.followUps)
    },

    // 待跟进数量
    pendingFollowUpCount(state): number {
      return state.followUps.filter(f => f.status !== 'resolved').length
    },

    // 高风险学生列表
    highRiskStudents(): StudentRiskResult[] {
      return this.riskResults
        .filter(r => r.level === 'high')
        .sort((a, b) => b.score - a.score)
    },

    // 近8周风险趋势（历史周读快照，本周用实时值）
    weeklyTrend(state): WeeklyRiskSnapshot[] {
      void state._tick
      return buildWeeklyTrend(
        8,
        this.rawStudents,
        this.riskResults,
        state.followUps
      )
    }
  },

  actions: {
    // 初始化跟进记录（从 localStorage 读取）
    initFollowUps() {
      const stored = localStorage.getItem('teacher-admin-followups')
      if (stored) {
        try {
          this.followUps = JSON.parse(stored) as FollowUpRecord[]
        } catch (error) {
          console.error('解析跟进记录失败:', error)
          this.followUps = []
        }
      }
    },

    // 持久化跟进记录
    persistFollowUps() {
      localStorage.setItem('teacher-admin-followups', JSON.stringify(this.followUps))
    },

    // 获取指定学生的风险结果
    getStudentRisk(studentId: string): StudentRiskResult | undefined {
      return this.riskResultMap[studentId]
    },

    // 更新阈值配置
    updateThreshold(newThreshold: RiskThresholdConfig) {
      this.threshold = { ...newThreshold }
    },

    // 重置阈值为默认值
    resetThreshold() {
      this.threshold = { ...DEFAULT_RISK_THRESHOLD }
    },

    // ===== 分组阈值 =====

    // 获取某分组的阈值覆盖
    getGroupOverride(group: string): GroupThresholdOverride | undefined {
      return this.groupOverrides[group]
    },

    // 保存某分组的阈值覆盖（与全局合并后存差异字段）
    updateGroupOverride(group: string, override: GroupThresholdOverride) {
      this.groupOverrides = {
        ...this.groupOverrides,
        [group]: override
      }
      this.refreshEvaluation()
    },

    // 清除某分组的阈值覆盖，回退到全局阈值
    clearGroupOverride(group: string) {
      const next = { ...this.groupOverrides }
      delete next[group]
      this.groupOverrides = next
      this.refreshEvaluation()
    },

    // 获取某学生实际生效的阈值（含来源）
    getEffectiveThreshold(student: Student): {
      threshold: RiskThresholdConfig
      source: 'global' | 'group'
      group?: string
    } {
      return resolveStudentThreshold(student, this.threshold, this.groupOverrides)
    },

    // 获取某分组的完整生效阈值（用于设置页回填）
    getGroupEffectiveThreshold(group: string): RiskThresholdConfig {
      return mergeGroupThreshold(this.threshold, this.groupOverrides[group])
    },

    // 创建跟进记录（单人）
    createFollowUp(data: FollowUpFormData): FollowUpRecord {
      const risk = this.getStudentRisk(data.studentId)
      const student = this.rawStudents.find(s => s.id === data.studentId)

      if (!student) {
        throw new Error('学生不存在')
      }

      const now = new Date().toISOString()
      const followUp: FollowUpRecord = {
        id: generateId(),
        studentId: data.studentId,
        studentName: student.name,
        studentAvatar: student.avatar,
        riskLevel: risk?.level || 'medium',
        title: data.title,
        content: data.content,
        status: 'pending',
        createdBy: '张老师',
        createdAt: now,
        updatedAt: now
      }

      this.followUps.unshift(followUp)
      this.persistFollowUps()
      return followUp
    },

    // 批量创建跟进记录
    batchCreateFollowUps(
      studentIds: string[],
      title: string,
      content: string
    ): FollowUpRecord[] {
      const records: FollowUpRecord[] = []
      const now = new Date().toISOString()

      studentIds.forEach(studentId => {
        const risk = this.getStudentRisk(studentId)
        const student = this.rawStudents.find(s => s.id === studentId)
        if (!student) return

        const followUp: FollowUpRecord = {
          id: generateId(),
          studentId,
          studentName: student.name,
          studentAvatar: student.avatar,
          riskLevel: risk?.level || 'medium',
          title: title || `${student.name} 学情跟进`,
          content,
          status: 'pending',
          createdBy: '张老师',
          createdAt: now,
          updatedAt: now
        }
        records.push(followUp)
      })

      this.followUps.unshift(...records)
      this.persistFollowUps()
      return records
    },

    // 更新跟进记录状态
    updateFollowUpStatus(id: string, status: FollowUpStatus): FollowUpRecord {
      const index = this.followUps.findIndex(f => f.id === id)
      if (index === -1) {
        throw new Error('跟进记录不存在')
      }

      this.followUps[index].status = status
      this.followUps[index].updatedAt = new Date().toISOString()
      if (status === 'resolved') {
        this.followUps[index].resolvedAt = new Date().toISOString()
      }

      this.persistFollowUps()
      return this.followUps[index]
    },

    // 标记跟进记录为已解决（联动重新计算风险）
    resolveFollowUp(id: string): FollowUpRecord {
      return this.updateFollowUpStatus(id, 'resolved')
    },

    // 获取学生的待跟进记录
    getStudentPendingFollowUps(studentId: string): FollowUpRecord[] {
      return this.followUps.filter(
        f => f.studentId === studentId && f.status !== 'resolved'
      )
    },

    // 获取跟进记录列表（带筛选）
    getFollowUpList(params?: {
      keyword?: string
      studentId?: string
      riskLevel?: RiskLevel
      status?: FollowUpStatus
    }): FollowUpRecord[] {
      let list = [...this.followUps]

      if (params?.keyword) {
        const keyword = params.keyword.toLowerCase()
        list = list.filter(
          f =>
            f.title.toLowerCase().includes(keyword) ||
            f.content.toLowerCase().includes(keyword) ||
            f.studentName.toLowerCase().includes(keyword)
        )
      }

      if (params?.studentId) {
        list = list.filter(f => f.studentId === params.studentId)
      }

      if (params?.riskLevel) {
        list = list.filter(f => f.riskLevel === params.riskLevel)
      }

      if (params?.status) {
        list = list.filter(f => f.status === params.status)
      }

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return list
    },

    // 删除跟进记录
    deleteFollowUp(id: string) {
      this.followUps = this.followUps.filter(f => f.id !== id)
      this.persistFollowUps()
    },

    // 刷新评估时间（触发 getters 重新计算）
    refreshEvaluation() {
      this.lastEvaluatedAt = new Date().toISOString()
      this._tick++
    },

    // 同步沟通记录状态到跟进（当沟通记录标记已解决时调用）
    syncCommunicationResolved(_studentId: string) {
      // 风险结果会基于最新的 communication 数据实时重算
      // 这里通过更新 tick 触发响应式重新计算
      this.lastEvaluatedAt = new Date().toISOString()
      this._tick++
    },

    // ===== 周快照相关 =====

    // 获取近 N 周风险趋势
    getWeeklyTrend(count: number): WeeklyRiskSnapshot[] {
      return buildWeeklyTrend(
        count,
        this.rawStudents,
        this.riskResults,
        this.followUps
      )
    },

    // 把本周实时结果固化为快照
    saveCurrentWeekSnapshot() {
      const weeks = buildRecentWeeks(1)
      const current = weeks[0]
      const overview = calculateRiskOverview(this.riskResults, this.followUps)
      const snapshot: WeeklyRiskSnapshot = {
        ...current,
        highCount: overview.highCount,
        mediumCount: overview.mediumCount,
        lowCount: overview.lowCount,
        total: overview.total,
        createdAt: new Date().toISOString()
      }
      const all = readAllSnapshots().filter(s => s.weekKey !== current.weekKey)
      all.push(snapshot)
      writeAllSnapshots(all.slice(-26))
      return snapshot
    },

    // 初始化：若没有任何快照，生成近 8 周的历史快照
    initWeeklySnapshots() {
      const existing = readAllSnapshots()
      if (existing.length > 0) return
      const weeks = buildRecentWeeks(8).filter(w => !w.isCurrent)
      const snapshots = weeks.map(w => buildFallbackSnapshot(w, this.rawStudents.length))
      writeAllSnapshots(snapshots)
    }
  },

  persist: {
    key: 'teacher-admin-risk',
    paths: ['threshold', 'groupOverrides']
  }
})
