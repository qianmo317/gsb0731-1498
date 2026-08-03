<template>
  <div class="students-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生列表</span>
          <div class="header-actions">
            <el-button :icon="Setting" @click="thresholdDialogVisible = true">
              预警设置
            </el-button>
            <el-button :icon="Download" @click="handleExportCsv">导出CSV</el-button>
            <el-button
              type="warning"
              :icon="Bell"
              :disabled="selectedStudents.length === 0"
              @click="handleBatchFollowUp"
            >
              批量跟进<span v-if="selectedStudents.length > 0">（{{ selectedStudents.length }}）</span>
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">添加学生</el-button>
          </div>
        </div>
      </template>

      <StudentFilter
        v-model="filterParams"
        @search="handleSearch"
        @reset="handleReset"
      />

      <div v-if="filterParams.pendingFollowUp" class="filter-indicator">
        <el-tag type="primary" closable @close="clearPendingFollowUp">
          待跟进学生（高风险或有未解决沟通）
        </el-tag>
      </div>

      <el-table
        ref="tableRef"
        :data="data"
        v-loading="loading || riskLoading"
        stripe
        row-key="id"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" reserve-selection />
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <div class="student-info">
              <el-avatar :size="32" :src="row.avatar" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="group" label="分组" width="100" />
        <el-table-column label="风险等级" width="120" sortable="custom" prop="riskLevel">
          <template #default="{ row }">
            <RiskTag :risk="getRisk(row.id)" />
          </template>
        </el-table-column>
        <el-table-column prop="level" label="成绩等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">
              {{ formatLevel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="averageScore" label="平均分" width="100" sortable />
        <el-table-column prop="completedHomework" label="完成作业" width="100">
          <template #default="{ row }">
            {{ row.completedHomework }}/{{ row.totalHomework }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button
              v-if="getRisk(row.id)?.level === 'high'"
              link
              type="danger"
              @click="handleSingleFollowUp(row)"
            >
              发起跟进
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <StudentForm
        ref="studentFormRef"
        :model-value="currentStudent"
        :loading="formLoading"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </el-dialog>

    <FollowUpDialog
      v-model="followUpDialogVisible"
      :students="followUpStudents"
      @submit="handleFollowUpSubmit"
    />

    <RiskThresholdDialog
      v-model="thresholdDialogVisible"
      :thresholds="riskStore.thresholds"
      :group-thresholds="riskStore.groupThresholds"
      :groups="studentGroups"
      @save="handleThresholdSave"
      @reset="handleThresholdReset"
      @save-group="handleGroupThresholdSave"
      @clear-group="handleGroupThresholdClear"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Setting, Bell, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStudentStore, useRiskStore, useCommunicationStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import StudentFilter from './components/StudentFilter.vue'
import StudentForm from './components/StudentForm.vue'
import RiskTag from './components/RiskTag.vue'
import FollowUpDialog from './components/FollowUpDialog.vue'
import RiskThresholdDialog from './components/RiskThresholdDialog.vue'
import type { Student, StudentFormData, StudentFilterParams } from '@/types/student'
import type { CommunicationFormData } from '@/types/communication'
import type { RiskThresholdConfig, RiskLevel } from '@/types/risk'
import { buildRiskExportData, exportRiskToCsv } from '@/utils/csv'

const router = useRouter()
const route = useRoute()
const studentStore = useStudentStore()
const riskStore = useRiskStore()
const communicationStore = useCommunicationStore()

const initialRiskLevel = route.query.riskLevel as RiskLevel | undefined
const initialPendingFollowUp = route.query.pendingFollowUp === 'true'
const filterParams = ref<StudentFilterParams>(
  initialPendingFollowUp
    ? { pendingFollowUp: true }
    : initialRiskLevel && ['high', 'medium', 'low'].includes(initialRiskLevel)
      ? { riskLevel: initialRiskLevel }
      : {}
)
const loading = ref(false)
const data = ref<Student[]>([])
const total = ref(0)
const pagination = ref({
  page: 1,
  pageSize: 20
})
const sortField = ref<string>('')
const sortOrderState = ref<'ascending' | 'descending' | null>(null)

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentStudent = ref<Partial<StudentFormData>>({})
const formLoading = ref(false)
const studentFormRef = ref()

const followUpDialogVisible = ref(false)
const followUpStudents = ref<Student[]>([])
const thresholdDialogVisible = ref(false)
const selectedStudents = ref<Student[]>([])
const tableRef = ref()

const riskLoading = computed(() => riskStore.loading)

const studentGroups = computed(() => {
  const groups = new Set<string>()
  riskStore.studentRisks.forEach(r => {
    if (r.studentGroup) groups.add(r.studentGroup)
  })
  return Array.from(groups).sort()
})

const exporting = ref(false)

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '添加学生' : '编辑学生'
})

const getRisk = (studentId: string) => {
  return riskStore.getRiskByStudentId(studentId)
}

const getRiskStudentIds = (level?: string): string[] | undefined => {
  if (!level) return undefined
  return riskStore.getStudentsByRiskLevel(level as 'high' | 'medium' | 'low')
    .map(r => r.studentId)
}

const getPendingFollowUpIds = (): string[] => {
  return riskStore.pendingFollowUpStudents.map(r => r.studentId)
}

const getOrderedIdsByRiskScore = (): string[] | undefined => {
  if (sortField.value !== 'riskLevel' || !sortOrderState.value) return undefined
  return riskStore.allRisksSortedByScore(sortOrderState.value).map(r => r.studentId)
}

const loadData = async () => {
  loading.value = true
  try {
    let studentIds: string[] | undefined

    if (filterParams.value.pendingFollowUp) {
      studentIds = getPendingFollowUpIds()
    } else if (filterParams.value.riskLevel) {
      studentIds = getRiskStudentIds(filterParams.value.riskLevel)
    }

    const orderedIds = getOrderedIdsByRiskScore()

    const response = await studentStore.fetchStudents({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...filterParams.value,
      studentIds,
      orderedIds,
      sortProp: sortField.value && sortField.value !== 'riskLevel' ? sortField.value : undefined,
      sortOrder: sortField.value && sortField.value !== 'riskLevel' ? sortOrderState.value : undefined,
      riskLevel: undefined,
      pendingFollowUp: undefined
    })

    data.value = response.list
    total.value = response.total
  } catch (error) {
    console.error('加载学生数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadRiskData = async () => {
  try {
    await riskStore.calculateRisks()
  } catch (error) {
    console.error('加载风险数据失败:', error)
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  tableRef.value?.clearSelection()
  loadData()
}

const handleReset = () => {
  filterParams.value = {}
  pagination.value.page = 1
  tableRef.value?.clearSelection()
  loadData()
}

const clearPendingFollowUp = () => {
  filterParams.value.pendingFollowUp = undefined
  pagination.value.page = 1
  loadData()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadData()
}

const handleSortChange = ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => {
  sortField.value = prop
  sortOrderState.value = order
  pagination.value.page = 1
  loadData()
}

const handleSelectionChange = (selection: Student[]) => {
  selectedStudents.value = selection
}

const handleSingleFollowUp = (row: Student) => {
  followUpStudents.value = [row]
  followUpDialogVisible.value = true
}

const handleBatchFollowUp = () => {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择要跟进的学生')
    return
  }
  followUpStudents.value = [...selectedStudents.value]
  followUpDialogVisible.value = true
}

const handleFollowUpSubmit = async (records: CommunicationFormData[]) => {
  try {
    for (const record of records) {
      await communicationStore.createCommunication(record)
    }
    ElMessage.success(`已成功发起 ${records.length} 条跟进沟通`)
    followUpDialogVisible.value = false
    followUpStudents.value = []
    await riskStore.calculateRisks()
  } catch (error) {
    console.error('发起跟进失败:', error)
    ElMessage.error('发起跟进失败')
  }
}

const handleThresholdSave = async (thresholds: RiskThresholdConfig) => {
  try {
    await riskStore.updateThresholds(thresholds)
  } catch (error) {
    console.error('保存阈值失败:', error)
    ElMessage.error('保存阈值失败')
  }
}

const handleThresholdReset = async () => {
  try {
    await riskStore.resetThresholds()
  } catch (error) {
    console.error('重置阈值失败:', error)
  }
}

const handleGroupThresholdSave = async ({
  group,
  thresholds
}: {
  group: string
  thresholds: Partial<RiskThresholdConfig>
}) => {
  try {
    await riskStore.updateGroupThresholds(group, thresholds)
  } catch (error) {
    console.error('保存分组阈值失败:', error)
    ElMessage.error('保存分组阈值失败')
  }
}

const handleGroupThresholdClear = async (group: string) => {
  try {
    await riskStore.removeGroupThresholds(group)
  } catch (error) {
    console.error('清除分组阈值失败:', error)
    ElMessage.error('清除分组阈值失败')
  }
}

const handleExportCsv = async () => {
  if (exporting.value) return
  exporting.value = true
  try {
    let studentIds: string[] | undefined
    if (filterParams.value.pendingFollowUp) {
      studentIds = riskStore.pendingFollowUpStudents.map(r => r.studentId)
    } else if (filterParams.value.riskLevel) {
      studentIds = riskStore.getStudentsByRiskLevel(filterParams.value.riskLevel).map(r => r.studentId)
    }

    const response = await studentStore.fetchStudents({
      page: 1,
      pageSize: 9999,
      ...filterParams.value,
      studentIds,
      riskLevel: undefined,
      pendingFollowUp: undefined
    })

    const rows = buildRiskExportData(response.list, riskStore.studentRisks)
    exportRiskToCsv(rows)
    ElMessage.success(`已导出 ${rows.length} 条预警名单`)
  } catch (error) {
    console.error('导出CSV失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const handleAdd = () => {
  dialogMode.value = 'add'
  currentStudent.value = {
    gender: 'male',
    age: 10,
    level: 'average',
    tags: [],
    status: 'active',
    enrollDate: new Date().toISOString().split('T')[0]
  }
  dialogVisible.value = true
}

const handleView = (row: Student) => {
  router.push(`/students/detail/${row.id}`)
}

const handleEdit = (row: Student) => {
  dialogMode.value = 'edit'
  currentStudent.value = {
    name: row.name,
    gender: row.gender,
    age: row.age,
    grade: row.grade,
    phone: row.phone,
    email: row.email,
    parentName: row.parentName,
    parentPhone: row.parentPhone,
    status: row.status,
    level: row.level,
    tags: row.tags,
    group: row.group,
    enrollDate: row.enrollDate,
    notes: row.notes
  }
  dialogVisible.value = true
}

const handleDelete = async (row: Student) => {
  try {
    await ElMessageBox.confirm('确定要删除该学生吗?', '提示', {
      type: 'warning'
    })
    await studentStore.deleteStudent(row.id)
    ElMessage.success('删除成功')
    loadData()
    riskStore.calculateRisks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleFormSubmit = async (formData: StudentFormData) => {
  formLoading.value = true
  try {
    if (dialogMode.value === 'add') {
      await studentStore.createStudent(formData)
      ElMessage.success('添加成功')
    } else {
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
    loadData()
    riskStore.calculateRisks()
  } catch (error) {
    ElMessage.error(dialogMode.value === 'add' ? '添加失败' : '编辑失败')
  } finally {
    formLoading.value = false
  }
}

const handleFormCancel = () => {
  dialogVisible.value = false
  studentFormRef.value?.resetForm()
}

const getLevelType = (level: string) => {
  const map: Record<string, string> = {
    excellent: 'success',
    good: 'primary',
    average: 'warning',
    poor: 'danger'
  }
  return map[level] || 'info'
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    graduated: 'warning'
  }
  return map[status] || 'info'
}

const formatLevel = (level: string) => {
  const map: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    average: '一般',
    poor: '较差'
  }
  return map[level] || level
}

onMounted(async () => {
  await loadRiskData()
  await loadData()
})
</script>

<style scoped lang="scss">
.students-page {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.student-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-indicator {
  margin-bottom: 16px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
