/**
 * CSV 导出工具
 */

import type { StudentRisk } from '@/types/risk'
import type { Student } from '@/types/student'
import { getRiskLabel } from './risk'

export interface RiskExportRow {
  姓名: string
  性别: string
  年级: string
  分组: string
  手机号: string
  家长: string
  家长电话: string
  风险等级: string
  风险评分: number
  作业逾期次数: number
  未活跃天数: number
  成绩差距: number
  未解决沟通数: number
  最近跟进时间: string
  阈值来源: string
}

const escapeCsv = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const genderMap: Record<string, string> = {
  male: '男',
  female: '女'
}

export const buildRiskExportData = (
  students: Student[],
  risks: StudentRisk[]
): RiskExportRow[] => {
  const riskMap = new Map(risks.map(r => [r.studentId, r]))

  return students.map(student => {
    const risk = riskMap.get(student.id)
    return {
      姓名: student.name,
      性别: genderMap[student.gender] || student.gender,
      年级: student.grade,
      分组: student.group,
      手机号: student.phone,
      家长: student.parentName,
      家长电话: student.parentPhone,
      风险等级: risk ? getRiskLabel(risk.level) : '未知',
      风险评分: risk?.score ?? 0,
      作业逾期次数: risk?.overdueHomeworkCount ?? 0,
      未活跃天数: risk?.inactiveDays ?? 0,
      成绩差距: risk?.scoreGap ?? 0,
      未解决沟通数: risk?.unresolvedCommunicationCount ?? 0,
      最近跟进时间: formatDate(risk?.latestFollowUpAt ?? null),
      阈值来源: risk?.thresholdSource === 'group' ? `分组阈值(${student.group})` : '全局阈值'
    }
  })
}

export const exportRiskToCsv = (rows: RiskExportRow[], filename?: string): void => {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0]) as (keyof RiskExportRow)[]
  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => escapeCsv(row[h])).join(',')
    )
  ]

  const BOM = '\uFEFF'
  const csvContent = BOM + csvLines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
  const finalFilename = filename || `风险预警名单_${dateStr}.csv`

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = finalFilename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
