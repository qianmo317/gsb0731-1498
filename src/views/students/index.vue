<template>
  <div class="students-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加学生</el-button>
        </div>
      </template>

      <!-- 使用 StudentFilter 组件 -->
      <StudentFilter
        v-model="filterParams"
        @search="handleSearch"
        @reset="handleReset"
      />

      <el-table :data="data" v-loading="loading" stripe>
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStudentStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import StudentFilter from './components/StudentFilter.vue'
import StudentForm from './components/StudentForm.vue'
import type { Student, StudentFormData, StudentFilterParams } from '@/types/student'

const router = useRouter()
const studentStore = useStudentStore()

// 筛选参数
const filterParams = ref<StudentFilterParams>({})

// 表格数据
const loading = ref(false)
const data = ref<Student[]>([])
const total = ref(0)
const pagination = ref({
  page: 1,
  pageSize: 20
})

// 对话框相关
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const currentStudent = ref<Partial<StudentFormData>>({})
const formLoading = ref(false)
const studentFormRef = ref()

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '添加学生' : '编辑学生'
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await studentStore.fetchStudents({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...filterParams.value
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
  pagination.value.page = 1
  loadData()
}

// 页码改变
const handlePageChange = (page: number) => {
  pagination.value.page = page
  loadData()
}

// 每页数量改变
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadData()
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
