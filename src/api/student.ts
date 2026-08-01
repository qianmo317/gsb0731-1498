/**
 * 学生相关 API
 */

import type {
  Student,
  StudentFilterParams,
  StudentFormData,
  StudentStudyRecord
} from '@/types/student'
import type { PaginationParams, PaginationResponse } from '@/types/common'
import { getMockData, updateMockData } from '@/mock'
import { generateStudyRecords } from '@/mock/student'
import { delay, paginate, generateId } from '@/mock/utils'

// 获取学生列表
export const getStudentList = async (
  params: PaginationParams & StudentFilterParams
): Promise<PaginationResponse<Student>> => {
  await delay()

  const mockData = getMockData()
  let students = mockData.students as Student[]

  // 筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    students = students.filter(
      s =>
        s.name.toLowerCase().includes(keyword) ||
        s.phone.includes(keyword) ||
        s.parentPhone.includes(keyword)
    )
  }

  if (params.status) {
    students = students.filter(s => s.status === params.status)
  }

  if (params.level) {
    students = students.filter(s => s.level === params.level)
  }

  if (params.group) {
    students = students.filter(s => s.group === params.group)
  }

  if (params.grade) {
    students = students.filter(s => s.grade === params.grade)
  }

  if (params.tags && params.tags.length > 0) {
    students = students.filter(s => params.tags!.some(tag => s.tags.includes(tag)))
  }

  // 确保有默认的分页参数
  const page = params.page || 1
  const pageSize = params.pageSize || 20

  return paginate(students, page, pageSize)
}

// 获取学生详情
export const getStudentDetail = async (id: string): Promise<Student> => {
  await delay()

  const mockData = getMockData()
  const student = (mockData.students as Student[]).find(s => s.id === id)

  if (!student) {
    throw new Error('学生不存在')
  }

  return student
}

// 创建学生
export const createStudent = async (data: StudentFormData): Promise<Student> => {
  await delay()

  const mockData = getMockData()
  const students = mockData.students as Student[]

  const newStudent: Student = {
    id: generateId(),
    ...data,
    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 100)}`,
    totalStudyTime: 0,
    completedHomework: 0,
    totalHomework: 0,
    averageScore: 0,
    lastActiveDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  students.push(newStudent)
  updateMockData('students', students)

  return newStudent
}

// 更新学生
export const updateStudent = async (id: string, data: Partial<StudentFormData>): Promise<Student> => {
  await delay()

  const mockData = getMockData()
  const students = mockData.students as Student[]
  const index = students.findIndex(s => s.id === id)

  if (index === -1) {
    throw new Error('学生不存在')
  }

  students[index] = {
    ...students[index],
    ...data,
    updatedAt: new Date().toISOString()
  }

  updateMockData('students', students)

  return students[index]
}

// 删除学生
export const deleteStudent = async (id: string): Promise<void> => {
  await delay()

  const mockData = getMockData()
  const students = mockData.students as Student[]
  const index = students.findIndex(s => s.id === id)

  if (index === -1) {
    throw new Error('学生不存在')
  }

  students.splice(index, 1)
  updateMockData('students', students)
}

// 批量删除学生
export const batchDeleteStudents = async (ids: string[]): Promise<void> => {
  await delay()

  const mockData = getMockData()
  let students = mockData.students as Student[]
  students = students.filter(s => !ids.includes(s.id))
  updateMockData('students', students)
}

// 获取学生学习记录
export const getStudentStudyRecords = async (
  studentId: string,
  params: PaginationParams
): Promise<PaginationResponse<StudentStudyRecord>> => {
  await delay()

  // 生成学习记录
  const records = generateStudyRecords(studentId, 50)

  // 按日期倒序排序
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return paginate(records, params.page, params.pageSize)
}

// 更新学生标签
export const updateStudentTags = async (id: string, tags: string[]): Promise<Student> => {
  await delay()

  const mockData = getMockData()
  const students = mockData.students as Student[]
  const index = students.findIndex(s => s.id === id)

  if (index === -1) {
    throw new Error('学生不存在')
  }

  students[index].tags = tags
  students[index].updatedAt = new Date().toISOString()

  updateMockData('students', students)

  return students[index]
}
