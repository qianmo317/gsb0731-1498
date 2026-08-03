<template>
  <div class="followup-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学情跟进</span>
        </div>
      </template>

      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索标题、内容、学生"
          :prefix-icon="Search"
          clearable
          style="width: 300px"
          @input="handleFilter"
        />
        <el-select v-model="filters.riskLevel" placeholder="风险等级" clearable @change="handleFilter">
          <el-option label="高风险" value="high" />
          <el-option label="中风险" value="medium" />
          <el-option label="低风险" value="low" />
        </el-select>
        <el-select v-model="filters.status" placeholder="跟进状态" clearable @change="handleFilter">
          <el-option label="待跟进" value="pending" />
          <el-option label="跟进中" value="in_progress" />
          <el-option label="已解决" value="resolved" />
        </el-select>
      </div>

      <el-table :data="pagedList" v-loading="loading" stripe>
        <el-table-column label="学生" width="160">
          <template #default="{ row }">
            <div class="student-info">
              <el-avatar :size="32" :src="row.studentAvatar" />
              <div>
                <div>{{ row.studentName }}</div>
                <el-tag size="small" :type="getRiskTagType(row.riskLevel)" effect="dark">
                  {{ formatRiskLevel(row.riskLevel) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="content" label="跟进内容" min-width="250">
          <template #default="{ row }">
            <el-tooltip :content="row.content" placement="top" :disabled="row.content.length <= 50">
              <span>{{ truncateText(row.content, 50) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ formatFollowUpStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="100" />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'resolved'"
              link
              type="success"
              @click="handleResolve(row)"
            >
              标记已解决
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              link
              type="primary"
              @click="handleInProgress(row)"
            >
              开始跟进
            </el-button>
            <el-button link type="primary" @click="handleViewStudent(row)">查看学生</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="filteredList.length"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRiskStore } from '@/stores'
import { formatRiskLevel, formatFollowUpStatus, getRiskTagType } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import { truncate } from '@/utils/format'
import type { FollowUpRecord, FollowUpStatus, RiskLevel } from '@/types/risk'

const router = useRouter()
const route = useRoute()
const riskStore = useRiskStore()

const loading = ref(false)
const keyword = ref('')
const filters = reactive<{
  riskLevel: RiskLevel | ''
  status: FollowUpStatus | ''
  studentId: string
}>({
  riskLevel: '',
  status: '',
  studentId: ''
})

const pagination = ref({
  page: 1,
  pageSize: 20
})

const allFollowUps = computed<FollowUpRecord[]>(() => riskStore.followUps)

const filteredList = computed<FollowUpRecord[]>(() => {
  let list = [...allFollowUps.value]

  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(
      f =>
        f.title.toLowerCase().includes(kw) ||
        f.content.toLowerCase().includes(kw) ||
        f.studentName.toLowerCase().includes(kw)
    )
  }
  if (filters.riskLevel) {
    list = list.filter(f => f.riskLevel === filters.riskLevel)
  }
  if (filters.status) {
    list = list.filter(f => f.status === filters.status)
  }
  if (filters.studentId) {
    list = list.filter(f => f.studentId === filters.studentId)
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return list
})

const pagedList = computed<FollowUpRecord[]>(() => {
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredList.value.slice(start, end)
})

const truncateText = (text: string, max: number) => truncate(text, max)

const handleFilter = () => {
  pagination.value.page = 1
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
}

// 标记已解决 -> 联动重新计算该学生的沟通风险
const handleResolve = async (row: FollowUpRecord) => {
  try {
    await ElMessageBox.confirm('确定将此跟进标记为已解决吗？解决后该学生的风险将重新计算。', '提示', {
      type: 'warning'
    })
    riskStore.resolveFollowUp(row.id)
    riskStore.syncCommunicationResolved(row.studentId)
    ElMessage.success('已标记为已解决，风险等级已更新')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleInProgress = (row: FollowUpRecord) => {
  riskStore.updateFollowUpStatus(row.id, 'in_progress')
  ElMessage.success('已开始跟进')
}

const handleViewStudent = (row: FollowUpRecord) => {
  router.push(`/students/detail/${row.studentId}`)
}

const handleDelete = async (row: FollowUpRecord) => {
  try {
    await ElMessageBox.confirm('确定删除此跟进记录吗？', '提示', { type: 'warning' })
    riskStore.deleteFollowUp(row.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const getStatusTagType = (status: FollowUpStatus): 'warning' | 'primary' | 'success' => {
  const map: Record<FollowUpStatus, 'warning' | 'primary' | 'success'> = {
    pending: 'warning',
    in_progress: 'primary',
    resolved: 'success'
  }
  return map[status]
}

onMounted(() => {
  riskStore.initFollowUps()
  // 支持从学生详情页带 studentId 跳转筛选
  if (route.query.studentId && typeof route.query.studentId === 'string') {
    filters.studentId = route.query.studentId
  }
})
</script>

<style scoped lang="scss">
.followup-page {
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
  align-items: center;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
