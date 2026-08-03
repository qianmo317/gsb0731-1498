/**
 * 学情风险预警相关 API
 */

import type { Student } from '@/types/student'
import type { Homework, HomeworkSubmission } from '@/types/homework'
import type { CommunicationRecord } from '@/types/communication'
import type {
  RiskFactor,
  RiskLevel,
  RiskThresholds,
  RiskThresholdSource,
  StudentRiskProfile
} from '@/types/risk'
import { getMockData } from '@/mock'
import { getDaysBetween, isExpired } from '@/utils/date'

// 判定提交记录是否逾期未交：以当前时间是否已过作业截止时间实时判断，不使用数据里写死的状态
export const isOverdueSubmission = (
  submission: HomeworkSubmission,
  homework: Homework | undefined
): boolean => {
  return submission.status === 'not_submitted' && !!homework && isExpired(homework.dueDate)
}

// 评估单个学生的风险等级
const evaluateStudent = (
  student: Student,
  submissions: HomeworkSubmission[],
  homeworkMap: Map<string, Homework>,
  communications: CommunicationRecord[],
  thresholds: RiskThresholds,
  thresholdSource: RiskThresholdSource,
  evaluatedAt: string
): StudentRiskProfile => {
  // 作业维度：实时统计逾期未交次数
  const overdueCount = submissions.filter(s => isOverdueSubmission(s, homeworkMap.get(s.homeworkId))).length

  // 活跃度维度：连续无学习动态天数
  const inactiveDays = getDaysBetween(student.lastActiveDate, new Date())

  // 成绩维度：优先取已批改提交的平均分，无批改记录时取学生档案平均分
  const gradedScores = submissions
    .filter(s => s.status === 'graded' && s.score !== undefined)
    .map(s => s.score as number)
  const averageScore =
    gradedScores.length > 0
      ? Math.round((gradedScores.reduce((sum, score) => sum + score, 0) / gradedScores.length) * 10) / 10
      : student.averageScore

  // 沟通维度：未解决的沟通条数
  const studentCommunications = communications.filter(c => c.studentId === student.id)
  const unresolvedCount = studentCommunications.filter(c => !c.isResolved).length

  // 最近跟进沟通时间
  const lastFollowUpAt =
    studentCommunications.length > 0
      ? studentCommunications.reduce((latest, c) => (c.createdAt > latest ? c.createdAt : latest), studentCommunications[0].createdAt)
      : null

  // 各维度分级：达到阈值为高风险，达到阈值一半为中风险
  const factors: RiskFactor[] = []

  if (overdueCount >= thresholds.overdueCount) {
    factors.push({
      type: 'overdue',
      level: 'high',
      value: overdueCount,
      description: `作业逾期未交 ${overdueCount} 次（阈值 ${thresholds.overdueCount} 次）`
    })
  } else if (overdueCount > 0) {
    factors.push({
      type: 'overdue',
      level: 'medium',
      value: overdueCount,
      description: `作业逾期未交 ${overdueCount} 次`
    })
  }

  if (inactiveDays >= thresholds.inactiveDays) {
    factors.push({
      type: 'inactive',
      level: 'high',
      value: inactiveDays,
      description: `连续 ${inactiveDays} 天无学习动态（阈值 ${thresholds.inactiveDays} 天）`
    })
  } else if (inactiveDays >= Math.ceil(thresholds.inactiveDays / 2)) {
    factors.push({
      type: 'inactive',
      level: 'medium',
      value: inactiveDays,
      description: `连续 ${inactiveDays} 天无学习动态`
    })
  }

  if (averageScore < thresholds.averageScoreLine - 10) {
    factors.push({
      type: 'score',
      level: 'high',
      value: averageScore,
      description: `平均分 ${averageScore}，低于警戒线 ${thresholds.averageScoreLine} 超过 10 分`
    })
  } else if (averageScore < thresholds.averageScoreLine) {
    factors.push({
      type: 'score',
      level: 'medium',
      value: averageScore,
      description: `平均分 ${averageScore}，低于警戒线 ${thresholds.averageScoreLine}`
    })
  }

  if (unresolvedCount >= thresholds.unresolvedCount) {
    factors.push({
      type: 'communication',
      level: 'high',
      value: unresolvedCount,
      description: `${unresolvedCount} 条沟通未解决（阈值 ${thresholds.unresolvedCount} 条）`
    })
  } else if (unresolvedCount > 0) {
    factors.push({
      type: 'communication',
      level: 'medium',
      value: unresolvedCount,
      description: `${unresolvedCount} 条沟通未解决`
    })
  }

  // 综合定级：任一维度高风险则为高风险，否则任一维度中风险则为中风险
  let level: RiskLevel = 'low'
  if (factors.some(f => f.level === 'high')) {
    level = 'high'
  } else if (factors.some(f => f.level === 'medium')) {
    level = 'medium'
  }

  return {
    studentId: student.id,
    studentName: student.name,
    group: student.group,
    level,
    factors,
    overdueCount,
    inactiveDays,
    averageScore,
    unresolvedCount,
    lastFollowUpAt,
    thresholdSource,
    appliedThresholds: { ...thresholds },
    evaluatedAt
  }
}

// 评估全部学生的风险等级：配了分组阈值的学生按分组阈值评估，其余回退全局阈值
export const evaluateStudentRisks = async (
  thresholds: RiskThresholds,
  groupThresholds: Record<string, RiskThresholds> = {}
): Promise<StudentRiskProfile[]> => {
  const mockData = getMockData()
  const students = mockData.students as Student[]
  const homeworks = mockData.homeworks as Homework[]
  const submissions = mockData.submissions as HomeworkSubmission[]
  const communications = mockData.communications as CommunicationRecord[]

  const homeworkMap = new Map<string, Homework>(homeworks.map(h => [h.id, h]))
  const evaluatedAt = new Date().toISOString()

  return students.map(student => {
    const studentSubmissions = submissions.filter(s => s.studentId === student.id)
    const groupOverride = groupThresholds[student.group]
    return evaluateStudent(
      student,
      studentSubmissions,
      homeworkMap,
      communications,
      groupOverride ?? thresholds,
      groupOverride ? 'group' : 'global',
      evaluatedAt
    )
  })
}
