/**
 * 风险预警 Store
 */

import { defineStore } from 'pinia'
import type {
  StudentRisk,
  RiskThresholdConfig,
  RiskLevel,
  RiskOverview,
  RiskWeeklySnapshot,
  RiskTrendPoint,
  StudentRiskProfile,
  GroupThresholdMap
} from '@/types/risk'
import type { CommunicationRecord } from '@/types/communication'
import * as riskApi from '@/api/risk'
import {
  DEFAULT_RISK_THRESHOLDS,
  evaluateAllStudentsRisk,
  calculateRiskOverview,
  sortByRiskLevel,
  generateHistoricalSnapshots,
  buildRiskTrend,
  buildStudentRiskProfile,
  getEffectiveThresholds
} from '@/utils/risk'

interface RiskState {
  thresholds: RiskThresholdConfig
  groupThresholds: GroupThresholdMap
  studentRisks: StudentRisk[]
  weeklySnapshots: RiskWeeklySnapshot[]
  communications: CommunicationRecord[]
  loading: boolean
  lastCalculatedAt: string | null
}

export const useRiskStore = defineStore('risk', {
  state: (): RiskState => ({
    thresholds: { ...DEFAULT_RISK_THRESHOLDS },
    groupThresholds: {},
    studentRisks: [],
    weeklySnapshots: [],
    communications: [],
    loading: false,
    lastCalculatedAt: null
  }),

  getters: {
    riskMap: state => {
      const map = new Map<string, StudentRisk>()
      state.studentRisks.forEach(r => map.set(r.studentId, r))
      return map
    },

    riskOverview: (state): RiskOverview => {
      return calculateRiskOverview(state.studentRisks)
    },

    highRiskStudents: state => {
      return state.studentRisks
        .filter(r => r.level === 'high')
        .sort(sortByRiskLevel)
    },

    mediumRiskStudents: state => {
      return state.studentRisks
        .filter(r => r.level === 'medium')
        .sort(sortByRiskLevel)
    },

    pendingFollowUpStudents: state => {
      return state.studentRisks
        .filter(r => r.hasUnresolvedCommunication || r.level === 'high')
        .sort(sortByRiskLevel)
    },

    getRiskByStudentId: state => {
      return (studentId: string): StudentRisk | undefined => {
        return state.studentRisks.find(r => r.studentId === studentId)
      }
    },

    allRisksSortedByScore: state => {
      return (order: 'ascending' | 'descending' = 'descending') => {
        const sorted = [...state.studentRisks].sort((a, b) => b.score - a.score)
        return order === 'descending' ? sorted : sorted.reverse()
      }
    },

    riskTrend: (state): RiskTrendPoint[] => {
      return buildRiskTrend(state.weeklySnapshots, state.studentRisks)
    },

    configuredGroupNames: (state): string[] => {
      return Object.keys(state.groupThresholds)
    }
  },

  actions: {
    ensureSnapshotsInitialized(totalStudents: number) {
      if (this.weeklySnapshots.length === 0) {
        this.weeklySnapshots = generateHistoricalSnapshots(totalStudents, 7)
      }
    },

    async calculateRisks() {
      this.loading = true
      try {
        const data = await riskApi.getRiskAssessmentData()
        this.communications = data.communications
        this.studentRisks = evaluateAllStudentsRisk(
          data.students,
          data.homeworks,
          data.submissions,
          data.communications,
          this.thresholds,
          this.groupThresholds
        )
        this.ensureSnapshotsInitialized(data.students.length)
        this.lastCalculatedAt = new Date().toISOString()
        return this.studentRisks
      } catch (error) {
        console.error('计算风险预警失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    updateThresholds(newThresholds: Partial<RiskThresholdConfig>) {
      this.thresholds = {
        homework: { ...this.thresholds.homework, ...newThresholds.homework },
        activity: { ...this.thresholds.activity, ...newThresholds.activity },
        score: { ...this.thresholds.score, ...newThresholds.score },
        communication: {
          ...this.thresholds.communication,
          ...newThresholds.communication
        }
      }
      return this.calculateRisks()
    },

    resetThresholds() {
      this.thresholds = { ...DEFAULT_RISK_THRESHOLDS }
      return this.calculateRisks()
    },

    getGroupEffectiveThresholds(group: string) {
      return getEffectiveThresholds(this.thresholds, this.groupThresholds, group)
    },

    getGroupOverride(group: string): Partial<RiskThresholdConfig> | undefined {
      return this.groupThresholds[group]
    },

    updateGroupThresholds(group: string, override: Partial<RiskThresholdConfig>) {
      const cleaned: Partial<RiskThresholdConfig> = {}
      if (override.homework) cleaned.homework = { ...override.homework }
      if (override.activity) cleaned.activity = { ...override.activity }
      if (override.score) cleaned.score = { ...override.score }
      if (override.communication) cleaned.communication = { ...override.communication }
      this.groupThresholds = {
        ...this.groupThresholds,
        [group]: cleaned
      }
      return this.calculateRisks()
    },

    removeGroupThresholds(group: string) {
      if (!this.groupThresholds[group]) return
      const next = { ...this.groupThresholds }
      delete next[group]
      this.groupThresholds = next
      return this.calculateRisks()
    },

    getStudentsByRiskLevel(level: RiskLevel): StudentRisk[] {
      return this.studentRisks
        .filter(r => r.level === level)
        .sort(sortByRiskLevel)
    },

    filterByRiskLevel(level?: RiskLevel): StudentRisk[] {
      if (!level) return [...this.studentRisks].sort(sortByRiskLevel)
      return this.getStudentsByRiskLevel(level)
    },

    getStudentRiskProfile(studentId: string): StudentRiskProfile | null {
      const risk = this.studentRisks.find(r => r.studentId === studentId)
      if (!risk) return null
      return buildStudentRiskProfile(
        { id: studentId, name: risk.studentName },
        this.studentRisks,
        this.communications
      )
    }
  },

  persist: {
    key: 'teacher-admin-risk',
    paths: ['thresholds', 'groupThresholds', 'weeklySnapshots']
  }
})
