/**
 * 验证工具函数
 */

// 验证手机号
export const validatePhone = (phone: string): boolean => {
  const regex = /^1[3-9]\d{9}$/
  return regex.test(phone)
}

// 验证邮箱
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// 验证身份证号
export const validateIdCard = (idCard: string): boolean => {
  const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return regex.test(idCard)
}

// 验证URL
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// 验证数字
export const validateNumber = (value: string): boolean => {
  return !isNaN(Number(value))
}

// 验证整数
export const validateInteger = (value: string): boolean => {
  const regex = /^-?\d+$/
  return regex.test(value)
}

// 验证正整数
export const validatePositiveInteger = (value: string): boolean => {
  const regex = /^\d+$/
  return regex.test(value)
}

// 验证小数
export const validateDecimal = (value: string, decimals: number = 2): boolean => {
  const regex = new RegExp(`^-?\\d+(\\.\\d{1,${decimals}})?$`)
  return regex.test(value)
}

// 验证分数范围
export const validateScore = (score: number, min: number = 0, max: number = 100): boolean => {
  return score >= min && score <= max
}

// 验证年龄
export const validateAge = (age: number): boolean => {
  return age > 0 && age < 150
}

// 验证密码强度
export const validatePasswordStrength = (password: string): {
  valid: boolean
  strength: 'weak' | 'medium' | 'strong'
  message: string
} => {
  if (password.length < 6) {
    return {
      valid: false,
      strength: 'weak',
      message: '密码长度至少6位'
    }
  }

  let strength = 0

  // 包含小写字母
  if (/[a-z]/.test(password)) strength++

  // 包含大写字母
  if (/[A-Z]/.test(password)) strength++

  // 包含数字
  if (/\d/.test(password)) strength++

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

  if (strength <= 1) {
    return {
      valid: false,
      strength: 'weak',
      message: '密码强度太弱，建议包含大小写字母、数字和特殊字符'
    }
  }

  if (strength === 2) {
    return {
      valid: true,
      strength: 'medium',
      message: '密码强度中等'
    }
  }

  return {
    valid: true,
    strength: 'strong',
    message: '密码强度强'
  }
}

// 验证中文姓名
export const validateChineseName = (name: string): boolean => {
  const regex = /^[\u4e00-\u9fa5]{2,10}$/
  return regex.test(name)
}

// 验证用户名
export const validateUsername = (username: string): boolean => {
  const regex = /^[a-zA-Z0-9_]{4,16}$/
  return regex.test(username)
}

// 验证非空
export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

// 验证长度范围
export const validateLength = (value: string, min: number, max: number): boolean => {
  const length = value.length
  return length >= min && length <= max
}

// 验证数组长度
export const validateArrayLength = (arr: any[], min: number, max?: number): boolean => {
  if (arr.length < min) return false
  if (max !== undefined && arr.length > max) return false
  return true
}

// 验证日期格式
export const validateDateFormat = (date: string, format: string = 'YYYY-MM-DD'): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (format === 'YYYY-MM-DD') {
    return regex.test(date)
  }
  return false
}

// 验证日期范围
export const validateDateRange = (start: string, end: string): boolean => {
  return new Date(start) <= new Date(end)
}
