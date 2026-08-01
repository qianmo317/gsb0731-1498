/**
 * Mock 工具函数
 */

const randomDigits = (length: number): string => {
  return Array.from({ length }, () => String(Math.floor(Math.random() * 10))).join('')
}

const randomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const randomUUID = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  // RFC4122 v4-like fallback (not cryptographically secure)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16)
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 生成随机ID
export const generateId = (): string => {
  return randomUUID()
}

// 生成随机日期
export const randomDate = (start?: Date, end?: Date): string => {
  const startDate = start || new Date(2024, 0, 1)
  const endDate = end || new Date()
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
  return new Date(randomTime).toISOString().replace('T', ' ').split('.')[0]
}

// 生成随机日期（仅日期）
export const randomDateOnly = (start?: Date, end?: Date): string => {
  const startDate = start || new Date(2024, 0, 1)
  const endDate = end || new Date()
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
  return new Date(randomTime).toISOString().split('T')[0]
}

// 生成随机手机号
export const randomPhone = (): string => {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  return prefix + randomDigits(8)
}

// 生成随机邮箱
export const randomEmail = (): string => {
  return `${randomString(10)}@example.com`
}

// 生成随机头像
export const randomAvatar = (): string => {
  const id = Math.floor(Math.random() * 100)
  return `https://i.pravatar.cc/150?img=${id}`
}

// 生成随机中文名
export const randomChineseName = (): string => {
  const surnames = [
    '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈',
    '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许',
    '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏',
    '陶', '姜', '戚', '谢', '邹', '喻', '柏', '水', '窦', '章',
    '云', '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦'
  ]
  const givenNames = [
    '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋',
    '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平',
    '刚', '桂英', '文', '玉兰', '欣', '晨', '宇', '子涵', '浩然', '梓萱'
  ]
  return randomPick(surnames) + randomPick(givenNames)
}

// 从数组中随机选择
export const randomPick = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 从数组中随机选择多个
export const randomPickMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// 生成随机整数
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 生成随机浮点数
export const randomFloat = (min: number, max: number, decimals: number = 2): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

// 生成随机布尔值
export const randomBoolean = (probability: number = 0.5): boolean => {
  return Math.random() < probability
}

// 延迟函数（模拟网络请求）
export const delay = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 生成分页数据
export const paginate = <T>(data: T[], page: number, pageSize: number) => {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    list: data.slice(start, end),
    total: data.length,
    page,
    pageSize
  }
}

// 模拟成功响应
export const successResponse = <T>(data: T) => {
  return {
    code: 200,
    message: 'success',
    data
  }
}

// 模拟错误响应
export const errorResponse = (message: string, code: number = 500) => {
  return {
    code,
    message,
    data: null
  }
}
