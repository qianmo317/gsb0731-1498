<script setup lang="ts">
import type { Student } from '@/types/student'
import { useRouter } from 'vue-router'

interface Props {
  data: Student[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  delete: [id: string]
  edit: [student: Student]
}>()

const router = useRouter()

// 性别显示
const getGenderLabel = (gender: string) => {
  return gender === 'male' ? '男' : '女'
}

// 性别标签类型
const getGenderType = (gender: string) => {
  return gender === 'male' ? 'primary' : 'danger'
}

// 状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    active: 'success',
    inactive: 'info',
    graduated: 'warning'
  }
  return typeMap[status] || 'info'
}

// 状态显示
const getStatusLabel = (status: string) => {
  const labelMap: Record<string, string> = {
    active: '在读',
    inactive: '休学',
    graduated: '毕业'
  }
  return labelMap[status] || status
}

// 等级类型
const getLevelType = (level: string) => {
  const typeMap: Record<string, any> = {
    excellent: 'success',
    good: 'primary',
    average: 'warning',
    poor: 'danger'
  }
  return typeMap[level] || 'info'
}

// 等级显示
const getLevelLabel = (level: string) => {
  const labelMap: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    average: '一般',
    poor: '较差'
  }
  return labelMap[level] || level
}

// 查看详情
const handleViewDetail = (student: Student) => {
  router.push(`/students/detail/${student.id}`)
}

// 编辑学生
const handleEdit = (student: Student) => {
  emit('edit', student)
}

// 删除学生
const handleDelete = (student: Student) => {
  emit('delete', student.id)
}
</script>

<template>
  <el-table
    :data="data"
    :loading="loading"
    stripe
    style="width: 100%"
    @row-dblclick="handleViewDetail"
  >
    <el-table-column type="index" label="序号" width="60" />
    
    <el-table-column prop="name" label="姓名" width="120">
      <template #default="{ row }">
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-avatar :size="32" :src="row.avatar" />
          <span>{{ row.name }}</span>
        </div>
      </template>
    </el-table-column>
    
    <el-table-column prop="gender" label="性别" width="80">
      <template #default="{ row }">
        <el-tag :type="getGenderType(row.gender)" size="small">
          {{ getGenderLabel(row.gender) }}
        </el-tag>
      </template>
    </el-table-column>
    
    <el-table-column prop="age" label="年龄" width="80" />
    
    <el-table-column prop="grade" label="年级" width="100" />
    
    <el-table-column prop="group" label="分组" width="100">
      <template #default="{ row }">
        <el-tag size="small">{{ row.group }}</el-tag>
      </template>
    </el-table-column>
    
    <el-table-column prop="status" label="状态" width="100">
      <template #default="{ row }">
        <el-tag :type="getStatusType(row.status)" size="small">
          {{ getStatusLabel(row.status) }}
        </el-tag>
      </template>
    </el-table-column>
    
    <el-table-column prop="level" label="等级" width="100">
      <template #default="{ row }">
        <el-tag :type="getLevelType(row.level)" size="small">
          {{ getLevelLabel(row.level) }}
        </el-tag>
      </template>
    </el-table-column>
    
    <el-table-column prop="studyHours" label="学习时长" width="120">
      <template #default="{ row }">
        {{ row.studyHours }} 小时
      </template>
    </el-table-column>
    
    <el-table-column prop="homeworkCompletionRate" label="作业完成率" width="120">
      <template #default="{ row }">
        <el-progress
          :percentage="row.homeworkCompletionRate"
          :color="row.homeworkCompletionRate >= 80 ? '#67c23a' : row.homeworkCompletionRate >= 60 ? '#e6a23c' : '#f56c6c'"
        />
      </template>
    </el-table-column>
    
    <el-table-column prop="tags" label="标签" width="200">
      <template #default="{ row }">
        <el-tag
          v-for="tag in row.tags"
          :key="tag"
          size="small"
          style="margin-right: 4px;"
        >
          {{ tag }}
        </el-tag>
      </template>
    </el-table-column>
    
    <el-table-column label="操作" width="200" fixed="right">
      <template #default="{ row }">
        <el-button
          type="primary"
          size="small"
          @click="handleViewDetail(row)"
        >
          查看
        </el-button>
        <el-button
          type="warning"
          size="small"
          @click="handleEdit(row)"
        >
          编辑
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
