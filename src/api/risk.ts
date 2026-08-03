/**
 * 风险预警相关 API
 */

import type {
  RiskThresholdConfig,
  StudentRiskResult,
  FollowUpRecord,
  FollowUpFormData,
  FollowUpStatus,
  RiskOverview,
  RiskLevel
} from '@/types/risk'
import type { Student } from '@/types/student'
import type { Homework } from '@/types/homework'
import { getMockData } from '@/mock'
import { delay, paginate } from '@/mock/utils'
import {
  DEFAULT_RISK_THRESHOLD,
  evaluateAllStudentRisks,
  evaluateStudentRisk,
  calculateRiskOverview,
  isHomeworkOverdue
} from '@/utils/risk'
import dayjs from 'dayjs'
import type { PaginationParams, PaginationResponse } from '@/types/common'

// 获取阈值配置
export const getRiskThreshold = async (): Promise<RiskThresholdConfig> => {
  await delay(100)
  const stored = localStorage.getItem('teacher-admin-risk')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.threshold) {
        return { ...DEFAULT_RISK_THRESHOLD, ...parsed.threshold }
      }
    } catch (error) {
      console.error('读取阈值配置失败:', error)
    }
  }
  return { ...DEFAULT_RISK_THRESHOLD }
}

// 保存阈值配置
export const saveRiskThreshold = async (
  threshold: RiskThresholdConfig
): Promise<RiskThresholdConfig> => {
  await delay(100)
  return threshold
}

// 获取所有学生风险评估结果
export const getAllRiskResults = async (
  threshold: RiskThresholdConfig
): Promise<StudentRiskResult[]> => {
  await delay(100)
  const mockData = getMockData()
  const students = mockData.students as Student[]
  const homeworks = mockData.homeworks
  const submissions = mockData.submissions
  const communications = mockData.communications

  const followUpsStr = localStorage.getItem('teacher-admin-followups')
  const followUps = followUpsStr ? JSON.parse(followUpsStr) : []

  return evaluateAllStudentRisks(
    students,
    homeworks,
    submissions,
    communications,
    followUps,
    threshold,
    dayjs()
  )
}

// 获取单个学生风险评估
export const getStudentRisk = async (
  studentId: string,
  threshold: RiskThresholdConfig
): Promise<StudentRiskResult | null> => {
  await delay(100)
  const mockData = getMockData()
  const student = (mockData.students as Student[]).find(s => s.id === studentId)
  if (!student) return null

  const followUpsStr = localStorage.getItem('teacher-admin-followups')
  const followUps = followUpsStr ? JSON.parse(followUpsStr) : []

  return evaluateStudentRisk(
    student,
    mockData.homeworks,
    mockData.submissions,
    mockData.communications,
    followUps,
    threshold,
    dayjs()
  )
}

// 获取风险概览
export const getRiskOverview = async (
  threshold: RiskThresholdConfig
): Promise<RiskOverview> => {
  await delay(100)
  const results = await getAllRiskResults(threshold)
  const followUpsStr = localStorage.getItem('teacher-admin-followups')
  const followUps = followUpsStr ? JSON.parse(followUpsStr) : []
  return calculateRiskOverview(results, followUps)
}

// 获取跟进记录列表（分页）
export const getFollowUpList = async (
  params: PaginationParams & {
    keyword?: string
    studentId?: string
    riskLevel?: RiskLevel
    status?: FollowUpStatus
  }
): Promise<PaginationResponse<FollowUpRecord>> => {
  await delay(100)
  const followUpsStr = localStorage.getItem('teacher-admin-followups')
  let followUps: FollowUpRecord[] = followUpsStr ? JSON.parse(followUpsStr) : []

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    followUps = followUps.filter(
      f =>
        f.title.toLowerCase().includes(keyword) ||
        f.content.toLowerCase().includes(keyword) ||
        f.studentName.toLowerCase().includes(keyword)
    )
  }

  if (params.studentId) {
    followUps = followUps.filter(f => f.studentId === params.studentId)
  }

  if (params.riskLevel) {
    followUps = followUps.filter(f => f.riskLevel === params.riskLevel)
  }

  if (params.status) {
    followUps = followUps.filter(f => f.status === params.status)
  }

  followUps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return paginate(followUps, params.page, params.pageSize)
}

// 创建跟进记录
export const createFollowUp = async (
  data: FollowUpFormData,
  threshold: RiskThresholdConfig
): Promise<FollowUpRecord> => {
  await delay(100)
  const mockData = getMockData()
  const student = (mockData.students as Student[]).find(s => s.id === data.studentId)
  if (!student) {
    throw new Error('学生不存在')
  }

  const risk = await getStudentRisk(data.studentId, threshold)
  const now = new Date().toISOString()
  const followUp: FollowUpRecord = {
    id: crypto.randomUUID(),
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

  const followUpsStr = localStorage.getItem('teacher-admin-followups')
  const followUps: FollowUpRecord[] = followUpsStr ? JSON.parse(followUpsStr) : []
  followUps.unshift(followUp)
  localStorage.setItem('teacher-admin-followups', JSON.stringify(followUps))

  return followUp
}

// 批量创建跟进记录
export const batchCreateFollowUps = async (
  studentIds: string[],
  title: string,
  content: string,
  threshold: RiskThresholdConfig
): Promise<FollowUpRecord[]> => {
  await delay(200)
  const mockData = getMockData()
  const students = mockData.students as Student[]
  const followUpsStr = localStorage.getItem('teacher-admin-followups')
  const followUps: FollowUpRecord[] = followUpsStr ? JSON.parse(followUpsStr) : []
  const now = new Date().toISOString()
  const newRecords: FollowUpRecord[] = []

  for (const studentId of studentIds) {
    const student = students.find(s => s.id === studentId)
    if (!student) continue
    const risk = await getStudentRisk(studentId, threshold)
    newRecords.push({
      id: crypto.randomUUID(),
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
    })
  }

  followUps.unshift(...newRecords)
  localStorage.setItem('teacher-admin-followups', JSON.stringify(followUps))
  return newRecords
}

// 更新跟进记录状态
export const updateFollowUpStatus = async (
  id: string,
  status: FollowUpStatus
): Promise<FollowUpRecord> => {
  await delay(100)
  const followUpsStr = localStorage.getItem('teacher-admin-followups')
  const followUps: FollowUpRecord[] = followUpsStr ? JSON.parse(followUpsStr) : []
  const index = followUps.findIndex(f => f.id === id)
  if (index === -1) {
    throw new Error('跟进记录不存在')
  }

  followUps[index].status = status
  followUps[index].updatedAt = new Date().toISOString()
  if (status === 'resolved') {
    followUps[index].resolvedAt = new Date().toISOString()
  }

  localStorage.setItem('teacher-admin-followups', JSON.stringify(followUps))
  return followUps[index]
}

// 删除跟进记录
export const deleteFollowUp = async (id: string): Promise<void> => {
  await delay(100)
  const followUpsStr = localStorage.getItem('teacher-admin-followups')
  const followUps: FollowUpRecord[] = followUpsStr ? JSON.parse(followUpsStr) : []
  const filtered = followUps.filter(f => f.id !== id)
  localStorage.setItem('teacher-admin-followups', JSON.stringify(filtered))
}

// 检查作业是否逾期（统一口径）
export const checkHomeworkOverdue = async (homeworkId: string): Promise<boolean> => {
  await delay(50)
  const mockData = getMockData()
  const homework = (mockData.homeworks as Homework[]).find(h => h.id === homeworkId)
  if (!homework) return false
  return isHomeworkOverdue(homework, dayjs())
}
