/**
 * Mock 数据入口
 * 统一管理所有 Mock 数据
 */

import { mockStudents } from './student'
import { mockHomeworks, mockSubmissions } from './homework'
import { mockCommunications } from './communication'

// 导出所有 Mock 数据
export { mockStudents, mockHomeworks, mockSubmissions, mockCommunications }

export const isMockEnabled = (): boolean => {
  // 未配置时默认开启（本项目为纯前端演示）
  return import.meta.env.VITE_APP_MOCK_ENABLED !== 'false'
}

// 初始化 Mock 数据到 localStorage
export const initMockData = () => {
  if (!isMockEnabled()) return

  const STORAGE_KEY = 'teacher-admin-mock-data'

  // 检查是否已经初始化
  const existingData = localStorage.getItem(STORAGE_KEY)
  if (existingData) {
    return
  }

  // 初始化数据
  const mockData = {
    students: mockStudents,
    homeworks: mockHomeworks,
    submissions: mockSubmissions,
    communications: mockCommunications,
    initialized: true,
    timestamp: new Date().toISOString()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData))
  if (import.meta.env.DEV) {
    console.log('Mock 数据已初始化')
  }
}

// 获取 Mock 数据
export const getMockData = (): any => {
  if (!isMockEnabled()) {
    throw new Error('Mock 数据未启用')
  }

  const STORAGE_KEY = 'teacher-admin-mock-data'
  const data = localStorage.getItem(STORAGE_KEY)

  if (!data) {
    initMockData()
    return getMockData()
  }

  return JSON.parse(data)
}

// 更新 Mock 数据
export const updateMockData = (key: string, value: any) => {
  if (!isMockEnabled()) {
    throw new Error('Mock 数据未启用')
  }

  const STORAGE_KEY = 'teacher-admin-mock-data'
  const data = getMockData()
  data[key] = value
  data.timestamp = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 重置 Mock 数据
export const resetMockData = () => {
  if (!isMockEnabled()) return

  const STORAGE_KEY = 'teacher-admin-mock-data'
  localStorage.removeItem(STORAGE_KEY)
  initMockData()
  if (import.meta.env.DEV) {
    console.log('Mock 数据已重置')
  }
}
