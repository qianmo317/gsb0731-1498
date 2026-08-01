/**
 * 本地存储工具函数
 */

// 存储前缀
const STORAGE_PREFIX = 'teacher-admin-'

// 获取完整的存储键
const getKey = (key: string): string => {
  return `${STORAGE_PREFIX}${key}`
}

// 设置 localStorage
export const setLocal = (key: string, value: any): void => {
  try {
    const data = JSON.stringify(value)
    localStorage.setItem(getKey(key), data)
  } catch (error) {
    console.error('localStorage setItem error:', error)
  }
}

// 获取 localStorage
export const getLocal = <T = any>(key: string): T | null => {
  try {
    const data = localStorage.getItem(getKey(key))
    if (data === null) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error('localStorage getItem error:', error)
    return null
  }
}

// 删除 localStorage
export const removeLocal = (key: string): void => {
  try {
    localStorage.removeItem(getKey(key))
  } catch (error) {
    console.error('localStorage removeItem error:', error)
  }
}

// 清空 localStorage
export const clearLocal = (): void => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('localStorage clear error:', error)
  }
}

// 设置 sessionStorage
export const setSession = (key: string, value: any): void => {
  try {
    const data = JSON.stringify(value)
    sessionStorage.setItem(getKey(key), data)
  } catch (error) {
    console.error('sessionStorage setItem error:', error)
  }
}

// 获取 sessionStorage
export const getSession = <T = any>(key: string): T | null => {
  try {
    const data = sessionStorage.getItem(getKey(key))
    if (data === null) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error('sessionStorage getItem error:', error)
    return null
  }
}

// 删除 sessionStorage
export const removeSession = (key: string): void => {
  try {
    sessionStorage.removeItem(getKey(key))
  } catch (error) {
    console.error('sessionStorage removeItem error:', error)
  }
}

// 清空 sessionStorage
export const clearSession = (): void => {
  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('sessionStorage clear error:', error)
  }
}

// 检查存储是否可用
export const isStorageAvailable = (type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean => {
  try {
    const storage = type === 'localStorage' ? localStorage : sessionStorage
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

// 获取存储大小
export const getStorageSize = (type: 'localStorage' | 'sessionStorage' = 'localStorage'): number => {
  try {
    const storage = type === 'localStorage' ? localStorage : sessionStorage
    let size = 0
    for (const key in storage) {
      if (Object.prototype.hasOwnProperty.call(storage, key)) {
        size += storage[key].length + key.length
      }
    }
    return size
  } catch {
    return 0
  }
}

// 格式化存储大小
export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
