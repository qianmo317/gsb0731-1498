<template>
  <div class="students-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生列表</span>
          <div class="header-actions">
            <el-button :icon="Download" @click="handleExport">导出名单</el-button>
            <el-button :icon="Setting" @click="thresholdDialogVisible = true">预警阈值</el-button>
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

      <!-- 风险筛选与批量操作 -->
      <div class="risk-toolbar">
        <div class="risk-filter">
          <span class="label">风险等级</span>
          <el-select
            v-model="riskLevel"
            placeholder="全部等级"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="高风险" value="high" />
            <el-option label="中风险" value="medium" />
            <el-option label="低风险" value="low" />
          </el-select>
          <el-select
            v-model="sortOrder"
            placeholder="风险排序"
            style="width: 170px"
            @change="handleSearch"
          >
            <el-option label="风险从高到低" value="descending" />
            <el-option label="风险从低到高" value="ascending" />
          </el-select>
        </div>
        <el-button
          type="danger"
          :icon="Bell"
          :disabled="selectedStudents.length === 0"
          @click="handleBatchFollowUp"
        >
          批量跟进（{{ selectedStudents.length }}）
        </el-button>
      </div>

      <el-table
        ref="tableRef"
        :data="data"
        v-loading="loading"
        stripe
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" :selectable="isSelectable" />
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <div class="student-info">
              <el-avatar :size="32" :src="row.avatar" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="200">
          <template #default="{ row }">
            <el-tooltip
              :disabled="row.risk.reasons.length === 0"
              placement="top"
            >
              <template #content>
                <div v-for="reason in row.risk.reasons" :key="reason">{{ reason }}</div>
              </template>
              <el-tag :type="riskTagType(row.risk.level)" effect="dark">
                {{ riskLabel(row.risk.level) }}
              </el-tag>
            </el-tooltip>
            <el-tag
              class="threshold-source"
              size="small"
              :type="row.risk.thresholdSource === 'group' ? 'warning' : 'info'"
              effect="plain"
            >
              {{ row.risk.thresholdSource === 'group' ? '分组阈值' : '全局阈值' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="90" />
        <el-table-column prop="group" label="分组" width="90" />
        <el-table-column prop="level" label="等级" width="90">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">
              {{ formatStatus(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="averageScore" label="平均分" width="90" />
        <el-table-column prop="completedHomework" label="完成作业" width="100">
          <template #default="{ row }">
            {{ row.completedHomework }}/{{ row.totalHomework }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.risk.level === 'high'"
              link
              type="danger"
              @click="handleFollowUp(row)"
            >
              发起跟进
            </el-button>
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
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

    <!-- 发起跟进对话框 -->
    <FollowUpDialog
      v-model="followUpDialogVisible"
      :students="followUpStudents"
      @success="handleFollowUpSuccess"
    />

    <!-- 预警阈值配置对话框 -->
    <RiskThresholdDialog
      v-model="thresholdDialogVisible"
      :thresholds="riskStore.thresholds"
      :group-thresholds="riskStore.groupThresholds"
      :groups="groups"
      @save-global="handleSaveGlobalThresholds"
      @save-group="handleSaveGroupThresholds"
      @remove-group="handleRemoveGroupThresholds"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Setting, Bell, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStudentStore, useRiskStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import { formatDate } from '@/utils/date'
import { RISK_LEVEL_LABELS, RISK_LEVEL_TAG_TYPES } from '@/utils/risk'
import { toCsv, downloadCsv } from '@/utils/csv'
import StudentFilter from './components/StudentFilter.vue'
import StudentForm from './components/StudentForm.vue'
import FollowUpDialog from './components/FollowUpDialog.vue'
import RiskThresholdDialog from './components/RiskThresholdDialog.vue'
import type { StudentFormData, StudentFilterParams } from '@/types/student'
import type { RiskLevel, StudentRisk, RiskThresholds, RiskExportRow } from '@/types/risk'

const router = useRouter()
const route = useRoute()
const studentStore = useStudentStore()
const riskStore = useRiskStore()

// 筛选参数
const filterParams = ref<StudentFilterParams>({})
const riskLevel = ref<RiskLevel | ''>('')
const sortOrder = ref<'ascending' | 'descending'>('descending')

// 表格数据
const loading = ref(false)
const data = ref<StudentRisk[]>([])
const total = ref(0)
const pagination = ref({
  page: 1,
  pageSize: 20
})

// 多选
const tableRef = ref()
const selectedStudents = ref<StudentRisk[]>([])

// 对话框相关
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentStudent = ref<Partial<StudentFormData>>({})
const formLoading = ref(false)
const studentFormRef = ref()

// 跟进 / 阈值对话框
const followUpDialogVisible = ref(false)
const followUpStudents = ref<StudentRisk[]>([])
const thresholdDialogVisible = ref(false)

// 可配置分组（沿用学生筛选组件的分组口径）
const groups = ['A组', 'B组', 'C组', 'D组']

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '添加学生' : '编辑学生'
})

// 加载数据（统一走风险 store，先筛选排序再分页）
const loadData = async () => {
  loading.value = true
  try {
    const response = await riskStore.fetchStudentRiskList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...filterParams.value,
      riskLevel: riskLevel.value || undefined,
      sortOrder: sortOrder.value
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

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  filterParams.value = {}
  riskLevel.value = ''
  sortOrder.value = 'descending'
  pagination.value.page = 1
  loadData()
}

// 页码改变（切换分页前清空当前页选择，避免跨页串数据）
const handlePageChange = (page: number) => {
  pagination.value.page = page
  tableRef.value?.clearSelection()
  loadData()
}

// 每页数量改变
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  tableRef.value?.clearSelection()
  loadData()
}

// 多选变化
const handleSelectionChange = (selection: StudentRisk[]) => {
  selectedStudents.value = selection
}

const isSelectable = (row: StudentRisk) => row.risk.level !== 'low'

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
const handleView = (row: StudentRisk) => {
  router.push(`/students/detail/${row.id}`)
}

// 编辑学生
const handleEdit = (row: StudentRisk) => {
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
const handleDelete = async (row: StudentRisk) => {
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

// 单个学生发起跟进
const handleFollowUp = (row: StudentRisk) => {
  followUpStudents.value = [row]
  followUpDialogVisible.value = true
}

// 批量跟进
const handleBatchFollowUp = () => {
  if (selectedStudents.value.length === 0) return
  followUpStudents.value = [...selectedStudents.value]
  followUpDialogVisible.value = true
}

// 跟进成功后刷新（沟通产生的风险纳入下次计算）
const handleFollowUpSuccess = () => {
  tableRef.value?.clearSelection()
  loadData()
}

// 保存全局阈值：改完立即按新值重新计算
const handleSaveGlobalThresholds = (thresholds: RiskThresholds) => {
  riskStore.updateThresholds(thresholds)
  ElMessage.success('全局阈值已更新，预警结果已刷新')
  loadData()
}

// 保存分组阈值：仅对该分组生效，改完立即重算
const handleSaveGroupThresholds = (group: string, thresholds: RiskThresholds) => {
  riskStore.setGroupThresholds(group, thresholds)
  ElMessage.success(`${group}分组阈值已更新，预警结果已刷新`)
  loadData()
}

// 移除分组阈值：回退全局
const handleRemoveGroupThresholds = (group: string) => {
  riskStore.removeGroupThresholds(group)
  ElMessage.success(`${group}分组已回退全局阈值`)
  loadData()
}

// 导出当前筛选后的预警名单为 CSV
const handleExport = async () => {
  try {
    const rows: RiskExportRow[] = await riskStore.exportStudentRiskList({
      ...filterParams.value,
      riskLevel: riskLevel.value || undefined,
      sortOrder: sortOrder.value
    })

    if (rows.length === 0) {
      ElMessage.warning('当前筛选结果为空，无可导出数据')
      return
    }

    const headers = [
      '学生姓名',
      '年级',
      '分组',
      '手机号',
      '家长姓名',
      '家长电话',
      '学生等级',
      '平均分',
      '风险等级',
      '阈值来源',
      '逾期未交次数',
      '连续无学习动态天数',
      '低于警戒线分差',
      '未解决沟通条数',
      '最近跟进时间'
    ]

    const body = rows.map(row => [
      row.name,
      row.grade,
      row.group,
      row.phone,
      row.parentName,
      row.parentPhone,
      formatStatus(row.level),
      row.averageScore,
      RISK_LEVEL_LABELS[row.risk.level],
      row.risk.thresholdSource === 'group' ? '分组阈值' : '全局阈值',
      row.risk.dimensions.homework.value,
      row.risk.dimensions.activity.value,
      row.risk.dimensions.score.value,
      row.risk.dimensions.communication.value,
      row.lastFollowUpTime
    ])

    const csv = toCsv(headers, body)
    downloadCsv(`预警名单_${formatDate(new Date())}.csv`, csv)
    ElMessage.success(`已导出 ${rows.length} 条预警名单`)
  } catch (error) {
    ElMessage.error('导出失败')
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

type TagType = 'success' | 'warning' | 'info' | 'primary' | 'danger'

const getLevelType = (level: string): TagType => {
  const map: Record<string, TagType> = {
    excellent: 'success',
    good: 'primary',
    average: 'warning',
    poor: 'danger'
  }
  return map[level] || 'info'
}

// 风险等级标签与颜色（类型安全封装）
const riskLabel = (level: RiskLevel) => RISK_LEVEL_LABELS[level]
const riskTagType = (level: RiskLevel) => RISK_LEVEL_TAG_TYPES[level]

const getStatusType = (status: string): TagType => {
  const map: Record<string, TagType> = {
    active: 'success',
    inactive: 'info',
    graduated: 'warning'
  }
  return map[status] || 'info'
}

// 组件挂载时加载数据（支持从首页概览携带 riskLevel 跳入）
onMounted(() => {
  const queryLevel = route.query.riskLevel
  if (queryLevel === 'high' || queryLevel === 'medium' || queryLevel === 'low') {
    riskLevel.value = queryLevel
  }
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

.risk-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .risk-filter {
    display: flex;
    align-items: center;
    gap: 12px;

    .label {
      font-weight: 500;
      color: #606266;
    }
  }
}

.student-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.threshold-source {
  margin-left: 8px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
