/**
 * 格式化工具函数
 */

// 格式化数字（添加千分位）
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 格式化百分比
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}

// 格式化分数
export const formatScore = (score: number, totalScore: number = 100): string => {
  return `${score}/${totalScore}`
}

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 格式化手机号（隐藏中间4位）
export const formatPhone = (phone: string): string => {
  if (!phone || phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 格式化姓名（隐藏姓氏）
export const formatName = (name: string): string => {
  if (!name || name.length < 2) return name
  return '*' + name.slice(1)
}

// 截断文本
export const truncate = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + suffix
}

// 高亮关键词
export const highlightKeyword = (text: string, keyword: string): string => {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 格式化标签
export const formatTags = (tags: string[]): string => {
  return tags.join(', ')
}

// 格式化状态文本
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: '活跃',
    inactive: '不活跃',
    graduated: '已毕业',
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期',
    not_submitted: '未提交',
    submitted: '已提交',
    graded: '已批改',
    question: '提问',
    feedback: '反馈',
    parent: '家长沟通',
    other: '其他',
    online: '在线',
    phone: '电话',
    offline: '线下',
    wechat: '微信',
    excellent: '优秀',
    good: '良好',
    average: '一般',
    poor: '较差',
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }

  return statusMap[status] || status
}

// 格式化等级
export const formatLevel = (level: string): string => {
  return formatStatus(level)
}

// 格式化难度
export const formatDifficulty = (difficulty: string): string => {
  return formatStatus(difficulty)
}

// 格式化风险等级
export const formatRiskLevel = (level: string): string => {
  const map: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return map[level] || level
}

// 格式化跟进状态
export const formatFollowUpStatus = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待跟进',
    in_progress: '跟进中',
    resolved: '已解决'
  }
  return map[status] || status
}

// 获取风险等级标签类型
export const getRiskTagType = (
  level: string
): 'danger' | 'warning' | 'success' | 'info' => {
  const map: Record<string, 'danger' | 'warning' | 'success' | 'info'> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[level] || 'info'
}

// 首字母大写
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 驼峰转下划线
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// 下划线转驼峰
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}
