<template>
  <div class="homework-stats">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon completion">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">平均完成率</div>
              <div class="stat-value">{{ stats.completionRate }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon score">
              <el-icon :size="32"><TrophyBase /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">平均分</div>
              <div class="stat-value">{{ stats.averageScore }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon excellent">
              <el-icon :size="32"><Star /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">优秀率</div>
              <div class="stat-value">{{ stats.excellentRate }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">待批改</div>
              <div class="stat-value">{{ stats.pendingGrade }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>提交时间分布</span>
            </div>
          </template>
          <div class="chart-container">
            <BarChart
              :data="submissionTrendData"
              height="300px"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>分数分布</span>
            </div>
          </template>
          <div class="chart-container">
            <BarChart
              :data="scoreDistributionData"
              height="300px"
              color="#67c23a"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, TrophyBase, Star, Clock } from '@element-plus/icons-vue'
import BarChart from '@/components/charts/BarChart.vue'
import type { HomeworkStatistics } from '@/types/homework'

// Props
interface Props {
  stats: HomeworkStatistics
}

const props = defineProps<Props>()

// 提交趋势数据
const submissionTrendData = computed(() => {
  return (props.stats.submissionTrend || []).map(item => ({
    name: item.date,
    value: item.count
  }))
})

// 分数分布数据
const scoreDistributionData = computed(() => {
  return (props.stats.scoreDistribution || []).map(item => ({
    name: item.range,
    value: item.count
  }))
})
</script>

<style scoped lang="scss">
.homework-stats {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        border-radius: 12px;

        &.completion {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }

        &.score {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: #fff;
        }

        &.excellent {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: #fff;
        }

        &.pending {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: #fff;
        }
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }

  .card-header {
    font-weight: 600;
    font-size: 16px;
  }

  .chart-container {
    min-height: 300px;
  }
}
</style>
