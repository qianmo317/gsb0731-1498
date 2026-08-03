<template>
  <el-card class="risk-overview-card" v-loading="riskStore.loading">
    <template #header>
      <div class="card-header">
        <span>学情风险预警</span>
        <el-button link type="primary" :icon="Setting" @click="thresholdDialogVisible = true">
          阈值设置
        </el-button>
      </div>
    </template>

    <div class="risk-items">
      <div
        v-for="item in riskItems"
        :key="item.title"
        class="risk-item"
        @click="handleJump(item.riskLevel)"
      >
        <div class="risk-count" :style="{ color: item.color }">{{ item.count }}</div>
        <div class="risk-title">{{ item.title }}</div>
      </div>
      <div class="risk-item" @click="handleJump('high')">
        <div class="risk-count" style="color: #4a90e2">{{ overview.pendingFollowUp }}</div>
        <div class="risk-title">待跟进</div>
      </div>
    </div>

    <div class="risk-trend">
      <div class="trend-title">近八周风险趋势</div>
      <v-chart :option="trendOption" style="height: 260px; width: 100%" autoresize />
    </div>

    <!-- 预警阈值设置对话框 -->
    <RiskThresholdDialog v-if="thresholdDialogVisible" v-model="thresholdDialogVisible" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Setting } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption
} from 'echarts/components'
import { useRiskStore } from '@/stores'
import { formatDate } from '@/utils/date'
import RiskThresholdDialog from '@/components/common/RiskThresholdDialog.vue'
import type { RiskLevel } from '@/types/risk'

type ECOption = ComposeOption<
  LineSeriesOption | TooltipComponentOption | GridComponentOption | LegendComponentOption
>

const router = useRouter()
const riskStore = useRiskStore()

const thresholdDialogVisible = ref(false)

const overview = computed(() => riskStore.riskOverview)

const riskItems = computed(() => [
  { title: '高风险', count: overview.value.high, color: '#ff4d4f', riskLevel: 'high' as RiskLevel },
  { title: '中风险', count: overview.value.medium, color: '#faad14', riskLevel: 'medium' as RiskLevel },
  { title: '低风险', count: overview.value.low, color: '#52c41a', riskLevel: 'low' as RiskLevel }
])

// 近八周趋势图：历史周取快照，本周取实时值（阈值修改后随之重算）
const trendOption = computed<ECOption>(() => {
  const trend = riskStore.weeklyTrend

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['高风险', '中风险', '低风险']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: trend.map((w, index) =>
          index === trend.length - 1 ? '本周' : formatDate(w.weekStart, 'MM-DD')
        )
      }
    ],
    yAxis: [
      {
        type: 'value',
        minInterval: 1
      }
    ],
    series: [
      {
        name: '高风险',
        type: 'line',
        smooth: true,
        data: trend.map(w => w.high),
        itemStyle: { color: '#ff4d4f' }
      },
      {
        name: '中风险',
        type: 'line',
        smooth: true,
        data: trend.map(w => w.medium),
        itemStyle: { color: '#faad14' }
      },
      {
        name: '低风险',
        type: 'line',
        smooth: true,
        data: trend.map(w => w.low),
        itemStyle: { color: '#52c41a' }
      }
    ]
  }
})

// 跳入已按风险等级筛好的学生列表
const handleJump = (riskLevel: RiskLevel) => {
  router.push({ path: '/students', query: { riskLevel } })
}

onMounted(() => {
  riskStore.evaluateAll()
})
</script>

<style scoped lang="scss">
.risk-overview-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.risk-items {
  display: flex;
  justify-content: space-around;

  .risk-item {
    text-align: center;
    cursor: pointer;
    padding: 8px 24px;
    border-radius: 8px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f7fa;
    }

    .risk-count {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .risk-title {
      font-size: 14px;
      color: #909399;
    }
  }
}

.risk-trend {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 16px;

  .trend-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }
}
</style>
