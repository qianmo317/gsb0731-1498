/**
 * 沟通记录相关类型定义
 */

// 沟通类型
export type CommunicationType = 'question' | 'feedback' | 'parent' | 'other'

// 沟通方式
export type CommunicationMethod = 'online' | 'phone' | 'offline' | 'wechat'

// 沟通记录
export interface CommunicationRecord {
  id: string
  studentId: string
  studentName: string
  studentAvatar?: string
  type: CommunicationType
  method: CommunicationMethod
  title: string
  content: string
  attachments?: string[]
  tags?: string[]
  isImportant: boolean
  isResolved: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

// 沟通记录筛选参数
export interface CommunicationFilterParams {
  keyword?: string
  studentId?: string
  type?: CommunicationType
  method?: CommunicationMethod
  isImportant?: boolean
  isResolved?: boolean
  dateRange?: [string, string]
}

// 沟通记录表单数据
export interface CommunicationFormData {
  studentId: string
  type: CommunicationType
  method: CommunicationMethod
  title: string
  content: string
  tags?: string[]
  isImportant: boolean
}

// 沟通统计
export interface CommunicationStatistics {
  totalRecords: number
  unresolvedCount: number
  importantCount: number
  typeDistribution: Record<CommunicationType, number>
  methodDistribution: Record<CommunicationMethod, number>
  trendData: Array<{
    date: string
    count: number
  }>
}
