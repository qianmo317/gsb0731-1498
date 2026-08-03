/**
 * 作业相关 API
 */

import dayjs from 'dayjs'
import type {
  Homework,
  HomeworkSubmission,
  HomeworkFilterParams,
  HomeworkStatus,
  GradeFormData
} from '@/types/homework'
import type { PaginationParams, PaginationResponse } from '@/types/common'
import { getMockData, updateMockData } from '@/mock'
import { delay, paginate } from '@/mock/utils'

const isHomeworkPastDue = (homework: Homework): boolean => {
  const dueDate = dayjs(homework.dueDate)
  if (!dueDate.isValid()) return false
  return dueDate.isBefore(dayjs())
}

const getEffectiveHomeworkStatus = (homework: Homework): HomeworkStatus => {
  if (homework.gradedCount === homework.totalCount) {
    return 'completed'
  }
  if (isHomeworkPastDue(homework) && homework.submittedCount < homework.totalCount) {
    return 'overdue'
  }
  if (homework.submittedCount > 0 || homework.gradedCount > 0) {
    return 'in_progress'
  }
  return 'pending'
}

const withEffectiveStatus = (homework: Homework): Homework => {
  return {
    ...homework,
    status: getEffectiveHomeworkStatus(homework)
  }
}

export const getHomeworkList = async (
  params: PaginationParams & HomeworkFilterParams
): Promise<PaginationResponse<Homework>> => {
  await delay()

  const mockData = getMockData()
  let homeworks = (mockData.homeworks as Homework[]).map(withEffectiveStatus)

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

  homeworks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return paginate(homeworks, params.page, params.pageSize)
}

export const getHomeworkDetail = async (id: string): Promise<Homework> => {
  await delay()

  const mockData = getMockData()
  const homework = (mockData.homeworks as Homework[]).find(h => h.id === id)

  if (!homework) {
    throw new Error('作业不存在')
  }

  return withEffectiveStatus(homework)
}

export const getHomeworkSubmissions = async (
  homeworkId: string,
  params?: { status?: string }
): Promise<HomeworkSubmission[]> => {
  await delay()

  const mockData = getMockData()
  let submissions = (mockData.submissions as HomeworkSubmission[]).filter(
    s => s.homeworkId === homeworkId
  )

  if (params?.status) {
    submissions = submissions.filter(s => s.status === params.status)
  }

  submissions.sort((a, b) => {
    if (!a.submitTime) return 1
    if (!b.submitTime) return -1
    return new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime()
  })

  return submissions
}

export const getSubmissionDetail = async (id: string): Promise<HomeworkSubmission> => {
  await delay()

  const mockData = getMockData()
  const submission = (mockData.submissions as HomeworkSubmission[]).find(s => s.id === id)

  if (!submission) {
    throw new Error('提交记录不存在')
  }

  return submission
}

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

  const homework = (mockData.homeworks as Homework[]).find(
    h => h.id === submissions[index].homeworkId
  )
  if (homework) {
    const homeworkSubmissions = submissions.filter(s => s.homeworkId === homework.id)
    const gradedSubmissions = homeworkSubmissions.filter(s => s.status === 'graded')

    homework.gradedCount = gradedSubmissions.length
    homework.averageScore =
      gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
    homework.excellentCount = gradedSubmissions.filter(s => s.isExcellent).length

    if (homework.gradedCount === homework.totalCount) {
      homework.status = 'completed'
    } else if (homework.gradedCount > 0) {
      homework.status = 'in_progress'
    }

    updateMockData('homeworks', mockData.homeworks)
  }

  return submissions[index]
}

export const batchGradeHomework = async (
  submissionIds: string[],
  data: GradeFormData
): Promise<void> => {
  await delay()

  for (const id of submissionIds) {
    await gradeHomework(id, data)
  }
}

export const getPendingGradeCount = async (): Promise<number> => {
  await delay()

  const mockData = getMockData()
  const submissions = mockData.submissions as HomeworkSubmission[]

  return submissions.filter(s => s.status === 'submitted').length
}
