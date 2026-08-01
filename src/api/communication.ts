/**
 * 沟通记录相关 API
 */

import type {
  CommunicationRecord,
  CommunicationFilterParams,
  CommunicationFormData
} from '@/types/communication'
import type { PaginationParams, PaginationResponse } from '@/types/common'
import { getMockData, updateMockData } from '@/mock'
import { delay, paginate, generateId } from '@/mock/utils'

// 获取沟通记录列表
export const getCommunicationList = async (
  params: PaginationParams & CommunicationFilterParams
): Promise<PaginationResponse<CommunicationRecord>> => {
  await delay()

  const mockData = getMockData()
  let communications = mockData.communications as CommunicationRecord[]

  // 筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    communications = communications.filter(
      c =>
        c.title.toLowerCase().includes(keyword) ||
        c.content.toLowerCase().includes(keyword) ||
        c.studentName.toLowerCase().includes(keyword)
    )
  }

  if (params.studentId) {
    communications = communications.filter(c => c.studentId === params.studentId)
  }

  if (params.type) {
    communications = communications.filter(c => c.type === params.type)
  }

  if (params.method) {
    communications = communications.filter(c => c.method === params.method)
  }

  if (params.isImportant !== undefined) {
    communications = communications.filter(c => c.isImportant === params.isImportant)
  }

  if (params.isResolved !== undefined) {
    communications = communications.filter(c => c.isResolved === params.isResolved)
  }

  if (params.dateRange && params.dateRange.length === 2) {
    const [start, end] = params.dateRange
    communications = communications.filter(c => {
      const createdAt = new Date(c.createdAt)
      return createdAt >= new Date(start) && createdAt <= new Date(end)
    })
  }

  // 按创建时间倒序排序
  communications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return paginate(communications, params.page, params.pageSize)
}

// 获取沟通记录详情
export const getCommunicationDetail = async (id: string): Promise<CommunicationRecord> => {
  await delay()

  const mockData = getMockData()
  const communication = (mockData.communications as CommunicationRecord[]).find(c => c.id === id)

  if (!communication) {
    throw new Error('沟通记录不存在')
  }

  return communication
}

// 创建沟通记录
export const createCommunication = async (
  data: CommunicationFormData
): Promise<CommunicationRecord> => {
  await delay()

  const mockData = getMockData()
  const communications = mockData.communications as CommunicationRecord[]
  const students = mockData.students

  // 获取学生信息
  const student = students.find((s: any) => s.id === data.studentId)
  if (!student) {
    throw new Error('学生不存在')
  }

  const newCommunication: CommunicationRecord = {
    id: generateId(),
    studentId: data.studentId,
    studentName: student.name,
    studentAvatar: student.avatar,
    type: data.type,
    method: data.method,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    isImportant: data.isImportant,
    isResolved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: '张老师'
  }

  communications.push(newCommunication)
  updateMockData('communications', communications)

  return newCommunication
}

// 更新沟通记录
export const updateCommunication = async (
  id: string,
  data: Partial<CommunicationFormData>
): Promise<CommunicationRecord> => {
  await delay()

  const mockData = getMockData()
  const communications = mockData.communications as CommunicationRecord[]
  const index = communications.findIndex(c => c.id === id)

  if (index === -1) {
    throw new Error('沟通记录不存在')
  }

  communications[index] = {
    ...communications[index],
    ...data,
    updatedAt: new Date().toISOString()
  }

  updateMockData('communications', communications)

  return communications[index]
}

// 删除沟通记录
export const deleteCommunication = async (id: string): Promise<void> => {
  await delay()

  const mockData = getMockData()
  const communications = mockData.communications as CommunicationRecord[]
  const index = communications.findIndex(c => c.id === id)

  if (index === -1) {
    throw new Error('沟通记录不存在')
  }

  communications.splice(index, 1)
  updateMockData('communications', communications)
}

// 标记为已解决
export const markAsResolved = async (id: string): Promise<CommunicationRecord> => {
  await delay()

  const mockData = getMockData()
  const communications = mockData.communications as CommunicationRecord[]
  const index = communications.findIndex(c => c.id === id)

  if (index === -1) {
    throw new Error('沟通记录不存在')
  }

  communications[index].isResolved = true
  communications[index].updatedAt = new Date().toISOString()

  updateMockData('communications', communications)

  return communications[index]
}

// 标记为重要
export const markAsImportant = async (id: string, isImportant: boolean): Promise<CommunicationRecord> => {
  await delay()

  const mockData = getMockData()
  const communications = mockData.communications as CommunicationRecord[]
  const index = communications.findIndex(c => c.id === id)

  if (index === -1) {
    throw new Error('沟通记录不存在')
  }

  communications[index].isImportant = isImportant
  communications[index].updatedAt = new Date().toISOString()

  updateMockData('communications', communications)

  return communications[index]
}
