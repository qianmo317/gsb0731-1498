<template>
  <div class="communication-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>沟通记录</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加记录</el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索标题、内容、学生"
          :prefix-icon="Search"
          style="width: 300px"
          @input="handleSearch"
        />
        <el-select v-model="filters.type" placeholder="沟通类型" clearable @change="handleFilter">
          <el-option label="提问" value="question" />
          <el-option label="反馈" value="feedback" />
          <el-option label="家长沟通" value="parent" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-select v-model="filters.method" placeholder="沟通方式" clearable @change="handleFilter">
          <el-option label="在线" value="online" />
          <el-option label="电话" value="phone" />
          <el-option label="线下" value="offline" />
          <el-option label="微信" value="wechat" />
        </el-select>
        <el-checkbox v-model="filters.isImportant" @change="handleFilter">仅显示重要</el-checkbox>
        <el-checkbox v-model="filters.isResolved" @change="handleFilter">仅显示未解决</el-checkbox>
      </div>

      <!-- 使用 CommunicationList 组件 -->
      <CommunicationList
        :records="data"
        @view="handleView"
        @resolve="handleResolve"
        @delete="handleDelete"
      />

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

    <!-- 添加沟通记录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加沟通记录"
      width="600px"
      :close-on-click-modal="false"
    >
      <CommunicationForm
        ref="communicationFormRef"
        :students="students"
        :loading="formLoading"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="沟通记录详情"
      width="700px"
    >
      <div v-if="currentRecord" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学生">
            <div class="student-info">
              <el-avatar :size="32" :src="currentRecord.studentAvatar" />
              <span>{{ currentRecord.studentName }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="沟通时间">
            {{ formatDateTime(currentRecord.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="沟通类型">
            <el-tag :type="getTypeColor(currentRecord.type)">
              {{ formatStatus(currentRecord.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="沟通方式">
            {{ formatStatus(currentRecord.method) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRecord.isResolved ? 'success' : 'warning'">
              {{ currentRecord.isResolved ? '已解决' : '待处理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="重要程度">
            <el-icon v-if="currentRecord.isImportant" color="#faad14" :size="20">
              <Star />
            </el-icon>
            <span v-else>普通</span>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">
            {{ currentRecord.title }}
          </el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">
            <div class="content-text">{{ currentRecord.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRecord.tags && currentRecord.tags.length > 0" label="标签" :span="2">
            <el-tag
              v-for="tag in currentRecord.tags"
              :key="tag"
              size="small"
              type="info"
              style="margin-right: 8px"
            >
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ currentRecord.createdBy }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Search, Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommunicationStore, useStudentStore, useRiskStore } from '@/stores'
import { useTable } from '@/composables/useTable'
import { formatStatus } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import CommunicationList from './components/CommunicationList.vue'
import CommunicationForm from './components/CommunicationForm.vue'
import type { CommunicationRecord, CommunicationFormData } from '@/types/communication'
import type { Student } from '@/types/student'

const communicationStore = useCommunicationStore()
const studentStore = useStudentStore()
const riskStore = useRiskStore()

const keyword = ref('')
const filters = ref({
  type: '',
  method: '',
  isImportant: false,
  isResolved: false
})

// 学生列表
const students = ref<Student[]>([])

// 对话框相关
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentRecord = ref<CommunicationRecord | null>(null)
const formLoading = ref(false)
const communicationFormRef = ref()

const {
  data,
  total,
  pagination,
  handlePageChange,
  handleSizeChange,
  refresh
} = useTable<CommunicationRecord>({
  fetchData: params => communicationStore.fetchCommunications(params)
})

// 加载学生列表
onMounted(async () => {
  try {
    const result = await studentStore.fetchStudents({ page: 1, pageSize: 1000 })
    students.value = result.list
  } catch (error) {
    console.error('加载学生列表失败:', error)
  }
})

const handleSearch = () => {
  refresh()
}

const handleFilter = () => {
  refresh()
}

// 添加沟通记录
const handleAdd = () => {
  dialogVisible.value = true
}

// 查看详情
const handleView = (record: CommunicationRecord) => {
  currentRecord.value = record
  detailDialogVisible.value = true
}

// 标记已解决 -> 联动重新计算该学生因沟通产生的风险
const handleResolve = async (record: CommunicationRecord) => {
  try {
    await communicationStore.markAsResolved(record.id)
    riskStore.syncCommunicationResolved(record.studentId)
    ElMessage.success('已标记为已解决，该学生风险等级已更新')
    refresh()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除
const handleDelete = async (record: CommunicationRecord) => {
  try {
    await ElMessageBox.confirm('确定要删除该沟通记录吗?', '提示', {
      type: 'warning'
    })
    await communicationStore.deleteCommunication(record.id)
    ElMessage.success('删除成功')
    refresh()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 表单提交
const handleFormSubmit = async (formData: CommunicationFormData) => {
  formLoading.value = true
  try {
    await communicationStore.createCommunication(formData)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    refresh()
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    formLoading.value = false
  }
}

// 表单取消
const handleFormCancel = () => {
  dialogVisible.value = false
  communicationFormRef.value?.resetForm()
}

const getTypeColor = (type: string): 'primary' | 'success' | 'warning' | 'info' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
    question: 'primary',
    feedback: 'success',
    parent: 'warning',
    other: 'info'
  }
  return map[type] || 'info'
}
</script>

<style scoped lang="scss">
.communication-page {
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

.detail-content {
  .content-text {
    line-height: 1.8;
    white-space: pre-wrap;
    color: #303133;
  }
}
</style>
