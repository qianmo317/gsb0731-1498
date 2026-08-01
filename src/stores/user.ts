/**
 * 用户 Store
 * 管理用户登录状态和信息
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'teacher'
  avatar?: string
  email?: string
  phone?: string
}

export interface LoginParams {
  username: string
  password: string
  remember?: boolean
}

// Mock 用户数据
const mockUsers: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      name: '管理员',
      role: 'admin',
      email: 'admin@example.com',
      phone: '13800138000'
    }
  },
  teacher: {
    password: 'teacher123',
    user: {
      id: '2',
      username: 'teacher',
      name: '张老师',
      role: 'teacher',
      email: 'teacher@example.com',
      phone: '13800138001'
    }
  }
}

export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref<User | null>(null)
    const token = ref<string>('')

    // 登录
    const login = async (params: LoginParams): Promise<void> => {
      return new Promise((resolve, reject) => {
        // 模拟网络延迟
        setTimeout(() => {
          const mockUser = mockUsers[params.username]

          if (!mockUser) {
            reject(new Error('用户名不存在'))
            return
          }

          if (mockUser.password !== params.password) {
            reject(new Error('密码错误'))
            return
          }

          // 生成 Mock Token
          const mockToken = `mock-token-${params.username}-${Date.now()}`

          // 保存用户信息和 Token
          user.value = mockUser.user
          token.value = mockToken

          resolve()
        }, 500)
      })
    }

    // 登出
    const logout = async (): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          user.value = null
          token.value = ''
          resolve()
        }, 300)
      })
    }

    // 获取用户信息
    const getUserInfo = async (): Promise<User> => {
      return new Promise((resolve, reject) => {
        if (!token.value) {
          reject(new Error('未登录'))
          return
        }

        setTimeout(() => {
          if (user.value) {
            resolve(user.value)
          } else {
            reject(new Error('获取用户信息失败'))
          }
        }, 300)
      })
    }

    // 检查是否已登录
    const isLoggedIn = (): boolean => {
      return !!token.value && !!user.value
    }

    return {
      user,
      token,
      login,
      logout,
      getUserInfo,
      isLoggedIn
    }
  },
  {
    persist: {
      key: 'teacher-admin-user',
      storage: localStorage,
      paths: ['user', 'token']
    }
  }
)
