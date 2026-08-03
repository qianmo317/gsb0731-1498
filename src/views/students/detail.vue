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

      <!-- 风险档案 -->
      <el-row :gutter="20" class="mt-20" v-if="student && riskProfile">
        <el-col :span="24">
          <el-card class="risk-profile-card">
            <template #header>
              <div class="card-header">
                <span>风险档案</span>
                <div class="header-tags">
                  <el-tag
                    size="small"
                    :type="riskProfile.risk.thresholdSource === 'group' ? 'warning' : 'info'"
                    effect="plain"
                  >
                    {{
                      riskProfile.risk.thresholdSource === 'group'
                        ? `分组阈值（${student.group}）`
                        : '全局阈值'
                    }}
                  </el-tag>
                  <el-tag :type="riskTagType(riskProfile.risk.level)" effect="dark">
                    当前等级：{{ riskLabel(riskProfile.risk.level) }}
                  </el-tag>
                </div>
              </div>
            </template>

            <div class="effective-thresholds">
              生效阈值：逾期未交 ≥ {{ riskProfile.risk.effectiveThresholds.overdueCount }} 次 ·
              无动态 ≥ {{ riskProfile.risk.effectiveThresholds.inactiveDays }} 天 ·
              平均分警戒线 {{ riskProfile.risk.effectiveThresholds.scoreLine }} 分 ·
              未解决沟通 ≥ {{ riskProfile.risk.effectiveThresholds.unresolvedCount }} 条
            </div>

            <el-table :data="dimensionRows" stripe>
              <el-table-column prop="name" label="风险指标" width="160" />
              <el-table-column label="命中情况" width="120">
                <template #default="{ row }">
                  <el-tag :type="riskTagType(row.level)" size="small">
                    {{ riskLabel(row.level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="detail" label="数值 / 说明" />
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="24" class="mt-20">
          <el-card class="follow-up-card">
            <template #header>
              <span>关联跟进沟通</span>
            </template>
            <CommunicationList
              :records="followUps"
              @view="handleViewCommunication"
              @resolve="handleResolveCommunication"
              @delete="handleDeleteCommunication"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStudentStore, useCommunicationStore, useRiskStore } from '@/stores'
import { formatStatus } from '@/utils/format'
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_TAG_TYPES,
  RISK_DIMENSION_LABELS
} from '@/utils/risk'
import CommunicationList from '@/views/communication/components/CommunicationList.vue'
import type { Student, StudentStudyRecord } from '@/types/student'
import type { CommunicationRecord } from '@/types/communication'
import type { RiskLevel, StudentRiskProfile } from '@/types/risk'

const route = useRoute()
const router = useRouter()
const studentStore = useStudentStore()
const communicationStore = useCommunicationStore()
const riskStore = useRiskStore()

const loading = ref(false)
const student = ref<Student | null>(null)
const studyRecords = ref<StudentStudyRecord[]>([])
const riskProfile = ref<StudentRiskProfile | null>(null)
const followUps = ref<CommunicationRecord[]>([])

const goBack = () => {
  router.back()
}

// 风险等级标签与颜色（类型安全封装）
const riskLabel = (level: RiskLevel) => RISK_LEVEL_LABELS[level]
const riskTagType = (level: RiskLevel) => RISK_LEVEL_TAG_TYPES[level]

// 各风险指标命中明细
const dimensionRows = computed(() => {
  if (!riskProfile.value) return []
  const { dimensions } = riskProfile.value.risk
  return (Object.keys(dimensions) as Array<keyof typeof dimensions>).map(key => ({
    name: RISK_DIMENSION_LABELS[key],
    level: dimensions[key].level,
    detail: dimensions[key].label
  }))
}
)

type TagType = 'success' | 'warning' | 'info' | 'primary' | 'danger'

const getStatusType = (status: string): TagType => {
  const map: Record<string, TagType> = {
    active: 'success',
    inactive: 'info',
    graduated: 'warning'
  }
  return map[status] || 'info'
}

const getLevelType = (level: string): TagType => {
  const map: Record<string, TagType> = {
    excellent: 'success',
    good: 'primary',
    average: 'warning',
    poor: 'danger'
  }
  return map[level] || 'info'
}

// 加载该学生的关联跟进沟通
const loadFollowUps = async (studentId: string) => {
  const response = await communicationStore.fetchCommunications({
    page: 1,
    pageSize: 100,
    studentId
  })
  followUps.value = response.list
}

// 加载风险档案（按当前阈值实时计算）
const loadRiskProfile = async (studentId: string) => {
  riskProfile.value = await riskStore.fetchStudentRiskProfile(studentId)
}

const handleViewCommunication = (record: CommunicationRecord) => {
  router.push({ path: '/communication', query: { keyword: record.title } })
}

// 标记已解决后重算风险档案（沟通产生的风险随之去掉）
const handleResolveCommunication = async (record: CommunicationRecord) => {
  try {
    await communicationStore.markAsResolved(record.id)
    ElMessage.success('已标记为已解决')
    await loadFollowUps(record.studentId)
    await loadRiskProfile(record.studentId)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDeleteCommunication = async (record: CommunicationRecord) => {
  try {
    await ElMessageBox.confirm('确定要删除该沟通记录吗?', '提示', { type: 'warning' })
    await communicationStore.deleteCommunication(record.id)
    ElMessage.success('删除成功')
    await loadFollowUps(record.studentId)
    await loadRiskProfile(record.studentId)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    await studentStore.fetchStudentDetail(id)
    student.value = studentStore.currentStudent

    await studentStore.fetchStudyRecords(id, { page: 1, pageSize: 10 })
    studyRecords.value = studentStore.studyRecords

    await loadRiskProfile(id)
    await loadFollowUps(id)
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

    .header-tags {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .effective-thresholds {
    margin-bottom: 12px;
    font-size: 13px;
    color: #909399;
  }
}
</style>
