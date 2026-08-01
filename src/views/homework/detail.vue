<template>
  <div class="homework-detail">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">作业详情</span>
      </template>
    </el-page-header>

    <div class="detail-content" v-loading="loading">
      <el-row :gutter="20" v-if="homework">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>作业信息</span>
            </template>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="作业标题">{{ homework.title }}</el-descriptions-item>
              <el-descriptions-item label="科目">{{ homework.subject }}</el-descriptions-item>
              <el-descriptions-item label="难度">
                <el-tag :type="getDifficultyType(homework.difficulty)">
                  {{ formatStatus(homework.difficulty) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="总分">{{ homework.totalScore }}</el-descriptions-item>
              <el-descriptions-item label="截止时间">
                {{ formatDateTime(homework.dueDate) }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(homework.status)">
                  {{ formatStatus(homework.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="作业描述" :span="3">
                {{ homework.description }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="24" class="mt-20">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>提交情况</span>
                <el-radio-group v-model="statusFilter" size="small" @change="handleFilterChange">
                  <el-radio-button label="">全部</el-radio-button>
                  <el-radio-button label="not_submitted">未提交</el-radio-button>
                  <el-radio-button label="submitted">已提交</el-radio-button>
                  <el-radio-button label="graded">已批改</el-radio-button>
                </el-radio-group>
              </div>
            </template>

            <el-table :data="submissions" v-loading="submissionsLoading" stripe>
              <el-table-column label="学生" width="150">
                <template #default="{ row }">
                  <div class="student-info">
                    <el-avatar :size="32" :src="row.studentAvatar" />
                    <span>{{ row.studentName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getSubmissionStatusType(row.status)">
                    {{ formatStatus(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="submitTime" label="提交时间" width="180">
                <template #default="{ row }">
                  {{ row.submitTime ? formatDateTime(row.submitTime) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="score" label="分数" width="100">
                <template #default="{ row }">
                  {{ row.score !== undefined ? row.score : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="isExcellent" label="优秀" width="80">
                <template #default="{ row }">
                  <el-tag v-if="row.isExcellent" type="success">优秀</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="feedback" label="评语" min-width="200" />
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button
                    v-if="row.status === 'submitted'"
                    link
                    type="primary"
                    @click="handleGrade(row)"
                  >
                    批改
                  </el-button>
                  <el-button v-else-if="row.status === 'graded'" link type="primary">
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHomeworkStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import type { Homework, HomeworkSubmission } from '@/types/homework'

const route = useRoute()
const router = useRouter()
const homeworkStore = useHomeworkStore()

const loading = ref(false)
const submissionsLoading = ref(false)
const homework = ref<Homework | null>(null)
const submissions = ref<HomeworkSubmission[]>([])
const statusFilter = ref('')

const goBack = () => {
  router.back()
}

const handleFilterChange = async () => {
  if (!homework.value) return
  submissionsLoading.value = true
  try {
    await homeworkStore.fetchSubmissions(homework.value.id, {
      status: statusFilter.value || undefined
    })
    submissions.value = homeworkStore.submissions
  } finally {
    submissionsLoading.value = false
  }
}

const handleGrade = (row: HomeworkSubmission) => {
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

const getSubmissionStatusType = (status: string) => {
  const map: Record<string, any> = {
    not_submitted: 'info',
    submitted: 'warning',
    graded: 'success'
  }
  return map[status] || 'info'
}

onMounted(async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    await homeworkStore.fetchHomeworkDetail(id)
    homework.value = homeworkStore.currentHomework

    if (homework.value) {
      await homeworkStore.fetchSubmissions(homework.value.id)
      submissions.value = homeworkStore.submissions
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.homework-detail {
  padding: 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.detail-content {
  margin-top: 20px;
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

.mt-20 {
  margin-top: 20px;
}
</style>
