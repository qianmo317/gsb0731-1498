<template>
  <div class="student-detail">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">学生详情</span>
      </template>
    </el-page-header>

    <div class="detail-content" v-loading="loading">
      <!-- 风险档案 -->
      <el-row :gutter="20" v-if="student && studentRisk">
        <el-col :span="24">
          <el-card class="risk-profile-card">
            <template #header>
              <div class="card-header">
                <span>
                  <el-icon color="#ff4d4f" style="margin-right: 6px"><Warning /></el-icon>
                  风险档案
                </span>
                <div class="risk-header-right">
                  <el-tag
                    v-if="studentRisk.thresholdSource === 'group'"
                    type="primary"
                    size="small"
                    effect="plain"
                  >
                    分组阈值 · {{ studentRisk.thresholdGroup }}
                  </el-tag>
                  <el-tag v-else type="info" size="small" effect="plain">
                    全局阈值
                  </el-tag>
                  <el-tag
                    :type="getRiskTagType(studentRisk.level)"
                    effect="dark"
                    size="large"
                  >
                    {{ formatRiskLevel(studentRisk.level) }}
                  </el-tag>
                  <el-button link type="primary" @click="goToFollowUp">
                    发起跟进
                  </el-button>
                </div>
              </div>
            </template>

            <el-row :gutter="16">
              <el-col
                v-for="dim in studentRisk.dimensions"
                :key="dim.dimension"
                :span="6"
              >
                <div
                  class="dimension-card"
                  :class="{ triggered: dim.isTriggered }"
                >
                  <div class="dim-label">
                    <el-icon v-if="dim.isTriggered" color="#ff4d4f"><CircleCloseFilled /></el-icon>
                    <el-icon v-else color="#52c41a"><CircleCheckFilled /></el-icon>
                    {{ dim.label }}
                  </div>
                  <div class="dim-value">
                    <span class="current">{{ dim.currentValue }}</span>
                    <span class="threshold">/ 阈值 {{ dim.thresholdValue }}</span>
                  </div>
                  <div class="dim-desc">{{ dim.description }}</div>
                </div>
              </el-col>
            </el-row>

            <div class="risk-meta">
              <span>评估时间：{{ formatDateTime(studentRisk.evaluatedAt) }}</span>
              <span v-if="studentRisk.hasPendingFollowUp" class="pending-hint">
                <el-icon><Bell /></el-icon>
                该学生存在待处理跟进
              </span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="student" class="mt-20">
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

          <!-- 关联跟进沟通时间线 -->
          <el-card class="timeline-card mt-20">
            <template #header>
              <div class="card-header">
                <span>跟进沟通时间线</span>
                <el-button link type="primary" @click="goToFollowUp">
                  新增跟进
                </el-button>
              </div>
            </template>
            <el-timeline v-if="followUpTimeline.length > 0">
              <el-timeline-item
                v-for="item in followUpTimeline"
                :key="item.id"
                :timestamp="formatDateTime(item.createdAt)"
                placement="top"
                :type="item.status === 'resolved' ? 'success' : 'warning'"
              >
                <el-card shadow="never" class="timeline-item-card">
                  <div class="timeline-header">
                    <el-tag
                      :type="getRiskTagType(item.riskLevel)"
                      size="small"
                      effect="dark"
                    >
                      {{ formatRiskLevel(item.riskLevel) }}
                    </el-tag>
                    <el-tag
                      :type="getFollowUpStatusType(item.status)"
                      size="small"
                    >
                      {{ formatFollowUpStatus(item.status) }}
                    </el-tag>
                    <span class="timeline-title">{{ item.title }}</span>
                  </div>
                  <div class="timeline-content">{{ item.content }}</div>
                  <div class="timeline-footer">
                    <span>{{ item.createdBy }}</span>
                    <span v-if="item.resolvedAt">
                      解决于 {{ formatDateTime(item.resolvedAt) }}
                    </span>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无跟进记录" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Warning,
  Bell,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { useStudentStore, useRiskStore } from '@/stores'
import { formatStatus, formatRiskLevel, formatFollowUpStatus, getRiskTagType } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import type { Student, StudentStudyRecord } from '@/types/student'
import type { StudentRiskResult, FollowUpRecord, FollowUpStatus } from '@/types/risk'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()
const riskStore = useRiskStore()

const loading = ref(false)
const student = ref<Student | null>(null)
const studyRecords = ref<StudentStudyRecord[]>([])

// 实时风险结果（阈值修改后自动重算）
const studentRisk = computed<StudentRiskResult | undefined>(() => {
  if (!student.value) return undefined
  return riskStore.getStudentRisk(student.value.id)
})

// 该学生的跟进沟通时间线（按时间倒序）
const followUpTimeline = computed<FollowUpRecord[]>(() => {
  if (!student.value) return []
  const id = student.value.id
  return riskStore.followUps
    .filter(f => f.studentId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const goBack = () => {
  router.back()
}

const goToFollowUp = () => {
  if (!student.value) return
  // 跳到跟进页并按学生筛选
  router.push({ path: '/followup', query: { studentId: student.value.id } })
}

const getFollowUpStatusType = (
  status: FollowUpStatus
): 'warning' | 'primary' | 'success' => {
  const map: Record<FollowUpStatus, 'warning' | 'primary' | 'success'> = {
    pending: 'warning',
    in_progress: 'primary',
    resolved: 'success'
  }
  return map[status]
}

const getStatusType = (status: string): 'success' | 'info' | 'warning' => {
  const map: Record<string, 'success' | 'info' | 'warning'> = {
    active: 'success',
    inactive: 'info',
    graduated: 'warning'
  }
  return map[status] || 'info'
}

const getLevelType = (level: string): 'success' | 'primary' | 'warning' | 'danger' => {
  const map: Record<string, 'success' | 'primary' | 'warning' | 'danger'> = {
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
    riskStore.initFollowUps()
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

.risk-profile-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 600;
  }

  .risk-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dimension-card {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    transition: all 0.2s;

    &.triggered {
      border-color: #ff4d4f;
      background: #fff1f0;
    }

    .dim-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #606266;
      margin-bottom: 8px;
    }

    .dim-value {
      .current {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
      }

      .threshold {
        font-size: 13px;
        color: #909399;
        margin-left: 4px;
      }
    }

    .dim-desc {
      margin-top: 6px;
      font-size: 12px;
      color: #909399;
    }
  }

  .risk-meta {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #909399;

    .pending-hint {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #e6a23c;
    }
  }
}

.timeline-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .timeline-item-card {
    :deep(.el-card__body) {
      padding: 12px 16px;
    }
  }

  .timeline-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .timeline-title {
      font-weight: 600;
      color: #303133;
    }
  }

  .timeline-content {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .timeline-footer {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #909399;
  }
}
</style>
