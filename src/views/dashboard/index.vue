<template>
  <div class="dashboard">
    <!-- 风险概览区块 -->
    <el-card class="risk-overview-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>
            <el-icon color="#ff4d4f" style="margin-right: 6px"><Warning /></el-icon>
            学情风险概览
          </span>
          <el-button link type="primary" @click="goToFollowUp">
            查看待跟进 ({{ riskOverview.pendingFollowUpCount }})
          </el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="risk-block high" @click="goToStudents('high')">
            <div class="risk-label">高风险学生</div>
            <div class="risk-value">{{ riskOverview.highCount }}</div>
            <div class="risk-desc">需立即跟进</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="risk-block medium" @click="goToStudents('medium')">
            <div class="risk-label">中风险学生</div>
            <div class="risk-value">{{ riskOverview.mediumCount }}</div>
            <div class="risk-desc">建议关注</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="risk-block low" @click="goToStudents('low')">
            <div class="risk-label">低风险学生</div>
            <div class="risk-value">{{ riskOverview.lowCount }}</div>
            <div class="risk-desc">状态正常</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="risk-block pending" @click="goToFollowUp">
            <div class="risk-label">待跟进</div>
            <div class="risk-value">{{ riskOverview.pendingFollowUpCount }}</div>
            <div class="risk-desc">
              其中高风险 {{ riskOverview.highFollowUpCount }} 条
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <div class="overview-cards mt-20">
      <el-row :gutter="20">
        <el-col :span="6" v-for="card in overviewCards" :key="card.title">
          <div class="stat-card">
            <div class="card-icon" :style="{ backgroundColor: card.color }">
              <el-icon :size="32">
                <component :is="card.icon" />
              </el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">{{ card.title }}</div>
              <div class="card-value">{{ card.value }}</div>
              <div class="card-trend" v-if="card.trend">
                <el-icon :color="card.trend.isUp ? '#52c41a' : '#ff4d4f'">
                  <component :is="card.trend.isUp ? CaretTop : CaretBottom" />
                </el-icon>
                <span>{{ card.trend.value }}%</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>近8周风险等级趋势</span>
              <el-tooltip content="历史周显示存档快照，本周显示实时预警结果" placement="top">
                <el-tag size="small" type="info">本周为实时值</el-tag>
              </el-tooltip>
            </div>
          </template>
          <MultiLineChart
            :x-data="weeklyTrendX"
            :series="weeklyTrendSeries"
            height="300px"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>学习时长趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button value="daily">日</el-radio-button>
                <el-radio-button value="weekly">周</el-radio-button>
                <el-radio-button value="monthly">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <LineChart :data="studyTimeData" height="300px" />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>作业完成率趋势</span>
          </template>
          <LineChart :data="completionRateData" height="300px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <span>学生学习进度对比</span>
          </template>
          <BarChart :data="progressData" height="300px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, Document, ChatDotRound, Clock, CaretTop, CaretBottom, Warning } from '@element-plus/icons-vue'
import { useStatisticsStore, useRiskStore, useStudentStore } from '@/stores'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import MultiLineChart from '@/components/charts/MultiLineChart.vue'
import type { ChartSeries } from '@/components/charts/MultiLineChart.vue'
import type { RiskLevel } from '@/types/risk'

const router = useRouter()
const statisticsStore = useStatisticsStore()
const riskStore = useRiskStore()
const studentStore = useStudentStore()
const timeRange = ref<'daily' | 'weekly' | 'monthly'>('daily')

const riskOverview = computed(() => riskStore.riskOverview)

// 近8周风险趋势数据
const weeklyTrend = computed(() => riskStore.weeklyTrend)
const weeklyTrendX = computed(() => weeklyTrend.value.map(w => w.weekLabel))
const weeklyTrendSeries = computed<ChartSeries[]>(() => [
  {
    name: '高风险',
    data: weeklyTrend.value.map(w => w.highCount),
    color: '#ff4d4f'
  },
  {
    name: '中风险',
    data: weeklyTrend.value.map(w => w.mediumCount),
    color: '#faad14'
  },
  {
    name: '低风险',
    data: weeklyTrend.value.map(w => w.lowCount),
    color: '#52c41a'
  }
])

// 跳转到已按风险等级筛选好的学生列表
const goToStudents = (level: RiskLevel) => {
  router.push({ path: '/students', query: { riskLevel: level } })
}

// 跳转到跟进管理页
const goToFollowUp = () => {
  router.push('/followup')
}

// 监听时间范围变化，重新获取数据
watch(timeRange, async (newRange) => {
  await statisticsStore.fetchStudyTimeTrend(newRange)
  await statisticsStore.fetchCompletionRateTrend(newRange)
})

const overviewCards = computed(() => {
  const overview = statisticsStore.dashboardOverview
  if (!overview) return []

  return [
    {
      title: '总学生数',
      value: overview.totalStudents,
      icon: User,
      color: '#4a90e2',
      trend: { value: 12, isUp: true }
    },
    {
      title: '今日作业提交',
      value: overview.todaySubmissions,
      icon: Document,
      color: '#52c41a'
    },
    {
      title: '待批改作业',
      value: overview.pendingGrade,
      icon: ChatDotRound,
      color: '#faad14'
    },
    {
      title: '本周学习时长',
      value: `${Math.floor(overview.weeklyStudyTime / 60)}h`,
      icon: Clock,
      color: '#ff4d4f'
    }
  ]
})

const studyTimeData = computed(() => {
  const trend = statisticsStore.studyTimeTrend
  if (!trend) return []

  const data = trend[timeRange.value] || []
  return data.map(item => ({
    name: item.date,
    value: item.value
  }))
})

const completionRateData = computed(() => {
  const trend = statisticsStore.completionRateTrend
  if (!trend) return []

  const data = trend[timeRange.value] || []
  return data.map(item => ({
    name: item.date,
    value: item.value
  }))
})

const progressData = computed(() => {
  const comparison = statisticsStore.studentProgressComparison
  if (!comparison) return []

  return comparison.students.map(s => ({
    name: s.studentName,
    value: s.averageScore
  }))
})

onMounted(async () => {
  riskStore.initFollowUps()
  riskStore.initWeeklySnapshots()
  await studentStore.fetchStudents({ page: 1, pageSize: 10000 })
  await statisticsStore.fetchDashboardOverview()
  await statisticsStore.fetchStudyTimeTrend('daily')
  await statisticsStore.fetchCompletionRateTrend('daily')
  await statisticsStore.fetchStudentProgressComparison()
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
}

.risk-overview-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 600;
  }

  .risk-block {
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .risk-label {
      font-size: 14px;
      color: #fff;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .risk-value {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }

    .risk-desc {
      font-size: 12px;
      color: #fff;
      opacity: 0.85;
      margin-top: 6px;
    }

    &.high {
      background: linear-gradient(135deg, #ff7875, #ff4d4f);
    }

    &.medium {
      background: linear-gradient(135deg, #ffc53d, #faad14);
    }

    &.low {
      background: linear-gradient(135deg, #73d13d, #52c41a);
    }

    &.pending {
      background: linear-gradient(135deg, #69b1ff, #1677ff);
    }
  }
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .card-icon {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .card-content {
    flex: 1;

    .card-title {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .card-value {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .card-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
    }
  }
}

.chart-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
