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

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <RiskOverview />
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
import { User, Document, ChatDotRound, Clock, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { useStatisticsStore } from '@/stores'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import RiskOverview from './components/RiskOverview.vue'

const statisticsStore = useStatisticsStore()
const timeRange = ref<'daily' | 'weekly' | 'monthly'>('daily')

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
