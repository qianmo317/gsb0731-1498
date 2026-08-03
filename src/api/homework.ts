/**
 * 作业相关 API
 */

import type {
  Homework,
  HomeworkSubmission,
  HomeworkFilterParams,
  GradeFormData
} from '@/types/homework'
import type { PaginationParams, PaginationResponse } from '@/types/common'
import { getMockData, updateMockData } from '@/mock'
import { delay, paginate } from '@/mock/utils'
import { getHomeworkStatus, withRealtimeStatus } from '@/utils/homework'

// 获取作业列表
export const getHomeworkList = async (
  params: PaginationParams & HomeworkFilterParams
): Promise<PaginationResponse<Homework>> => {
  await delay()

  const mockData = getMockData()
  let homeworks = mockData.homeworks as Homework[]

  // 统一按截止时间实时计算状态（不使用数据里写死的 status）
  homeworks = withRealtimeStatus(homeworks)

  // 筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    homeworks = homeworks.filter(
      h => h.title.toLowerCase().includes(keyword) || h.description.toLowerCase().includes(keyword)
    )
  }

  if (params.status) {
    homeworks = homeworks.filter(h => h.status === params.status)
  }

  if (params.subject) {
    homeworks = homeworks.filter(h => h.subject === params.subject)
  }

  if (params.difficulty) {
    homeworks = homeworks.filter(h => h.difficulty === params.difficulty)
  }

  if (params.dateRange && params.dateRange.length === 2) {
    const [start, end] = params.dateRange
    homeworks = homeworks.filter(h => {
      const dueDate = new Date(h.dueDate)
      return dueDate >= new Date(start) && dueDate <= new Date(end)
    })
  }

  // 按创建时间倒序排序
  homeworks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return paginate(homeworks, params.page, params.pageSize)
}

// 获取作业详情
export const getHomeworkDetail = async (id: string): Promise<Homework> => {
  await delay()

  const mockData = getMockData()
  const homework = (mockData.homeworks as Homework[]).find(h => h.id === id)

  if (!homework) {
    throw new Error('作业不存在')
  }

  // 统一按截止时间实时计算状态
  return { ...homework, status: getHomeworkStatus(homework) }
}

// 获取作业提交列表
export const getHomeworkSubmissions = async (
  homeworkId: string,
  params?: { status?: string }
): Promise<HomeworkSubmission[]> => {
  await delay()

  const mockData = getMockData()
  let submissions = (mockData.submissions as HomeworkSubmission[]).filter(
    s => s.homeworkId === homeworkId
  )

  // 筛选状态
  if (params?.status) {
    submissions = submissions.filter(s => s.status === params.status)
  }

  // 按提交时间倒序排序
  submissions.sort((a, b) => {
    if (!a.submitTime) return 1
    if (!b.submitTime) return -1
    return new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime()
  })

  return submissions
}

// 获取单个提交详情
export const getSubmissionDetail = async (id: string): Promise<HomeworkSubmission> => {
  await delay()

  const mockData = getMockData()
  const submission = (mockData.submissions as HomeworkSubmission[]).find(s => s.id === id)

  if (!submission) {
    throw new Error('提交记录不存在')
  }

  return submission
}

// 批改作业
export const gradeHomework = async (
  submissionId: string,
  data: GradeFormData
): Promise<HomeworkSubmission> => {
  await delay()

  const mockData = getMockData()
  const submissions = mockData.submissions as HomeworkSubmission[]
  const index = submissions.findIndex(s => s.id === submissionId)

  if (index === -1) {
    throw new Error('提交记录不存在')
  }

  // 更新提交记录
  submissions[index] = {
    ...submissions[index],
    status: 'graded',
    score: data.score,
    feedback: data.feedback,
    isExcellent: data.isExcellent,
    gradedAt: new Date().toISOString(),
    gradedBy: '张老师'
  }

  updateMockData('submissions', submissions)

  // 更新作业统计
  const homework = (mockData.homeworks as Homework[]).find(
    h => h.id === submissions[index].homeworkId
  )
  if (homework) {
    const homeworkSubmissions = submissions.filter(s => s.homeworkId === homework.id)
    const gradedSubmissions = homeworkSubmissions.filter(s => s.status === 'graded')
    const submittedSubmissions = homeworkSubmissions.filter(s => s.status !== 'not_submitted')

    homework.gradedCount = gradedSubmissions.length
    homework.submittedCount = submittedSubmissions.length
    homework.averageScore =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
        : 0
    homework.excellentCount = gradedSubmissions.filter(s => s.isExcellent).length

    // 状态统一按截止时间 + 提交/批改情况实时计算
    homework.status = getHomeworkStatus(homework)

    updateMockData('homeworks', mockData.homeworks)
  }

  return submissions[index]
}

// 批量批改作业
export const batchGradeHomework = async (
  submissionIds: string[],
  data: GradeFormData
): Promise<void> => {
  await delay()

  for (const id of submissionIds) {
    await gradeHomework(id, data)
  }
}

// 获取待批改作业数量
export const getPendingGradeCount = async (): Promise<number> => {
  await delay()

  const mockData = getMockData()
  const submissions = mockData.submissions as HomeworkSubmission[]

  return submissions.filter(s => s.status === 'submitted').length
}
