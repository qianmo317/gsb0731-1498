/**
 * 作业 Mock 数据
 */

import type { Homework, HomeworkSubmission } from '@/types/homework'
import {
  generateId,
  randomPick,
  randomInt,
  randomFloat,
  randomDate,
  randomBoolean,
  randomPickMultiple
} from './utils'
import { mockStudents } from './student'

// 科目
const SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理']

// 作业标题模板
const HOMEWORK_TITLES = [
  '第{chapter}章课后练习',
  '{subject}周测试卷',
  '{subject}单元测试',
  '期中复习题',
  '期末模拟卷',
  '课堂练习{num}',
  '{subject}专项训练',
  '{subject}综合能力测试',
  '{subject}基础知识巩固',
  '{subject}拓展提高练习'
]

// 作业描述模板
const HOMEWORK_DESCRIPTIONS = [
  '请认真完成本次作业，注意书写规范，按时提交。重点关注基础知识的掌握。',
  '本次作业涵盖本周所学重点内容，请独立完成，遇到问题可以查阅课本和笔记。',
  '作业要求：1. 认真审题 2. 规范答题 3. 检查核对 4. 按时提交',
  '本次作业难度适中，请同学们认真对待，完成后可以与同学讨论交流。',
  '作业内容包含基础题和提高题，请根据自己的情况选择性完成，基础题必做。',
  '请注意作业格式要求，字迹工整，步骤完整，答案准确。',
  '本次作业是对前期学习内容的综合检验，请认真完成每一道题目。',
  '作业提交要求：请将答案整理清楚，拍照或扫描后上传，确保图片清晰可见。'
]

// 作业要求模板
const HOMEWORK_REQUIREMENTS = [
  '1. 独立完成，不得抄袭\n2. 书写工整，步骤完整\n3. 按时提交，不得迟交',
  '1. 认真审题，仔细作答\n2. 检查核对，确保准确\n3. 遇到问题及时询问',
  '1. 基础题必做，提高题选做\n2. 注意答题格式和规范\n3. 提交前仔细检查',
  '1. 理解题意，独立思考\n2. 规范答题，清晰表达\n3. 总结反思，查漏补缺'
]

// 学生作业内容模板
const SUBMISSION_CONTENTS = [
  '已认真完成所有题目，对重点知识进行了梳理和总结。部分难题经过反复思考后得出答案。',
  '本次作业整体完成情况良好，基础题全部完成，提高题完成了大部分。有几道题目不太确定，希望老师能够指导。',
  '作业已完成，对本周学习内容有了更深入的理解。通过做题发现了一些知识盲点，已经进行了补充学习。',
  '认真完成了每一道题目，并对错题进行了整理。感觉对这部分知识掌握得比较扎实了。',
  '作业完成过程中遇到了一些困难，但通过查阅资料和思考最终都解决了。收获很大。',
  '本次作业难度适中，完成得比较顺利。对部分知识点有了新的认识和理解。',
  '已完成全部作业内容，详细答案见附件。对不确定的题目做了标记，期待老师的讲解。'
]

// 批改反馈模板
const FEEDBACK_TEMPLATES = [
  '完成得很好！基础知识掌握扎实，解题思路清晰。继续保持这种学习态度。',
  '作业完成质量较高，但有几处小错误需要注意。建议加强对细节的把握。',
  '整体不错，但部分题目的解题方法可以更优化。建议多思考不同的解题思路。',
  '基础题完成得很好，提高题还需要加强。建议多做一些类似的练习题。',
  '作业态度认真，但对某些知识点的理解还不够深入。建议重点复习相关内容。',
  '进步明显！这次作业比上次完成得更好。继续努力，相信你会越来越好。',
  '完成得非常出色！不仅答案正确，而且解题过程规范完整。值得表扬！',
  '作业完成情况良好，但书写还需要更工整一些。注意答题格式的规范性。',
  '很用心的作业！可以看出你对每道题都进行了认真思考。继续保持！',
  '作业质量有待提高，部分题目理解有偏差。建议课后多与老师交流。'
]

// 生成作业标题
const generateHomeworkTitle = (subject: string): string => {
  const template = randomPick(HOMEWORK_TITLES)
  return template
    .replace('{subject}', subject)
    .replace('{chapter}', String(randomInt(1, 10)))
    .replace('{num}', String(randomInt(1, 20)))
}

