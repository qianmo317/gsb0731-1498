/**
 * 沟通记录 Store
 */

import { defineStore } from 'pinia'
import type { CommunicationRecord, CommunicationFilterParams } from '@/types/communication'
import type { PaginationParams } from '@/types/common'
import * as communicationApi from '@/api/communication'
import { useRiskStore } from './risk'

// 沟通数据变更后重新评估学生风险
const reevaluateRisk = async () => {
  const riskStore = useRiskStore()
  await riskStore.evaluateAll()
}

export const useCommunicationStore = defineStore('communication', {
  state: () => ({
    communications: [] as CommunicationRecord[],
    currentCommunication: null as CommunicationRecord | null,
    total: 0,
    loading: false,
    filterParams: {} as CommunicationFilterParams
  }),

  getters: {
    // 未解决的沟通记录数量
    unresolvedCount: state => state.communications.filter(c => !c.isResolved).length,

    // 重要的沟通记录数量
    importantCount: state => state.communications.filter(c => c.isImportant).length
  },

  actions: {
    // 获取沟通记录列表
    async fetchCommunications(params: PaginationParams & CommunicationFilterParams) {
      this.loading = true
      try {
        const response = await communicationApi.getCommunicationList(params)
        this.communications = response.list
        this.total = response.total
        this.filterParams = params
        return response
      } catch (error) {
        console.error('获取沟通记录列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取沟通记录详情
    async fetchCommunicationDetail(id: string) {
      this.loading = true
      try {
        this.currentCommunication = await communicationApi.getCommunicationDetail(id)
      } catch (error) {
        console.error('获取沟通记录详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 创建沟通记录
    async createCommunication(data: any) {
      this.loading = true
      try {
        const newCommunication = await communicationApi.createCommunication(data)
        this.communications.unshift(newCommunication)
        this.total++
        await reevaluateRisk()
        return newCommunication
      } catch (error) {
        console.error('创建沟通记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 更新沟通记录
    async updateCommunication(id: string, data: any) {
      this.loading = true
      try {
        const updated = await communicationApi.updateCommunication(id, data)
        const index = this.communications.findIndex(c => c.id === id)
        if (index !== -1) {
          this.communications[index] = updated
        }
        if (this.currentCommunication?.id === id) {
          this.currentCommunication = updated
        }
        await reevaluateRisk()
        return updated
      } catch (error) {
        console.error('更新沟通记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 删除沟通记录
    async deleteCommunication(id: string) {
      this.loading = true
      try {
        await communicationApi.deleteCommunication(id)
        this.communications = this.communications.filter(c => c.id !== id)
        this.total--
        await reevaluateRisk()
      } catch (error) {
        console.error('删除沟通记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 标记为已解决
    async markAsResolved(id: string) {
      try {
        const updated = await communicationApi.markAsResolved(id)
        const index = this.communications.findIndex(c => c.id === id)
        if (index !== -1) {
          this.communications[index] = updated
        }
        await reevaluateRisk()
        return updated
      } catch (error) {
        console.error('标记为已解决失败:', error)
        throw error
      }
    },

    // 标记为重要
    async markAsImportant(id: string, isImportant: boolean) {
      try {
        const updated = await communicationApi.markAsImportant(id, isImportant)
        const index = this.communications.findIndex(c => c.id === id)
        if (index !== -1) {
          this.communications[index] = updated
        }
        return updated
      } catch (error) {
        console.error('标记为重要失败:', error)
        throw error
      }
    }
  }
})
