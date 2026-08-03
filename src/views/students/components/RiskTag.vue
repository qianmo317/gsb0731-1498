<template>
  <el-popover
    placement="right"
    :width="300"
    trigger="hover"
    :disabled="!risk"
  >
    <template #reference>
      <el-tag :type="tagType" effect="light" class="risk-tag">
        <span
          v-if="risk && risk.thresholdSource === 'group'"
          class="source-dot"
          title="使用分组独立阈值"
        />
        {{ riskLabel }}
      </el-tag>
    </template>
    <div v-if="risk" class="risk-detail">
      <div class="risk-header">
        <span class="risk-score">风险评分：{{ risk.score }}</span>
        <el-tag
          v-if="risk.thresholdSource === 'group'"
          size="small"
          type="success"
          effect="dark"
        >分组阈值{{ risk.studentGroup ? `·${risk.studentGroup}` : '' }}</el-tag>
        <el-tag v-else size="small" type="info" effect="plain">全局阈值</el-tag>
      </div>
      <div class="factor-list">
        <div
          v-for="factor in risk.factors"
          :key="factor.dimension"
          class="factor-item"
          :class="`factor-${factor.level}`"
        >
          <span class="factor-label">{{ factor.label }}</span>
          <span class="factor-desc">{{ factor.description }}</span>
        </div>
      </div>
      <div v-if="risk.latestFollowUpAt" class="latest-followup">
        最近跟进：{{ formatFollowUp(risk.latestFollowUpAt) }}
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { StudentRisk } from '@/types/risk'
import { RISK_LEVEL_META } from '@/utils/risk'

interface Props {
  risk?: StudentRisk
}

const props = defineProps<Props>()

const tagType = computed(() => {
  if (!props.risk) return 'info'
  return RISK_LEVEL_META[props.risk.level].type
})

const riskLabel = computed(() => {
  if (!props.risk) return '未知'
  return RISK_LEVEL_META[props.risk.level].label
})

const formatFollowUp = (dateStr: string): string => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.risk-tag {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .source-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #67c23a;
    box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
  }
}

.risk-detail {
  .risk-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;

    .risk-score {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
    }
  }

  .factor-list {
    .factor-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;

      .factor-label {
        color: #606266;
      }

      .factor-desc {
        color: #909399;
      }

      &.factor-high {
        .factor-desc {
          color: #f56c6c;
          font-weight: 500;
        }
      }

      &.factor-medium {
        .factor-desc {
          color: #e6a23c;
          font-weight: 500;
        }
      }
    }
  }

  .latest-followup {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #ebeef5;
    font-size: 12px;
    color: #909399;
  }
}
</style>