// 生成单个作业
const generateHomework = (): Homework => {
  const subject = randomPick(SUBJECTS)
  const totalCount = randomInt(10, 30)
  const submittedCount = randomInt(Math.floor(totalCount * 0.5), totalCount)
  const gradedCount = randomInt(Math.floor(submittedCount * 0.6), submittedCount)
  const excellentCount = randomInt(0, Math.floor(gradedCount * 0.3))

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + randomInt(-10, 10))

  let status: Homework['status']
  if (dueDate < new Date() && submittedCount < totalCount) {
    status = 'overdue'
  } else if (gradedCount === totalCount) {
    status = 'completed'
  } else if (submittedCount > 0) {
    status = 'in_progress'
  } else {
    status = 'pending'
  }

  return {
    id: generateId(),
    title: generateHomeworkTitle(subject),
    description: randomPick(HOMEWORK_DESCRIPTIONS) + '\n\n作业要求：\n' + randomPick(HOMEWORK_REQUIREMENTS),
    subject,
    difficulty: randomPick(['easy', 'medium', 'hard'] as const),
    totalScore: 100,
    dueDate: dueDate.toISOString(),
    status,
    assignedStudents: randomPickMultiple(
      mockStudents.map(s => s.id),
      totalCount
    ),
    submittedCount,
    gradedCount,
    totalCount,
    averageScore: gradedCount > 0 ? randomFloat(70, 95, 1) : 0,
    excellentCount,
    createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    updatedAt: randomDate(new Date(2024, 0, 1), new Date())
  }
}

// 生成作业提交记录
export const generateSubmissions = (homeworkId: string, studentIds: string[]): HomeworkSubmission[] => {
  return studentIds.map(studentId => {
    const student = mockStudents.find(s => s.id === studentId)
    const isSubmitted = randomBoolean(0.8)
    const isGraded = isSubmitted && randomBoolean(0.7)

    let status: HomeworkSubmission['status']
    if (!isSubmitted) {
      status = 'not_submitted'
    } else if (isGraded) {
      status = 'graded'
    } else {
      status = 'submitted'
    }

    const score = isGraded ? randomFloat(60, 100, 0) : undefined
    const isExcellent = isGraded && score && score >= 90 && randomBoolean(0.3)

    return {
      id: generateId(),
      homeworkId,
      studentId,
      studentName: student?.name || '未知学生',
      studentAvatar: student?.avatar,
      status,
      content: isSubmitted ? randomPick(SUBMISSION_CONTENTS) : '',
      attachments: isSubmitted ? randomPickMultiple(
        [`${student?.name}_作业.pdf`, `答题卡_${randomInt(1, 100)}.jpg`, `作业附件_${randomInt(1, 100)}.docx`],
        randomInt(1, 2)
      ) : undefined,
      submitTime: isSubmitted ? randomDate(new Date(2024, 11, 1), new Date()) : undefined,
      score,
      feedback: isGraded ? randomPick(FEEDBACK_TEMPLATES) : undefined,
      isExcellent: isExcellent || false,
      gradedAt: isGraded ? randomDate(new Date(2024, 11, 1), new Date()) : undefined,
      gradedBy: isGraded ? '张老师' : undefined
    }
  })
}

// 生成作业列表
export const generateHomeworks = (count: number = 30): Homework[] => {
  return Array.from({ length: count }, generateHomework)
}

// 默认作业数据
export const mockHomeworks = generateHomeworks(30)

// 生成所有作业的提交记录
export const mockSubmissions = mockHomeworks.flatMap(homework =>
  generateSubmissions(homework.id, homework.assignedStudents)
)

// 生成作业评分标准
export const generateGradingCriteria = (subject: string) => {
  const criteria: Record<string, string[]> = {
    '数学': [
      '计算准确性（30分）',
      '解题思路（30分）',
      '步骤完整性（20分）',
      '答案正确性（20分）'
    ],
    '语文': [
      '字迹工整（10分）',
      '内容完整（30分）',
      '语言表达（30分）',
      '创意思维（30分）'
    ],
    '英语': [
      '词汇运用（25分）',
      '语法正确（25分）',
      '句式多样（25分）',
      '内容连贯（25分）'
    ]
  }

  return criteria[subject] || [
    '基础知识（40分）',
    '理解能力（30分）',
    '应用能力（20分）',
    '创新思维（10分）'
  ]
}
