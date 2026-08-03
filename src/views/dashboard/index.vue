<template>
  <div class="dashboard">
    <!-- 风险概览 -->
    <el-card v-if="riskOverview" class="risk-overview" shadow="never">
      <template #header>
        <div class="card-header">
          <span>学情风险概览</span>
          <el-button link type="primary" @click="goToRiskList()">查看全部</el-button>
        </div>
      </template>
      <div class="risk-cards">
        <div
          v-for="item in riskCards"
          :key="item.level"
          class="risk-card"
          :class="item.level"
          @click="goToRiskList(item.level)"
        >
          <div class="risk-count">{{ item.count }}</div>
          <div class="risk-label">{{ item.label }}</div>
        </div>
        <div class="risk-card pending" @click="goToRiskList()">
          <div class="risk-count">{{ riskOverview.pendingFollowUp }}</div>
          <div class="risk-label">待跟进</div>
        </div>
      </div>

      <!-- 近八周各等级人数趋势 -->
      <div class="risk-trend">
        <div class="trend-title">近八周风险趋势</div>
        <RiskTrendChart :data="riskTrend" height="280px" />
      </div>
    </el-card>

    <div class="overview-cards">
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
import { User, Document, ChatDotRound, Clock, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { useStatisticsStore, useRiskStore } from '@/stores'
import { RISK_LEVEL_LABELS } from '@/utils/risk'
import type { RiskLevel } from '@/types/risk'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import RiskTrendChart from '@/components/charts/RiskTrendChart.vue'

const router = useRouter()
const statisticsStore = useStatisticsStore()
const riskStore = useRiskStore()
const timeRange = ref<'daily' | 'weekly' | 'monthly'>('daily')

// 风险概览
const riskOverview = computed(() => riskStore.overview)

// 近八周风险趋势
const riskTrend = computed(() => riskStore.trend)

const riskCards = computed<{ level: RiskLevel; label: string; count: number }[]>(() => {
  const overview = riskStore.overview
  if (!overview) return []
  return [
    { level: 'high', label: RISK_LEVEL_LABELS.high, count: overview.high },
    { level: 'medium', label: RISK_LEVEL_LABELS.medium, count: overview.medium },
    { level: 'low', label: RISK_LEVEL_LABELS.low, count: overview.low }
  ]
})

// 跳转到已按条件筛好的学生列表
const goToRiskList = (level?: RiskLevel) => {
  router.push({ path: '/students', query: level ? { riskLevel: level } : {} })
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
  await statisticsStore.fetchDashboardOverview()
  await riskStore.fetchRiskOverview()
  await riskStore.fetchRiskTrend()
  await statisticsStore.fetchStudyTimeTrend('daily')
  await statisticsStore.fetchCompletionRateTrend('daily')
  await statisticsStore.fetchStudentProgressComparison()
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
}

.risk-overview {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .risk-cards {
    display: flex;
    gap: 16px;

    .risk-card {
      flex: 1;
      padding: 16px 20px;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
      color: #fff;

      &:hover {
        transform: translateY(-2px);
      }

      .risk-count {
        font-size: 28px;
        font-weight: 600;
      }

      .risk-label {
        font-size: 14px;
        margin-top: 4px;
        opacity: 0.9;
      }

      &.high {
        background: #ff4d4f;
      }

      &.medium {
        background: #faad14;
      }

      &.low {
        background: #52c41a;
      }

      &.pending {
        background: #4a90e2;
      }
    }
  }

  .risk-trend {
    margin-top: 24px;

    .trend-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
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
