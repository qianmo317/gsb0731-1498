<template>
  <div class="dashboard">
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

    <el-card class="risk-overview-card mt-20" v-loading="riskLoading">
      <template #header>
        <div class="card-header">
          <span>学情风险概览</span>
          <el-button text type="primary" @click="goToStudentList()">
            查看全部学生
          </el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div
            class="risk-stat-card risk-high"
            @click="goToStudentList('high')"
          >
            <div class="risk-stat-value">{{ riskOverview.highCount }}</div>
            <div class="risk-stat-label">高风险学生</div>
            <div class="risk-stat-desc">需立即干预</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div
            class="risk-stat-card risk-medium"
            @click="goToStudentList('medium')"
          >
            <div class="risk-stat-value">{{ riskOverview.mediumCount }}</div>
            <div class="risk-stat-label">中风险学生</div>
            <div class="risk-stat-desc">建议关注</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div
            class="risk-stat-card risk-low"
            @click="goToStudentList('low')"
          >
            <div class="risk-stat-value">{{ riskOverview.lowCount }}</div>
            <div class="risk-stat-label">低风险学生</div>
            <div class="risk-stat-desc">状态良好</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div
            class="risk-stat-card risk-pending"
            @click="goToPendingFollowUp"
          >
            <div class="risk-stat-value">{{ riskOverview.pendingFollowUpCount }}</div>
            <div class="risk-stat-label">待跟进</div>
            <div class="risk-stat-desc">需处理沟通</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="chart-card mt-20" v-loading="riskLoading">
      <template #header>
        <div class="card-header">
          <span>近八周风险等级趋势</span>
          <span class="chart-hint">历史周为快照数据，本周为实时值</span>
        </div>
      </template>
      <MultiLineChart
        :x-data="riskTrendXData"
        :series="riskTrendSeries"
        height="300px"
      />
    </el-card>

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
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import MultiLineChart from '@/components/charts/MultiLineChart.vue'
import type { RiskLevel } from '@/types/risk'

const router = useRouter()
const statisticsStore = useStatisticsStore()
const riskStore = useRiskStore()
const timeRange = ref<'daily' | 'weekly' | 'monthly'>('daily')

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

const riskOverview = computed(() => riskStore.riskOverview)
const riskLoading = computed(() => riskStore.loading)

const riskTrend = computed(() => riskStore.riskTrend)
const riskTrendXData = computed(() => riskTrend.value.map(p => p.label))
const riskTrendSeries = computed(() => [
  { name: '高风险', data: riskTrend.value.map(p => p.highCount), color: '#f56c6c' },
  { name: '中风险', data: riskTrend.value.map(p => p.mediumCount), color: '#e6a23c' },
  { name: '低风险', data: riskTrend.value.map(p => p.lowCount), color: '#67c23a' }
])

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

const goToStudentList = (riskLevel?: RiskLevel) => {
  if (riskLevel) {
    router.push({ path: '/students', query: { riskLevel } })
  } else {
    router.push('/students')
  }
}

const goToPendingFollowUp = () => {
  router.push({ path: '/students', query: { pendingFollowUp: 'true' } })
}

onMounted(async () => {
  await riskStore.calculateRisks()
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

.risk-overview-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.risk-stat-card {
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .risk-stat-value {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.2;
  }

  .risk-stat-label {
    font-size: 15px;
    color: #606266;
    margin-top: 8px;
  }

  .risk-stat-desc {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  &.risk-high {
    background: #fef0f0;
    border-color: #fde2e2;

    .risk-stat-value {
      color: #f56c6c;
    }
  }

  &.risk-medium {
    background: #fdf6ec;
    border-color: #faecd8;

    .risk-stat-value {
      color: #e6a23c;
    }
  }

  &.risk-low {
    background: #f0f9eb;
    border-color: #e1f3d8;

    .risk-stat-value {
      color: #67c23a;
    }
  }

  &.risk-pending {
    background: #ecf5ff;
    border-color: #d9ecff;

    .risk-stat-value {
      color: #409eff;
    }
  }
}

.chart-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chart-hint {
    font-size: 12px;
    color: #909399;
    font-weight: normal;
  }
}

.mt-20 {
  margin-top: 20px;
}
</style>
