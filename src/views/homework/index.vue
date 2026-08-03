<template>
  <div class="homework-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>作业列表</span>
        </div>
      </template>

      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索作业标题"
          :prefix-icon="Search"
          style="width: 300px"
          @input="handleSearch"
        />
        <el-select v-model="filters.status" placeholder="状态" clearable @change="handleFilter">
          <el-option label="待处理" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已逾期" value="overdue" />
        </el-select>
        <el-select v-model="filters.subject" placeholder="科目" clearable @change="handleFilter">
          <el-option label="数学" value="数学" />
          <el-option label="语文" value="语文" />
          <el-option label="英语" value="英语" />
          <el-option label="物理" value="物理" />
          <el-option label="化学" value="化学" />
        </el-select>
      </div>

      <el-table :data="data" v-loading="loading" stripe>
        <el-table-column prop="title" label="作业标题" min-width="200" />
        <el-table-column prop="subject" label="科目" width="100" />
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)">
              {{ formatStatus(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column label="完成情况" width="150">
          <template #default="{ row }">
            {{ row.submittedCount }}/{{ row.totalCount }}
            ({{ Math.round((row.submittedCount / row.totalCount) * 100) }}%)
          </template>
        </el-table-column>
        <el-table-column label="批改进度" width="150">
          <template #default="{ row }">
            {{ row.gradedCount }}/{{ row.submittedCount }}
          </template>
        </el-table-column>
        <el-table-column prop="averageScore" label="平均分" width="100">
          <template #default="{ row }">
            {{ row.averageScore > 0 ? row.averageScore.toFixed(1) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(resolveHomeworkStatus(row))">
              {{ formatStatus(resolveHomeworkStatus(row)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button link type="primary" @click="handleGrade(row)">批改</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useHomeworkStore } from '@/stores'
import { useTable } from '@/composables/useTable'
import { formatStatus } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import { resolveHomeworkStatus } from '@/utils/risk'
import type { Homework } from '@/types/homework'

const router = useRouter()
const homeworkStore = useHomeworkStore()

const keyword = ref('')
const filters = ref({
  status: '',
  subject: ''
})

const {
  loading,
  data,
  total,
  pagination,
  handlePageChange,
  handleSizeChange,
  refresh
} = useTable<Homework>({
  fetchData: params => homeworkStore.fetchHomeworks(params)
})

const handleSearch = () => {
  refresh()
}

const handleFilter = () => {
  refresh()
}

const handleView = (row: Homework) => {
  router.push(`/homework/detail/${row.id}`)
}

const handleGrade = (row: Homework) => {
  router.push(`/homework/grade/${row.id}`)
}

const getDifficultyType = (difficulty: string) => {
  const map: Record<string, any> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return map[difficulty] || 'info'
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    overdue: 'danger'
  }
  return map[status] || 'info'
}
</script>

<style scoped lang="scss">
.homework-page {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
