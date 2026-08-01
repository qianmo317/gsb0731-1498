<template>
  <div class="homework-list">
    <el-row :gutter="20">
      <el-col
        v-for="homework in homeworks"
        :key="homework.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <el-card
          class="homework-card"
          shadow="hover"
          :body-style="{ padding: '20px' }"
          @click="handleCardClick(homework)"
        >
          <div class="card-header">
            <div class="title-row">
              <h3 class="homework-title">{{ homework.title }}</h3>
              <el-tag :type="getStatusType(homework.status)" size="small">
                {{ formatStatus(homework.status) }}
              </el-tag>
            </div>
            <div class="subject-row">
              <el-tag type="info" size="small">{{ homework.subject }}</el-tag>
              <el-tag :type="getDifficultyType(homework.difficulty)" size="small">
                {{ formatStatus(homework.difficulty) }}
              </el-tag>
            </div>
          </div>

          <div class="card-content">
            <div class="info-item">
              <el-icon><Clock /></el-icon>
              <span class="label">截止时间：</span>
              <span :class="{ 'text-danger': isOverdue(homework.dueDate) }">
                {{ formatDateTime(homework.dueDate) }}
              </span>
            </div>

            <div class="info-item">
              <el-icon><User /></el-icon>
              <span class="label">布置人数：</span>
              <span>{{ homework.totalCount }} 人</span>
            </div>

            <div class="progress-section">
              <div class="progress-header">
                <span class="label">完成率</span>
                <span class="percentage">
                  {{ getCompletionRate(homework) }}%
                </span>
              </div>
              <el-progress
                :percentage="getCompletionRate(homework)"
                :color="getProgressColor(getCompletionRate(homework))"
                :stroke-width="8"
              />
            </div>

            <div class="progress-section">
              <div class="progress-header">
                <span class="label">批改进度</span>
                <span class="percentage">
                  {{ getGradeRate(homework) }}%
                </span>
              </div>
              <el-progress
                :percentage="getGradeRate(homework)"
                :color="getProgressColor(getGradeRate(homework))"
                :stroke-width="8"
              />
            </div>

            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">平均分</span>
                <span class="stat-value">
                  {{ homework.averageScore > 0 ? homework.averageScore.toFixed(1) : '-' }}
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">优秀作业</span>
                <span class="stat-value excellent">
                  {{ homework.excellentCount }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <el-button
              type="primary"
              size="small"
              link
              @click.stop="handleViewDetail(homework)"
            >
              查看详情
            </el-button>
            <el-button
              type="success"
              size="small"
              link
              @click.stop="handleGrade(homework)"
            >
              批改作业
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty
      v-if="!homeworks || homeworks.length === 0"
      description="暂无作业数据"
    />
  </div>
</template>

<script setup lang="ts">
import { Clock, User } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/date'
import { formatStatus } from '@/utils/format'
import { isExpired } from '@/utils/date'
import type { Homework } from '@/types/homework'

// Props
interface Props {
  homeworks: Homework[]
}

defineProps<Props>()

// Emits
interface Emits {
  (e: 'view-detail', homework: Homework): void
  (e: 'grade', homework: Homework): void
  (e: 'card-click', homework: Homework): void
}

const emit = defineEmits<Emits>()

// 获取完成率
const getCompletionRate = (homework: Homework): number => {
  if (homework.totalCount === 0) return 0
  return Math.round((homework.submittedCount / homework.totalCount) * 100)
}

// 获取批改率
const getGradeRate = (homework: Homework): number => {
  if (homework.submittedCount === 0) return 0
  return Math.round((homework.gradedCount / homework.submittedCount) * 100)
}

// 获取进度条颜色
const getProgressColor = (percentage: number): string => {
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

// 获取状态类型
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    overdue: 'danger'
  }
  return map[status] || 'info'
}

// 获取难度类型
const getDifficultyType = (difficulty: string) => {
  const map: Record<string, any> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return map[difficulty] || 'info'
}

// 判断是否逾期
const isOverdue = (dueDate: string): boolean => {
  return isExpired(dueDate)
}

// 查看详情
const handleViewDetail = (homework: Homework) => {
  emit('view-detail', homework)
}

// 批改作业
const handleGrade = (homework: Homework) => {
  emit('grade', homework)
}

// 卡片点击
const handleCardClick = (homework: Homework) => {
  emit('card-click', homework)
}
</script>

<style scoped lang="scss">
.homework-list {
  .homework-card {
    margin-bottom: 20px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
    }

    .card-header {
      margin-bottom: 16px;

      .title-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 8px;

        .homework-title {
          flex: 1;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }

      .subject-row {
        display: flex;
        gap: 8px;
      }
    }

    .card-content {
      .info-item {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 12px;
        font-size: 14px;
        color: #606266;

        .el-icon {
          color: #909399;
        }

        .label {
          color: #909399;
        }

        .text-danger {
          color: #f56c6c;
          font-weight: 500;
        }
      }

      .progress-section {
        margin-bottom: 16px;

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;

          .label {
            color: #606266;
            font-weight: 500;
          }

          .percentage {
            color: #409eff;
            font-weight: 600;
          }
        }
      }

      .stats-row {
        display: flex;
        justify-content: space-around;
        padding: 12px 0;
        border-top: 1px solid #ebeef5;
        border-bottom: 1px solid #ebeef5;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;

          .stat-label {
            font-size: 12px;
            color: #909399;
          }

          .stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #409eff;

            &.excellent {
              color: #67c23a;
            }
          }
        }
      }
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #ebeef5;
    }
  }
}
</style>
