/**
 * 表格逻辑组合式函数
 */

import { ref, reactive } from 'vue'
import type { PaginationParams } from '@/types/common'

export interface UseTableOptions<T = any> {
  fetchData: (params: any) => Promise<{ list: T[]; total: number }>
  immediate?: boolean
  defaultPageSize?: number
}

export function useTable<T = any>(options: UseTableOptions<T>) {
  const { fetchData, immediate = true, defaultPageSize = 20 } = options

  const loading = ref(false)
  const data = ref<T[]>([])
  const total = ref(0)

  const pagination = reactive<PaginationParams>({
    page: 1,
    pageSize: defaultPageSize
  })

  const filters = ref<Record<string, any>>({})

  // 加载数据
  const loadData = async () => {
    loading.value = true
    try {
      const params = {
        ...pagination,
        ...filters.value
      }
      const response = await fetchData(params)
      data.value = response.list
      total.value = response.total
    } catch (error) {
      console.error('加载数据失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 刷新数据
  const refresh = () => {
    loadData()
  }

  // 重置并刷新
  const reset = () => {
    pagination.page = 1
    filters.value = {}
    loadData()
  }

  // 页码改变
  const handlePageChange = (page: number) => {
    pagination.page = page
    loadData()
  }

  // 每页数量改变
  const handleSizeChange = (size: number) => {
    pagination.pageSize = size
    pagination.page = 1
    loadData()
  }

  // 筛选
  const handleFilter = (newFilters: Record<string, any>) => {
    filters.value = { ...newFilters }
    pagination.page = 1
    loadData()
  }

  // 搜索
  const handleSearch = (keyword: string) => {
    filters.value = { ...filters.value, keyword }
    pagination.page = 1
    loadData()
  }

  // 排序
  const handleSort = (prop: string, order: 'ascending' | 'descending' | null) => {
    filters.value = { ...filters.value, sortProp: prop, sortOrder: order }
    pagination.page = 1
    loadData()
  }

  // 初始化加载
  if (immediate) {
    loadData()
  }

  return {
    loading,
    data,
    total,
    pagination,
    filters,
    loadData,
    refresh,
    reset,
    handlePageChange,
    handleSizeChange,
    handleFilter,
    handleSearch,
    handleSort
  }
}
