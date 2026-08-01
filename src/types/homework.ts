/**
 * 作业相关类型定义
 */

// 作业状态
export type HomeworkStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

// 提交状态
export type SubmissionStatus = 'not_submitted' | 'submitted' | 'graded'

// 作业信息
export interface Homework {
  id: string
  title: string
  description: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  totalScore: number
  dueDate: string
  status: HomeworkStatus
  assignedStudents: string[] // 学生ID列表
  submittedCount: number
  gradedCount: number
  totalCount: number
  averageScore: number
  excellentCount: number // 优秀作业数
  createdAt: string
  updatedAt: string
}

// 作业提交
export interface HomeworkSubmission {
  id: string
  homeworkId: string
  studentId: string
  studentName: string
  studentAvatar?: string
  status: SubmissionStatus
  content: string
  attachments?: string[]
  submitTime?: string
  score?: number
  feedback?: string
  isExcellent: boolean // 是否优秀
  gradedAt?: string
  gradedBy?: string
}

// 作业筛选参数
export interface HomeworkFilterParams {
  keyword?: string
  status?: HomeworkStatus
  subject?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  dateRange?: [string, string]
}

// 作业表单数据
export interface HomeworkFormData {
  title: string
  description: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  totalScore: number
  dueDate: string
  assignedStudents: string[]
}

// 批改表单数据
export interface GradeFormData {
  score: number
  feedback: string
  isExcellent: boolean
}

// 作业统计
export interface HomeworkStatistics {
  totalHomework: number
  pendingGrade: number
  completionRate: number
  averageScore: number
  excellentRate: number
  onTimeRate: number
  submissionTrend: Array<{
    date: string
    count: number
  }>
  scoreDistribution: Array<{
    range: string
    count: number
  }>
}
