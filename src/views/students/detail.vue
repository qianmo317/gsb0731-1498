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

      <el-card class="risk-profile-card mt-20" v-if="riskProfile" v-loading="riskLoading">
        <template #header>
          <div class="card-header">
            <span>风险档案</span>
            <div class="header-right">
              <el-tag
                v-if="riskProfile.thresholdSource === 'group'"
                type="success"
                effect="dark"
                size="small"
              >
                分组阈值{{ riskProfile.studentGroup ? `·${riskProfile.studentGroup}` : '' }}
              </el-tag>
              <el-tag v-else type="info" effect="plain" size="small">全局阈值</el-tag>
              <el-tag :type="getRiskTagType(riskProfile.level)" size="large" effect="dark">
                {{ getRiskLabel(riskProfile.level) }}
              </el-tag>
              <span class="risk-score">风险评分 {{ riskProfile.score }}</span>
              <el-button text type="primary" @click="goToCommunication">查看沟通记录</el-button>
            </div>
          </div>
        </template>

        <el-row :gutter="16" class="factor-row">
          <el-col :span="6" v-for="factor in riskProfile.factors" :key="factor.dimension">
            <div
              class="factor-card"
              :class="[
                `factor-${factor.level}`,
                { 'factor-hit': factor.level !== 'low' }
              ]"
            >
              <div class="factor-header">
                <span class="factor-label">{{ factor.label }}</span>
                <el-tag
                  :type="factor.level === 'high' ? 'danger' : factor.level === 'medium' ? 'warning' : 'success'"
                  size="small"
                  effect="plain"
                >
                  {{ factor.level === 'high' ? '命中高风险' : factor.level === 'medium' ? '命中中风险' : '正常' }}
                </el-tag>
              </div>
              <div class="factor-value">{{ factor.value }}</div>
              <div class="factor-threshold">
                中风险阈值 {{ factor.mediumThreshold }} / 高风险阈值 {{ factor.highThreshold }}
              </div>
              <div class="factor-desc">{{ factor.description }}</div>
            </div>
          </el-col>
        </el-row>

        <el-divider content-position="left">关联跟进沟通</el-divider>

        <div v-if="riskProfile.followUpCommunications.length > 0" class="timeline-wrapper">
          <el-timeline>
            <el-timeline-item
              v-for="comm in riskProfile.followUpCommunications"
              :key="comm.id"
              :timestamp="formatDateTime(comm.createdAt)"
              placement="top"
              :color="comm.isResolved ? '#67c23a' : comm.isImportant ? '#e6a23c' : '#409eff'"
            >
              <el-card shadow="hover" class="comm-card">
                <div class="comm-header">
                  <span class="comm-title">{{ comm.title }}</span>
                  <div>
                    <el-tag :type="comm.isResolved ? 'success' : 'warning'" size="small">
                      {{ comm.isResolved ? '已解决' : '待处理' }}
                    </el-tag>
                    <el-tag v-if="comm.isImportant" type="danger" size="small" style="margin-left: 4px">
                      重要
                    </el-tag>
                  </div>
                </div>
                <div class="comm-meta">
                  <el-tag size="small" type="info">{{ formatStatus(comm.type) }}</el-tag>
                  <el-tag size="small" type="info" style="margin-left: 4px">{{ formatStatus(comm.method) }}</el-tag>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
        <el-empty v-else description="暂无跟进沟通记录" :image-size="60" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore, useRiskStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import { getRiskTagType, getRiskLabel } from '@/utils/risk'
import type { Student, StudentStudyRecord } from '@/types/student'
import type { StudentRiskProfile } from '@/types/risk'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()
const riskStore = useRiskStore()

const loading = ref(false)
const riskLoading = computed(() => riskStore.loading)
const student = ref<Student | null>(null)
const studyRecords = ref<StudentStudyRecord[]>([])

const riskProfile = computed<StudentRiskProfile | null>(() => {
  const id = route.params.id as string
  return riskStore.getStudentRiskProfile(id)
})

const goBack = () => {
  router.back()
}

const goToCommunication = () => {
  router.push('/communication')
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    graduated: 'warning'
  }
  return map[status] || 'info'
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

onMounted(async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    await studentStore.fetchStudentDetail(id)
    student.value = studentStore.currentStudent

    await studentStore.fetchStudyRecords(id, { page: 1, pageSize: 10 })
    studyRecords.value = studentStore.studyRecords

    if (riskStore.studentRisks.length === 0) {
      await riskStore.calculateRisks()
    }
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

.risk-profile-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .risk-score {
      font-size: 14px;
      color: #606266;
    }
  }
}

.factor-row {
  .factor-card {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s;

    &.factor-hit {
      border-width: 2px;
    }

    &.factor-high {
      border-color: #f56c6c;
      background: #fef0f0;
    }

    &.factor-medium {
      border-color: #e6a23c;
      background: #fdf6ec;
    }

    &.factor-low {
      border-color: #e1f3d8;
      background: #f0f9eb;
    }

    .factor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .factor-label {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }

    .factor-value {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
      line-height: 1.2;
    }

    .factor-threshold {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    .factor-desc {
      font-size: 13px;
      color: #606266;
      margin-top: 8px;
    }
  }
}

.timeline-wrapper {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;

  .comm-card {
    .comm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .comm-title {
        font-weight: 600;
        color: #303133;
      }
    }

    .comm-meta {
      margin-top: 8px;
    }
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
