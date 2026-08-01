/**
 * 统计数据相关 API
 */

import type {
  DashboardOverview,
  StudyTimeTrend,
  CompletionRateTrend,
  StudentProgressComparison,
  TimeRangeType
} from '@/types/statistics'
import type { Student } from '@/types/student'
import type { Homework, HomeworkSubmission } from '@/types/homework'
import { getMockData } from '@/mock'
import { delay } from '@/mock/utils'
import dayjs from 'dayjs'

// 获取首页概览数据
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  await delay()

  const mockData = getMockData()
  const students = mockData.students as Student[]
  const submissions = mockData.submissions as HomeworkSubmission[]

  // 活跃学生（最近7天有活动）
  const activeStudents = students.filter(s => {
    const lastActive = new Date(s.lastActiveDate)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return lastActive >= sevenDaysAgo && s.status === 'active'
  })

  // 今日提交数
  const today = new Date().toISOString().split('T')[0]
  const todaySubmissions = submissions.filter(s => s.submitTime?.startsWith(today))

  // 待批改作业数
  const pendingGrade = submissions.filter(s => s.status === 'submitted').length

  // 本周学习时长
  const weekStart = dayjs().startOf('week')
  const weeklyStudyTime = students.reduce((sum, s) => {
    const lastActive = dayjs(s.lastActiveDate)
    if (lastActive.isAfter(weekStart)) {
      return sum + Math.floor(Math.random() * 300) // 模拟本周学习时长
    }
    return sum
  }, 0)

  // 作业完成率
  const totalAssignments = submissions.length
  const completedAssignments = submissions.filter(s => s.status !== 'not_submitted').length
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0

  return {
    totalStudents: students.length,
    activeStudents: activeStudents.length,
    todaySubmissions: todaySubmissions.length,
    pendingGrade,
    weeklyStudyTime,
    completionRate: Math.round(completionRate * 10) / 10
  }
}

// 获取学习时长趋势
export const getStudyTimeTrend = async (timeRange: TimeRangeType): Promise<StudyTimeTrend> => {
  await delay()
  void timeRange

  const generateTrendData = (days: number) => {
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      data.push({
        date: date.format('YYYY-MM-DD'),
        value: Math.floor(Math.random() * 500) + 200
      })
    }
    return data
  }

  return {
    daily: generateTrendData(7),
    weekly: generateTrendData(12).map((item, index) => ({
      date: `第${index + 1}周`,
      value: item.value * 7
    })),
    monthly: generateTrendData(12).map((item, index) => ({
      date: dayjs()
        .subtract(11 - index, 'month')
        .format('YYYY-MM'),
      value: item.value * 30
    }))
  }
}

// 获取作业完成率趋势
export const getCompletionRateTrend = async (
  timeRange: TimeRangeType
): Promise<CompletionRateTrend> => {
  await delay()
  void timeRange

  const generateTrendData = (days: number) => {
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      data.push({
        date: date.format('YYYY-MM-DD'),
        value: Math.floor(Math.random() * 30) + 70
      })
    }
    return data
  }

  return {
    daily: generateTrendData(7),
    weekly: generateTrendData(12).map((item, index) => ({
      date: `第${index + 1}周`,
      value: item.value
    })),
    monthly: generateTrendData(12).map((item, index) => ({
      date: dayjs()
        .subtract(11 - index, 'month')
        .format('YYYY-MM'),
      value: item.value
    }))
  }
}

// 获取学生进度对比
export const getStudentProgressComparison = async (
  studentIds?: string[]
): Promise<StudentProgressComparison> => {
  await delay()

  const mockData = getMockData()
  let students = mockData.students as Student[]

  // 如果指定了学生ID，只返回这些学生
  if (studentIds && studentIds.length > 0) {
    students = students.filter(s => studentIds.includes(s.id))
  } else {
    // 否则返回前10个学生
    students = students.slice(0, 10)
  }

  return {
    students: students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      studyTime: s.totalStudyTime,
      completedHomework: s.completedHomework,
      averageScore: s.averageScore,
      attendanceRate: Math.floor(Math.random() * 30) + 70
    }))
  }
}

// 获取学科分布
export const getSubjectDistribution = async () => {
  await delay()

  const mockData = getMockData()
  const homeworks = mockData.homeworks as Homework[]

  const subjectMap = new Map<string, number>()

  homeworks.forEach(h => {
    const count = subjectMap.get(h.subject) || 0
    subjectMap.set(h.subject, count + 1)
  })

  return {
    subjects: Array.from(subjectMap.entries()).map(([name, value]) => ({
      name,
      value
    }))
  }
}

// 获取成绩分布
export const getScoreDistribution = async () => {
  await delay()

  const mockData = getMockData()
  const submissions = mockData.submissions as HomeworkSubmission[]

  const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== undefined)

  const ranges = [
    { range: '0-60', min: 0, max: 60, count: 0 },
    { range: '60-70', min: 60, max: 70, count: 0 },
    { range: '70-80', min: 70, max: 80, count: 0 },
    { range: '80-90', min: 80, max: 90, count: 0 },
    { range: '90-100', min: 90, max: 100, count: 0 }
  ]

  gradedSubmissions.forEach(s => {
    const score = s.score!
    const range = ranges.find(r => score >= r.min && score < r.max) || ranges[ranges.length - 1]
    range.count++
  })

  const total = gradedSubmissions.length

  return {
    ranges: ranges.map(r => ({
      range: r.range,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100 * 10) / 10 : 0
    }))
  }
}
