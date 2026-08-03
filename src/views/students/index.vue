<template>
  <div class="students-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生列表</span>
          <div class="header-actions">
            <el-button type="success" :icon="Download" @click="handleExportCsv">
              导出CSV
            </el-button>
            <el-button
              type="warning"
              :icon="Bell"
              :disabled="selectedStudents.length === 0"
              @click="handleBatchFollowUp"
            >
              批量跟进{{ selectedStudents.length > 0 ? `(${selectedStudents.length})` : '' }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">添加学生</el-button>
          </div>
        </div>
      </template>

      <!-- 使用 StudentFilter 组件 -->
      <StudentFilter
        v-model="filterParams"
        @search="handleSearch"
        @reset="handleReset"
      />

      <el-table
        :data="pagedData"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="姓名" width="140">
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
        <el-table-column label="风险等级" width="110" prop="riskLevel" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(getRiskLevel(row.id))" effect="dark">
              {{ formatRiskLevel(getRiskLevel(row.id)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阈值来源" width="130">
          <template #default="{ row }">
            <el-tooltip
              v-if="getThresholdSource(row.id) === 'group'"
              :content="`使用分组阈值：${getThresholdGroup(row.id)}`"
              placement="top"
            >
              <el-tag type="primary" size="small" effect="plain">
                分组 · {{ getThresholdGroup(row.id) }}
              </el-tag>
            </el-tooltip>
            <el-tag v-else type="info" size="small" effect="plain">全局</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风险明细" min-width="220">
          <template #default="{ row }">
            <div class="risk-dimensions">
              <el-tooltip
                v-for="dim in getRiskDimensions(row.id)"
                :key="dim.dimension"
                :content="dim.description"
                placement="top"
              >
                <el-tag
                  size="small"
                  :type="dim.isTriggered ? 'danger' : 'info'"
                  :effect="dim.isTriggered ? 'dark' : 'plain'"
                  class="dim-tag"
                >
                  {{ dim.label }}
                </el-tag>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="averageScore" label="平均分" width="100" sortable="custom" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button
              link
              type="warning"
              @click="handleFollowUp(row)"
            >
              跟进
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="filteredTotal"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 添加/编辑学生对话框 -->
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

    <!-- 跟进沟通对话框 -->
    <el-dialog
      v-model="followUpDialogVisible"
      :title="followUpDialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <FollowUpForm
        ref="followUpFormRef"
        :students="followUpTargetStudents"
        :risk-level="followUpRiskLevel"
        :loading="followUpLoading"
        :default-title="followUpDefaultTitle"
        @submit="handleFollowUpSubmit"
        @cancel="followUpDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Bell, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useStudentStore, useRiskStore } from '@/stores'
import { formatStatus, formatRiskLevel, getRiskTagType } from '@/utils/format'
import { buildRiskExportData, exportRiskCsv } from '@/utils/riskCsv'
import StudentFilter from './components/StudentFilter.vue'
import type { StudentFilterValue } from './components/StudentFilter.vue'
import StudentForm from './components/StudentForm.vue'
import FollowUpForm from './components/FollowUpForm.vue'
import type { Student, StudentFormData } from '@/types/student'
import type {
  StudentRiskResult,
  RiskLevel,
  RiskDimensionDetail
} from '@/types/risk'

const router = useRouter()
const route = useRoute()
const studentStore = useStudentStore()
const riskStore = useRiskStore()

// 筛选参数
const filterParams = ref<StudentFilterValue>({})

// 表格数据
const loading = ref(false)
const allStudents = ref<Student[]>([])
const selectedStudents = ref<Student[]>([])
const pagination = ref({
  page: 1,
  pageSize: 20
})

// 排序
const sortParams = ref<{ prop: string; order: 'ascending' | 'descending' | null }>({
  prop: '',
  order: null
})

// 对话框相关
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentStudent = ref<Partial<StudentFormData>>({})
const formLoading = ref(false)
const studentFormRef = ref()

// 跟进对话框
const followUpDialogVisible = ref(false)
const followUpTargetStudents = ref<Student[]>([])
const followUpLoading = ref(false)
const followUpFormRef = ref()

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '添加学生' : '编辑学生'
})

const followUpDialogTitle = computed(() => {
  return followUpTargetStudents.value.length > 1
    ? `批量跟进 (${followUpTargetStudents.value.length}人)`
    : '发起跟进沟通'
})

const followUpRiskLevel = computed<RiskLevel>(() => {
  const levels = followUpTargetStudents.value.map(s => {
    const risk = riskStore.getStudentRisk(s.id)
    return risk?.level || 'low'
  })
  if (levels.includes('high')) return 'high'
  if (levels.includes('medium')) return 'medium'
  return 'low'
})

const followUpDefaultTitle = computed(() => {
  if (followUpTargetStudents.value.length === 1) {
    const student = followUpTargetStudents.value[0]
    const risk = riskStore.getStudentRisk(student.id)
    const reasons: string[] = []
    risk?.dimensions.forEach(d => {
      if (d.isTriggered) reasons.push(d.label)
    })
    return reasons.length > 0 ? `${student.name} - ${reasons.join('、')}跟进` : `${student.name} 学情跟进`
  }
  return '批量学情跟进'
})

// 风险结果映射（响应式，依赖 riskStore 的 getters）
const riskMap = computed<Record<string, StudentRiskResult>>(() => {
  return riskStore.riskResultMap
})

const getRiskLevel = (studentId: string): RiskLevel => {
  return riskMap.value[studentId]?.level || 'low'
}

const getThresholdSource = (studentId: string): 'global' | 'group' => {
  return riskMap.value[studentId]?.thresholdSource || 'global'
}

const getThresholdGroup = (studentId: string): string => {
  return riskMap.value[studentId]?.thresholdGroup || ''
}

const getRiskDimensions = (studentId: string): RiskDimensionDetail[] => {
  return riskMap.value[studentId]?.dimensions || []
}

// 风险等级排序权重
const riskLevelWeight = (level: RiskLevel): number => {
  const weights: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 }
  return weights[level]
}

// 筛选+排序后的完整数据（先筛选排序，再分页，保证翻页不串数据）
const filteredData = computed<Student[]>(() => {
  let list = [...allStudents.value]

  const fp = filterParams.value

  if (fp.keyword) {
    const keyword = fp.keyword.toLowerCase()
    list = list.filter(
      s =>
        s.name.toLowerCase().includes(keyword) ||
        s.phone.includes(keyword) ||
        s.parentPhone.includes(keyword)
    )
  }
  if (fp.status) {
    list = list.filter(s => s.status === fp.status)
  }
  if (fp.level) {
    list = list.filter(s => s.level === fp.level)
  }
  if (fp.group) {
    list = list.filter(s => s.group === fp.group)
  }
  if (fp.grade) {
    list = list.filter(s => s.grade === fp.grade)
  }
  if (fp.tags && fp.tags.length > 0) {
    list = list.filter(s => fp.tags!.some(tag => s.tags.includes(tag)))
  }
  if (fp.riskLevel) {
    list = list.filter(s => getRiskLevel(s.id) === fp.riskLevel)
  }

  // 排序
  if (sortParams.value.prop && sortParams.value.order) {
    const { prop, order } = sortParams.value
    const dir = order === 'ascending' ? 1 : -1
    list.sort((a, b) => {
      if (prop === 'riskLevel') {
        return (riskLevelWeight(getRiskLevel(a.id)) - riskLevelWeight(getRiskLevel(b.id))) * dir
      }
      if (prop === 'averageScore') {
        return (a.averageScore - b.averageScore) * dir
      }
      return 0
    })
  } else {
    // 默认按风险等级从高到低排序
    list.sort((a, b) => riskLevelWeight(getRiskLevel(b.id)) - riskLevelWeight(getRiskLevel(a.id)))
  }

  return list
})

const filteredTotal = computed(() => filteredData.value.length)

// 当前页数据
const pagedData = computed<Student[]>(() => {
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredData.value.slice(start, end)
})

// 加载数据（加载全量学生，风险在本地实时计算）
const loadData = async () => {
  loading.value = true
  try {
    const response = await studentStore.fetchStudents({
      page: 1,
      pageSize: 10000
    })
    allStudents.value = response.list
  } catch (error) {
    console.error('加载学生数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
}

// 重置
const handleReset = () => {
  filterParams.value = {}
  pagination.value.page = 1
}

// 排序
const handleSortChange = ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => {
  sortParams.value = { prop, order }
  pagination.value.page = 1
}

// 页码改变
const handlePageChange = (page: number) => {
  pagination.value.page = page
}

// 每页数量改变
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
}

// 多选
const handleSelectionChange = (selection: Student[]) => {
  selectedStudents.value = selection
}

// 添加学生
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

// 查看详情
const handleView = (row: Student) => {
  router.push(`/students/detail/${row.id}`)
}

// 编辑学生
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

// 单人跟进
const handleFollowUp = (row: Student) => {
  followUpTargetStudents.value = [row]
  followUpDialogVisible.value = true
}

// 批量跟进
const handleBatchFollowUp = () => {
  if (selectedStudents.value.length === 0) return
  followUpTargetStudents.value = [...selectedStudents.value]
  followUpDialogVisible.value = true
}

// 提交跟进
const handleFollowUpSubmit = async (data: { title: string; content: string }) => {
  followUpLoading.value = true
  try {
    const ids = followUpTargetStudents.value.map(s => s.id)
    if (ids.length === 1) {
      riskStore.createFollowUp({
        studentId: ids[0],
        title: data.title,
        content: data.content
      })
    } else {
      riskStore.batchCreateFollowUps(ids, data.title, data.content)
    }
    ElMessage.success(`已发起 ${ids.length} 条跟进`)
    followUpDialogVisible.value = false
    followUpFormRef.value?.resetForm()
  } catch (error) {
    console.error('发起跟进失败:', error)
    ElMessage.error('发起跟进失败')
  } finally {
    followUpLoading.value = false
  }
}

// 导出当前筛选结果为 CSV（含基础信息、风险等级、各指标命中值、最近跟进时间）
const handleExportCsv = () => {
  const rows = buildRiskExportData(
    filteredData.value,
    riskStore.riskResults,
    riskStore.followUps
  )
  if (rows.length === 0) {
    ElMessage.warning('当前没有可导出的预警名单')
    return
  }
  exportRiskCsv(rows)
  ElMessage.success(`已导出 ${rows.length} 条记录`)
}

// 表单提交
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
  } catch (error) {
    ElMessage.error(dialogMode.value === 'add' ? '添加失败' : '编辑失败')
  } finally {
    formLoading.value = false
  }
}

// 表单取消
const handleFormCancel = () => {
  dialogVisible.value = false
  studentFormRef.value?.resetForm()
}

const getStatusType = (status: string): 'success' | 'info' | 'warning' => {
  const map: Record<string, 'success' | 'info' | 'warning'> = {
    active: 'success',
    inactive: 'info',
    graduated: 'warning'
  }
  return map[status] || 'info'
}

// 从路由 query 初始化风险筛选（首页跳转时带入）
watch(
  () => route.query.riskLevel,
  newRiskLevel => {
    if (newRiskLevel && typeof newRiskLevel === 'string') {
      filterParams.value = { ...filterParams.value, riskLevel: newRiskLevel as RiskLevel }
      pagination.value.page = 1
    }
  },
  { immediate: true }
)

// 组件挂载时加载数据
onMounted(() => {
  riskStore.initFollowUps()
  loadData()
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

.risk-dimensions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .dim-tag {
    cursor: default;
  }
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
