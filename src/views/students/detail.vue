<template>
  <div class="student-detail">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">学生详情</span>
      </template>
    </el-page-header>

    <div class="detail-content" v-loading="loading">
      <el-row :gutter="20" v-if="student">
        <el-col :span="8">
          <el-card class="info-card">
            <template #header>
              <span>基本信息</span>
            </template>
            <div class="student-avatar">
              <el-avatar :size="100" :src="student.avatar" />
              <h3>{{ student.name }}</h3>
              <el-tag :type="getStatusType(student.status)">
                {{ formatStatus(student.status) }}
              </el-tag>
            </div>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="性别">
                {{ student.gender === 'male' ? '男' : '女' }}
              </el-descriptions-item>
              <el-descriptions-item label="年龄">{{ student.age }}岁</el-descriptions-item>
              <el-descriptions-item label="年级">{{ student.grade }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ student.phone }}</el-descriptions-item>
              <el-descriptions-item label="家长">{{ student.parentName }}</el-descriptions-item>
              <el-descriptions-item label="家长电话">{{ student.parentPhone }}</el-descriptions-item>
              <el-descriptions-item label="分组">{{ student.group }}</el-descriptions-item>
              <el-descriptions-item label="等级">
                <el-tag :type="getLevelType(student.level)">
                  {{ formatStatus(student.level) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="入学日期">{{ student.enrollDate }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="16">
          <el-card class="stats-card">
            <template #header>
              <span>学习统计</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ student.totalStudyTime }}</div>
                  <div class="stat-label">学习时长(分钟)</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ student.completedHomework }}</div>
                  <div class="stat-label">完成作业</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ student.averageScore }}</div>
                  <div class="stat-label">平均分</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">
                    {{ Math.round((student.completedHomework / student.totalHomework) * 100) }}%
                  </div>
                  <div class="stat-label">完成率</div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <el-card class="records-card mt-20">
            <template #header>
              <span>学习记录</span>
            </template>
            <el-table :data="studyRecords" stripe>
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="subject" label="科目" width="100" />
              <el-table-column prop="duration" label="时长(分钟)" width="120" />
              <el-table-column prop="content" label="学习内容" />
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
import { useStudentStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import type { Student, StudentStudyRecord } from '@/types/student'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()

const loading = ref(false)
const student = ref<Student | null>(null)
const studyRecords = ref<StudentStudyRecord[]>([])

const goBack = () => {
  router.back()
}

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    active: 'success',
    inactive: 'info',
    graduated: 'warning'
  }
  return map[status] || 'info'
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

onMounted(async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    await studentStore.fetchStudentDetail(id)
    student.value = studentStore.currentStudent

    await studentStore.fetchStudyRecords(id, { page: 1, pageSize: 10 })
    studyRecords.value = studentStore.studyRecords
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.student-detail {
  padding: 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.detail-content {
  margin-top: 20px;
}

.student-avatar {
  text-align: center;
  padding: 20px 0;

  h3 {
    margin: 16px 0 8px;
    font-size: 20px;
  }
}

.stats-card {
  .stat-item {
    text-align: center;
    padding: 20px 0;

    .stat-value {
      font-size: 32px;
      font-weight: 600;
      color: #4a90e2;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
