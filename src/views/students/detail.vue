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

          <el-card class="risk-card mt-20" v-if="riskProfile">
            <template #header>
              <div class="risk-header">
                <span>风险档案</span>
                <div class="risk-header-right">
                  <el-tag
                    :type="riskProfile.thresholdSource === 'group' ? 'primary' : 'info'"
                    effect="plain"
                  >
                    {{ riskProfile.thresholdSource === 'group' ? `分组阈值·${riskProfile.group}` : '全局阈值' }}
                  </el-tag>
                  <el-tag :type="getRiskLevelType(riskProfile.level)" size="large">
                    {{ formatRiskLevel(riskProfile.level) }}
                  </el-tag>
                  <span class="evaluated-at">评估时间 {{ formatDateTime(riskProfile.evaluatedAt) }}</span>
                </div>
              </div>
            </template>
            <el-table :data="riskIndicators" stripe>
              <el-table-column prop="label" label="风险指标" width="150" />
              <el-table-column prop="value" label="当前数值" width="150" />
              <el-table-column prop="threshold" label="判定阈值" width="180" />
              <el-table-column label="命中情况">
                <template #default="{ row }">
                  <el-tag :type="row.tagType" size="small">{{ row.statusText }}</el-tag>
                  <span v-if="row.description" class="factor-description">{{ row.description }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card class="follow-up-card mt-20">
            <template #header>
              <span>跟进沟通时间线</span>
            </template>
            <el-timeline v-if="communications.length > 0">
              <el-timeline-item
                v-for="record in communications"
                :key="record.id"
                :timestamp="formatDateTime(record.createdAt)"
                placement="top"
                :type="record.isResolved ? 'success' : 'warning'"
              >
                <div class="timeline-title">
                  <span class="title-text">{{ record.title }}</span>
                  <el-tag size="small" :type="record.isResolved ? 'success' : 'warning'">
                    {{ record.isResolved ? '已解决' : '待处理' }}
                  </el-tag>
                  <el-tag size="small" type="info">{{ formatStatus(record.type) }}</el-tag>
                </div>
                <div class="timeline-content">{{ record.content }}</div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无跟进沟通记录" :image-size="80" />
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore, useRiskStore, useCommunicationStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import type { Student, StudentStudyRecord } from '@/types/student'
import type { CommunicationRecord } from '@/types/communication'
import type { RiskFactorType, RiskLevel } from '@/types/risk'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()
const riskStore = useRiskStore()
const communicationStore = useCommunicationStore()

const loading = ref(false)
const student = ref<Student | null>(null)
const studyRecords = ref<StudentStudyRecord[]>([])
const communications = ref<CommunicationRecord[]>([])

// 当前学生的风险评估结果（实时计算，阈值修改后随之重算）
const riskProfile = computed(() => {
  const id = route.params.id as string
  return riskStore.getProfileById(id)
})

// 各风险指标的命中情况（按该学生实际生效的阈值判定与展示）
const riskIndicators = computed(() => {
  const profile = riskProfile.value
  if (!profile) return []

  const thresholds = profile.appliedThresholds
  const factorMap = new Map(profile.factors.map(f => [f.type, f]))

  const buildRow = (type: RiskFactorType, label: string, value: string, threshold: string) => {
    const factor = factorMap.get(type)
    return {
      label,
      value,
      threshold,
      tagType: factor ? (factor.level === 'high' ? 'danger' : 'warning') : 'success',
      statusText: factor ? (factor.level === 'high' ? '命中高风险' : '命中中风险') : '未命中',
      description: factor ? factor.description : ''
    }
  }

  return [
    buildRow('overdue', '逾期未交作业', `${profile.overdueCount} 次`, `阈值 ${thresholds.overdueCount} 次`),
    buildRow('inactive', '连续未活跃', `${profile.inactiveDays} 天`, `阈值 ${thresholds.inactiveDays} 天`),
    buildRow('score', '平均分', `${profile.averageScore} 分`, `警戒线 ${thresholds.averageScoreLine} 分`),
    buildRow('communication', '未解决沟通', `${profile.unresolvedCount} 条`, `阈值 ${thresholds.unresolvedCount} 条`)
  ]
})

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

onMounted(async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    await studentStore.fetchStudentDetail(id)
    student.value = studentStore.currentStudent

    await studentStore.fetchStudyRecords(id, { page: 1, pageSize: 10 })
    studyRecords.value = studentStore.studyRecords

    // 实时重算风险并拉取该学生的跟进沟通记录
    await riskStore.evaluateAll()
    const response = await communicationStore.fetchCommunications({
      page: 1,
      pageSize: 50,
      studentId: id
    })
    communications.value = response.list
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

.risk-card {
  .risk-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .risk-header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .evaluated-at {
      font-size: 12px;
      color: #909399;
    }
  }

  .factor-description {
    margin-left: 8px;
    font-size: 12px;
    color: #909399;
  }
}

.follow-up-card {
  .timeline-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .title-text {
      font-weight: 500;
    }
  }

  .timeline-content {
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}
</style>
