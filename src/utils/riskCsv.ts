/**
 * 风险预警名单 CSV 导出
 * 字段命名与口径沿用前两轮：学生基础信息 + 风险等级 + 各指标命中值 + 最近跟进时间
 */

import type { Student } from '@/types/student'
import type { StudentRiskResult, FollowUpRecord } from '@/types/risk'
import { formatRiskLevel } from './format'
import { formatDateTime } from './date'

export interface RiskExportRow {
  studentId: string
  name: string
  grade: string
  group: string
  phone: string
  gender: string
  averageScore: number
  riskLevel: string
  overdueHomeworkCount: number
  inactiveDays: number
  scoreGap: number
  unresolvedCommunicationCount: number
  thresholdSource: string
  latestFollowUpAt: string
}

const HEADERS: Array<{ key: keyof RiskExportRow; label: string }> = [
  { key: 'studentId', label: '学生ID' },
  { key: 'name', label: '姓名' },
  { key: 'grade', label: '年级' },
  { key: 'group', label: '分组' },
  { key: 'phone', label: '手机号' },
  { key: 'gender', label: '性别' },
  { key: 'averageScore', label: '平均分' },
  { key: 'riskLevel', label: '风险等级' },
  { key: 'overdueHomeworkCount', label: '逾期作业次数' },
  { key: 'inactiveDays', label: '不活跃天数' },
  { key: 'scoreGap', label: '低于警戒分' },
  { key: 'unresolvedCommunicationCount', label: '未解决沟通数' },
  { key: 'thresholdSource', label: '阈值来源' },
  { key: 'latestFollowUpAt', label: '最近跟进时间' }
]

const escapeCsv = (value: string | number): string => {
  const str = String(value ?? '')
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const getLatestFollowUpTime = (
  studentId: string,
  followUps: FollowUpRecord[]
): string => {
  const studentFollowUps = followUps.filter(f => f.studentId === studentId)
  if (studentFollowUps.length === 0) return ''
  const latest = studentFollowUps.reduce((a, b) =>
    new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime() ? a : b
  )
  return formatDateTime(latest.createdAt)
}

export const buildRiskExportData = (
  students: Student[],
  riskResults: StudentRiskResult[],
  followUps: FollowUpRecord[]
): RiskExportRow[] => {
  const riskMap = new Map(riskResults.map(r => [r.studentId, r]))
  return students.map(student => {
    const risk = riskMap.get(student.id)
    return {
      studentId: student.id,
      name: student.name,
      grade: student.grade,
      group: student.group || '',
      phone: student.phone,
      gender: student.gender === 'male' ? '男' : '女',
      averageScore: student.averageScore,
      riskLevel: risk ? formatRiskLevel(risk.level) : '',
      overdueHomeworkCount: risk?.overdueHomeworkCount ?? 0,
      inactiveDays: risk?.inactiveDays ?? 0,
      scoreGap: risk?.scoreGap ?? 0,
      unresolvedCommunicationCount: risk?.unresolvedCommunicationCount ?? 0,
      thresholdSource:
        risk?.thresholdSource === 'group'
          ? `分组阈值${risk.thresholdGroup ? `(${risk.thresholdGroup})` : ''}`
          : '全局阈值',
      latestFollowUpAt: getLatestFollowUpTime(student.id, followUps)
    }
  })
}

export const exportRiskCsv = (
  rows: RiskExportRow[],
  filename = `风险预警名单_${new Date().toISOString().slice(0, 10)}.csv`
): void => {
  const headerLine = HEADERS.map(h => escapeCsv(h.label)).join(',')
  const dataLines = rows.map(row =>
    HEADERS.map(h => escapeCsv(row[h.key])).join(',')
  )
  // 加 BOM 保证 Excel 正确识别 UTF-8
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
