/**
 * 学生相关类型定义
 */

import type { RiskLevel } from './risk'

// 学生状态
export type StudentStatus = 'active' | 'inactive' | 'graduated'

// 学生等级
export type StudentLevel = 'excellent' | 'good' | 'average' | 'poor'

// 学生信息
export interface Student {
  id: string
  name: string
  avatar?: string
  gender: 'male' | 'female'
  age: number
  grade: string
  phone: string
  email?: string
  parentPhone: string
  parentName: string
  status: StudentStatus
  level: StudentLevel
  tags: string[]
  group: string
  enrollDate: string
  totalStudyTime: number // 总学习时长（分钟）
  completedHomework: number // 已完成作业数
  totalHomework: number // 总作业数
  averageScore: number // 平均分
  lastActiveDate: string // 最后活跃时间
  notes?: string // 备注
  createdAt: string
  updatedAt: string
}

// 学生筛选参数
export interface StudentFilterParams {
  keyword?: string
  status?: StudentStatus
  level?: StudentLevel
  group?: string
  tags?: string[]
  grade?: string
  riskLevel?: RiskLevel // 风险等级筛选，由前端风险预警结果过滤
}

// 学生表单数据
export interface StudentFormData {
  name: string
  gender: 'male' | 'female'
  age: number
  grade: string
  phone: string
  email?: string
  parentPhone: string
  parentName: string
  status: StudentStatus
  level: StudentLevel
  tags: string[]
  group: string
  enrollDate: string
  notes?: string
}

// 学生学习记录
export interface StudentStudyRecord {
  id: string
  studentId: string
  date: string
  duration: number // 学习时长（分钟）
  subject: string
  content: string
  notes?: string
}

// 学生统计数据
export interface StudentStatistics {
  totalStudents: number
  activeStudents: number
  newStudentsThisMonth: number
  averageStudyTime: number
  levelDistribution: {
    excellent: number
    good: number
    average: number
    poor: number
  }
  gradeDistribution: Record<string, number>
}
