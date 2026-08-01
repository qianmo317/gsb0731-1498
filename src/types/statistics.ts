/**
 * 统计数据相关类型定义
 */

import type { TimeSeriesData, ChartDataPoint } from './common'

// 首页概览数据
export interface DashboardOverview {
  totalStudents: number
  activeStudents: number
  todaySubmissions: number
  pendingGrade: number
  weeklyStudyTime: number
  completionRate: number
}

// 学习时长趋势
export interface StudyTimeTrend {
  daily: TimeSeriesData[]
  weekly: TimeSeriesData[]
  monthly: TimeSeriesData[]
}

// 作业完成率趋势
export interface CompletionRateTrend {
  daily: TimeSeriesData[]
  weekly: TimeSeriesData[]
  monthly: TimeSeriesData[]
}

// 学生进度对比
export interface StudentProgressComparison {
  students: Array<{
    studentId: string
    studentName: string
    studyTime: number
    completedHomework: number
    averageScore: number
    attendanceRate: number
  }>
}

// 学科分布
export interface SubjectDistribution {
  subjects: ChartDataPoint[]
}

// 成绩分布
export interface ScoreDistribution {
  ranges: Array<{
    range: string
    count: number
    percentage: number
  }>
}

// 时间范围类型
export type TimeRangeType = 'daily' | 'weekly' | 'monthly'

// 统计查询参数
export interface StatisticsQueryParams {
  timeRange: TimeRangeType
  startDate?: string
  endDate?: string
  studentIds?: string[]
  subjects?: string[]
}

// 学生个人报告
export interface StudentReport {
  studentId: string
  studentName: string
  period: {
    startDate: string
    endDate: string
  }
  summary: {
    totalStudyTime: number
    completedHomework: number
    averageScore: number
    attendanceRate: number
    improvement: number // 进步幅度
  }
  studyTimeTrend: TimeSeriesData[]
  scoreTrend: TimeSeriesData[]
  subjectPerformance: Array<{
    subject: string
    score: number
    rank: number
  }>
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}
