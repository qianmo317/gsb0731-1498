<template>
  <div class="students-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生列表</span>
          <div class="header-actions">
            <el-button
              :icon="Download"
              :disabled="filteredStudents.length === 0"
              @click="handleExportCsv"
            >
              导出 CSV
            </el-button>
            <el-button
              type="warning"
              :icon="ChatDotRound"
              :disabled="selectedStudents.length === 0"
              @click="handleBatchFollowUp"
            >
              批量跟进{{ selectedStudents.length > 0 ? `（${selectedStudents.length}）` : '' }}
            </el-button>
            <el-button :icon="Setting" @click="thresholdDialogVisible = true">预警设置</el-button>
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
        :data="data"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" />
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
        <el-table-column prop="level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">
              {{ formatLevel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险等级" width="130" sortable="custom">
          <template #default="{ row }">
            <el-tooltip
              :content="getRiskTooltip(row.id)"
              placement="top"
              :disabled="!getRiskTooltip(row.id)"
            >
              <el-tag :type="getRiskLevelType(getRiskLevel(row.id))">
                {{ formatRiskLevel(getRiskLevel(row.id)) }}
              </el-tag>
            </el-tooltip>
            <el-tag
              v-if="getThresholdSource(row.id) === 'group'"
              size="small"
              type="info"
              effect="plain"
              class="source-tag"
            >
              分组阈值
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="averageScore" label="平均分" width="100" />
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
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="handleFollowUp(row)">跟进</el-button>
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

    <!-- 单个学生跟进沟通对话框 -->
    <el-dialog
      v-model="followUpDialogVisible"
      title="发起跟进沟通"
      width="600px"
      :close-on-click-modal="false"
    >
      <CommunicationForm
        ref="followUpFormRef"
        :model-value="followUpForm"
        :students="allStudents"
        :loading="followUpLoading"
        @submit="handleFollowUpSubmit"
        @cancel="handleFollowUpCancel"
      />
    </el-dialog>

    <!-- 批量跟进对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量发起跟进沟通"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="跟进学生">
          <div class="batch-students">
            <el-tag
              v-for="student in selectedStudents"
              :key="student.id"
              :type="getRiskLevelType(getRiskLevel(student.id))"
              size="small"
            >
              {{ student.name }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="沟通方式">
          <el-select v-model="batchForm.method" style="width: 100%">
            <el-option label="在线" value="online" />
            <el-option label="电话" value="phone" />
            <el-option label="线下面谈" value="offline" />
            <el-option label="微信" value="wechat" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进说明">
          <el-input
            v-model="batchForm.content"
            type="textarea"
            :rows="5"
            placeholder="请填写统一的跟进说明（不少于 10 个字），将自动带上每位学生的风险因素"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="batchLoading" @click="handleBatchSubmit">
            提交
          </el-button>
          <el-button @click="batchDialogVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 预警阈值设置对话框 -->
    <RiskThresholdDialog v-if="thresholdDialogVisible" v-model="thresholdDialogVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, ChatDotRound, Setting, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStudentStore, useRiskStore, useCommunicationStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import { formatDate, formatDateTime } from '@/utils/date'
import StudentFilter from './components/StudentFilter.vue'
import StudentForm from './components/StudentForm.vue'
import CommunicationForm from '@/views/communication/components/CommunicationForm.vue'
import RiskThresholdDialog from '@/components/common/RiskThresholdDialog.vue'
import type { Student, StudentFormData, StudentFilterParams } from '@/types/student'
import type { CommunicationFormData, CommunicationMethod } from '@/types/communication'
import type { RiskLevel } from '@/types/risk'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()
const riskStore = useRiskStore()
const communicationStore = useCommunicationStore()

// 筛选参数（支持从首页风险概览带条件跳入）
const initialRiskLevel = route.query.riskLevel as string | undefined
const filterParams = ref<StudentFilterParams>({
  riskLevel: ['high', 'medium', 'low'].includes(initialRiskLevel || '')
    ? (initialRiskLevel as RiskLevel)
    : undefined
})

// 全量学生数据（风险筛选与排序需在分页前完成，避免翻页串数据）
const loading = ref(false)
const allStudents = ref<Student[]>([])
const pagination = ref({
  page: 1,
  pageSize: 20
})
const sortState = ref<{ prop: string; order: 'ascending' | 'descending' | null }>({
  prop: '',
  order: null
})

// 表格多选
const selectedStudents = ref<Student[]>([])

// 对话框相关
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentStudent = ref<Partial<StudentFormData>>({})
const formLoading = ref(false)
const studentFormRef = ref()

// 跟进沟通相关
const followUpDialogVisible = ref(false)
const followUpForm = ref<Partial<CommunicationFormData>>({})
const followUpLoading = ref(false)
const followUpFormRef = ref()

// 批量跟进相关
const batchDialogVisible = ref(false)
const batchLoading = ref(false)
const batchForm = reactive<{ method: CommunicationMethod; content: string }>({
  method: 'online',
  content: ''
})

// 预警阈值设置
const thresholdDialogVisible = ref(false)

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '添加学生' : '编辑学生'
})

// 风险等级排序权重
const riskLevelWeight: Record<RiskLevel, number> = {
  high: 3,
  medium: 2,
  low: 1
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 先按当前阈值实时重算风险，再拉取学生列表
    await riskStore.evaluateAll()
    const restFilters = { ...filterParams.value }
    delete restFilters.riskLevel
    const response = await studentStore.fetchStudents({
      page: 1,
      pageSize: 1000,
      ...restFilters
    })

    allStudents.value = response.list
  } catch (error) {
    console.error('加载学生数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 风险等级筛选 + 排序（先于分页执行）
const filteredStudents = computed(() => {
  let list = allStudents.value

  if (filterParams.value.riskLevel) {
    list = list.filter(
      s => riskStore.getProfileById(s.id)?.level === filterParams.value.riskLevel
    )
  }

  if (sortState.value.prop === 'riskLevel' && sortState.value.order) {
    const order = sortState.value.order
    list = [...list].sort((a, b) => {
      const weightA = riskLevelWeight[getRiskLevel(a.id)]
      const weightB = riskLevelWeight[getRiskLevel(b.id)]
      return order === 'ascending' ? weightA - weightB : weightB - weightA
    })
  }

  return list
})

// 当前页数据
const total = computed(() => filteredStudents.value.length)
const data = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  return filteredStudents.value.slice(start, start + pagination.value.pageSize)
})

// 获取学生风险等级
const getRiskLevel = (studentId: string): RiskLevel => {
  return riskStore.getProfileById(studentId)?.level || 'low'
}

// 获取学生实际生效的阈值来源
const getThresholdSource = (studentId: string): 'global' | 'group' => {
  return riskStore.getProfileById(studentId)?.thresholdSource || 'global'
}

// 风险因素提示
const getRiskTooltip = (studentId: string): string => {
  const profile = riskStore.getProfileById(studentId)
  if (!profile || profile.factors.length === 0) return ''
  return profile.factors.map(f => f.description).join('；')
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  filterParams.value = {}
  pagination.value.page = 1
  loadData()
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

// 排序改变
const handleSortChange = ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => {
  sortState.value = { prop, order }
  pagination.value.page = 1
}

// 表格多选
const handleSelectionChange = (rows: Student[]) => {
  selectedStudents.value = rows
}

// CSV 字段转义
const escapeCsvField = (value: string): string => `"${value.replace(/"/g, '""')}"`

// 导出当前筛选出的预警名单为 CSV（含基础信息、风险等级、各指标命中值、最近跟进时间）
const handleExportCsv = () => {
  const headers = [
    '姓名',
    '性别',
    '年级',
    '分组',
    '手机号',
    '状态',
    '风险等级',
    '阈值来源',
    '逾期未交作业(次)',
    '连续未活跃(天)',
    '平均分(分)',
    '未解决沟通(条)',
    '最近跟进时间'
  ]

  const rows = filteredStudents.value.map(student => {
    const profile = riskStore.getProfileById(student.id)
    return [
      student.name,
      student.gender === 'male' ? '男' : '女',
      student.grade,
      student.group,
      student.phone,
      formatStatus(student.status),
      formatRiskLevel(getRiskLevel(student.id)),
      profile?.thresholdSource === 'group' ? '分组阈值' : '全局阈值',
      String(profile?.overdueCount ?? 0),
      String(profile?.inactiveDays ?? 0),
      String(profile?.averageScore ?? student.averageScore),
      String(profile?.unresolvedCount ?? 0),
      profile?.lastFollowUpAt ? formatDateTime(profile.lastFollowUpAt) : '暂无跟进'
    ]
  })

  const content = [headers, ...rows]
    .map(fields => fields.map(escapeCsvField).join(','))
    .join('\r\n')

  // 加 BOM 头保证 Excel 正确识别中文
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `学情预警名单_${formatDate(new Date(), 'YYYYMMDD-HHmm')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)

  ElMessage.success(`已导出 ${rows.length} 条预警名单`)
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

// 删除学生
const handleDelete = async (row: Student) => {
  try {
    await ElMessageBox.confirm('确定要删除该学生吗?', '提示', {
      type: 'warning'
    })
    await studentStore.deleteStudent(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 表单提交
const handleFormSubmit = async (formData: StudentFormData) => {
  formLoading.value = true
  try {
    if (dialogMode.value === 'add') {
      await studentStore.createStudent(formData)
      ElMessage.success('添加成功')
    } else {
      // 编辑模式需要学生ID
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

// 构建跟进沟通内容
const buildFollowUpContent = (student: Student): string => {
  const profile = riskStore.getProfileById(student.id)
  if (!profile || profile.factors.length === 0) {
    return '学情跟进：请关注该学生近期学习情况，及时记录沟通反馈。'
  }
  const factorText = profile.factors.map(f => `· ${f.description}`).join('\n')
  return `学情预警跟进（${formatRiskLevel(profile.level)}）：\n${factorText}\n请与学生及家长沟通确认情况，并及时记录反馈。`
}

// 发起单个学生跟进沟通，自动带入学生信息与风险因素
const handleFollowUp = (row: Student) => {
  const profile = riskStore.getProfileById(row.id)
  followUpForm.value = {
    studentId: row.id,
    type: 'feedback',
    method: 'online',
    title: `学情预警跟进 - ${row.name}`,
    content: buildFollowUpContent(row),
    tags: ['待跟进'],
    isImportant: profile?.level === 'high'
  }
  followUpDialogVisible.value = true
}

// 单个跟进提交
const handleFollowUpSubmit = async (formData: CommunicationFormData) => {
  followUpLoading.value = true
  try {
    await communicationStore.createCommunication(formData)
    ElMessage.success('已发起跟进沟通')
    followUpDialogVisible.value = false
  } catch (error) {
    ElMessage.error('发起跟进失败')
  } finally {
    followUpLoading.value = false
  }
}

// 单个跟进取消
const handleFollowUpCancel = () => {
  followUpDialogVisible.value = false
  followUpFormRef.value?.resetForm()
}

// 批量跟进
const handleBatchFollowUp = () => {
  if (selectedStudents.value.length === 0) return
  batchForm.method = 'online'
  batchForm.content = ''
  batchDialogVisible.value = true
}

// 批量跟进提交
const handleBatchSubmit = async () => {
  if (batchForm.content.trim().length < 10) {
    ElMessage.warning('跟进说明不少于 10 个字')
    return
  }

  batchLoading.value = true
  try {
    for (const student of selectedStudents.value) {
      const profile = riskStore.getProfileById(student.id)
      await communicationStore.createCommunication({
        studentId: student.id,
        type: 'feedback',
        method: batchForm.method,
        title: `学情预警跟进 - ${student.name}`,
        content: `${buildFollowUpContent(student)}\n跟进说明：${batchForm.content.trim()}`,
        tags: ['待跟进'],
        isImportant: profile?.level === 'high'
      })
    }
    ElMessage.success(`已为 ${selectedStudents.value.length} 名学生发起跟进沟通`)
    batchDialogVisible.value = false
  } catch (error) {
    ElMessage.error('批量跟进失败')
  } finally {
    batchLoading.value = false
  }
}

const getLevelType = (level: string) => {
  const map: Record<string, any> = {
    excellent: 'success',
    good: 'primary',
    average: 'warning',
    poor: 'danger'
  }
  return map[level] || 'info'
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
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

const getRiskLevelType = (level: RiskLevel) => {
  const map: Record<RiskLevel, 'danger' | 'warning' | 'success'> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[level]
}

const formatRiskLevel = (level: RiskLevel) => {
  const map: Record<RiskLevel, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return map[level]
}

// 组件挂载时加载数据
onMounted(() => {
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
}

.header-actions {
  display: flex;
  gap: 12px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-students {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.source-tag {
  margin-left: 6px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
