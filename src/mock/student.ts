/**
 * 学生 Mock 数据
 */

import type { Student, StudentStudyRecord } from '@/types/student'
import {
  generateId,
  randomChineseName,
  randomPhone,
  randomEmail,
  randomAvatar,
  randomPick,
  randomPickMultiple,
  randomInt,
  randomFloat,
  randomDate,
  randomDateOnly,
  randomBoolean
} from './utils'

// 真实的中文姓名库
const REAL_NAMES = [
  '张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵敏', '黄磊', '周杰', '吴昊',
  '徐婷', '孙浩', '马超', '朱丽', '胡军', '郭敏', '林峰', '何洁', '高鹏', '梁静',
  '宋涛', '郑伟', '谢娜', '韩梅', '唐磊', '冯静', '于洋', '董浩', '袁芳', '潘杰',
  '程敏', '曹磊', '彭涛', '吕娜', '苏洋', '卢伟', '蒋静', '蔡浩', '贾敏', '丁磊',
  '魏娜', '薛洋', '叶伟', '阎静', '余浩', '潘敏', '杜磊', '戴娜', '夏洋', '钟伟'
]

// 学生标签
const STUDENT_TAGS = ['认真', '活跃', '需关注', '进步快', '基础薄弱', '自律', '有潜力', '善于思考', '乐于助人']

// 学生分组
const STUDENT_GROUPS = ['A组', 'B组', 'C组', 'D组']

// 年级
const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三']

// 学生特长
const TALENTS = ['数学竞赛', '英语演讲', '写作', '绘画', '音乐', '体育', '编程', '科学实验']

// 学生兴趣
const INTERESTS = ['阅读', '运动', '音乐', '绘画', '科技', '游戏', '旅游', '手工', '舞蹈', '摄影']

// 学习内容模板
const STUDY_CONTENTS = [
  '完成课后练习题，掌握本节课重点知识',
  '复习上周学习内容，巩固基础知识点',
  '预习下节课内容，提前了解新知识',
  '完成单元测试，检验学习效果',
  '错题整理与分析，查漏补缺',
  '专项训练，提升解题能力',
  '课外拓展阅读，开阔知识面',
  '小组讨论学习，互相交流心得',
  '观看教学视频，加深理解',
  '完成实践作业，理论联系实际'
]

// 学习笔记模板
const STUDY_NOTES = [
  '学习状态良好，积极主动',
  '注意力集中，学习效率高',
  '遇到难题能主动思考',
  '课堂表现活跃，积极发言',
  '作业完成质量较高',
  '需要加强基础知识巩固',
  '学习态度认真，但方法需改进',
  '进步明显，继续保持',
  '对新知识接受较快',
  '需要多做练习题巩固'
]

// 学生备注模板
const STUDENT_NOTES = [
  '该学生学习态度认真，成绩稳定，建议继续保持良好的学习习惯',
  '基础扎实，理解能力强，可以适当增加难度挑战',
  '学习积极性高，但需要注意学习方法的改进',
  '近期进步明显，家长配合度高，值得表扬',
  '性格开朗，乐于助人，在班级中起到良好的带头作用',
  '需要加强基础知识的巩固，建议增加练习量',
  '偏科现象明显，需要重点关注薄弱科目',
  '学习自觉性强，能够独立完成作业',
  '课堂表现活跃，但需要提高作业完成质量',
  '有较强的学习潜力，需要适当的引导和鼓励'
]

// 生成单个学生数据
const generateStudent = (index: number): Student => {
  const name = index < REAL_NAMES.length ? REAL_NAMES[index] : randomChineseName()
  const gender = randomPick(['male', 'female'] as const)
  const age = randomInt(6, 16)
  const totalHomework = randomInt(20, 100)
  const completedHomework = randomInt(Math.floor(totalHomework * 0.6), totalHomework)
  const hasNotes = randomBoolean(0.6)

  return {
    id: generateId(),
    name,
    avatar: randomAvatar(),
    gender,
    age,
    grade: randomPick(GRADES),
    phone: randomPhone(),
    email: randomEmail(),
    parentPhone: randomPhone(),
    parentName: `${name}家长`,
    status: randomPick(['active', 'inactive', 'graduated'] as const),
    level: randomPick(['excellent', 'good', 'average', 'poor'] as const),
    tags: randomPickMultiple(STUDENT_TAGS, randomInt(1, 4)),
    group: randomPick(STUDENT_GROUPS),
    enrollDate: randomDateOnly(new Date(2023, 0, 1), new Date(2024, 11, 31)),
    totalStudyTime: randomInt(1000, 10000),
    completedHomework,
    totalHomework,
    averageScore: randomFloat(60, 100, 1),
    lastActiveDate: randomDate(new Date(2024, 11, 1), new Date()),
    notes: hasNotes ? randomPick(STUDENT_NOTES) : undefined,
    createdAt: randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1)),
    updatedAt: randomDate(new Date(2024, 0, 1), new Date())
  }
}

// 生成学生列表
export const generateStudents = (count: number = 50): Student[] => {
  return Array.from({ length: count }, (_, index) => generateStudent(index))
}

// 生成学生学习记录
export const generateStudyRecords = (studentId: string, count: number = 30): StudentStudyRecord[] => {
  const subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理']

  return Array.from({ length: count }, () => ({
    id: generateId(),
    studentId,
    date: randomDateOnly(new Date(2024, 0, 1), new Date()),
    duration: randomInt(30, 180),
    subject: randomPick(subjects),
    content: randomPick(STUDY_CONTENTS),
    notes: randomBoolean(0.7) ? randomPick(STUDY_NOTES) : undefined
  }))
}

// 生成学生详细信息（包含特长和兴趣）
export const generateStudentDetail = (student: Student) => {
  return {
    ...student,
    talents: randomPickMultiple(TALENTS, randomInt(1, 3)),
    interests: randomPickMultiple(INTERESTS, randomInt(2, 4)),
    studyRecords: generateStudyRecords(student.id, randomInt(15, 30))
  }
}

// 默认学生数据
export const mockStudents = generateStudents(50)

// 生成所有学生的学习记录
export const mockStudyRecords = mockStudents.flatMap(student =>
  generateStudyRecords(student.id, randomInt(10, 20))
)
