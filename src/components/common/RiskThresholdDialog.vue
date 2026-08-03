<template>
  <el-dialog
    :model-value="modelValue"
    title="风险预警阈值设置"
    width="640px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
    @open="handleOpen"
  >
    <el-form :model="thresholdForm" label-width="160px" class="threshold-form">
      <el-form-item label="逾期未交次数">
        <el-input-number v-model="thresholdForm.overdueCount" :min="1" :max="20" />
        <div class="hint-text">逾期未交作业达到该次数判为高风险</div>
      </el-form-item>
      <el-form-item label="不活跃天数">
        <el-input-number v-model="thresholdForm.inactiveDays" :min="1" :max="90" />
        <div class="hint-text">连续无学习动态达到该天数判为高风险</div>
      </el-form-item>
      <el-form-item label="平均分警戒线">
        <el-input-number v-model="thresholdForm.averageScoreLine" :min="0" :max="100" />
        <div class="hint-text">平均分低于该分数线产生成绩风险</div>
      </el-form-item>
      <el-form-item label="未解决沟通条数">
        <el-input-number v-model="thresholdForm.unresolvedCount" :min="1" :max="20" />
        <div class="hint-text">未解决沟通达到该条数判为高风险</div>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">分组阈值</el-divider>
    <div class="hint-text group-hint">启用分组阈值后，该分组学生按分组值评估；未启用的分组回退使用上方全局阈值</div>
    <div v-if="groupRows.length > 0" class="group-list">
      <div v-for="row in groupRows" :key="row.group" class="group-row">
        <div class="group-head">
          <span class="group-name">{{ row.group }}</span>
          <el-switch v-model="row.enabled" active-text="启用分组阈值" />
        </div>
        <div class="group-fields" :class="{ disabled: !row.enabled }">
          <div class="group-field">
            <span class="field-label">逾期未交次数</span>
            <el-input-number v-model="row.values.overdueCount" :min="1" :max="20" size="small" :disabled="!row.enabled" />
          </div>
          <div class="group-field">
            <span class="field-label">不活跃天数</span>
            <el-input-number v-model="row.values.inactiveDays" :min="1" :max="90" size="small" :disabled="!row.enabled" />
          </div>
          <div class="group-field">
            <span class="field-label">平均分警戒线</span>
            <el-input-number v-model="row.values.averageScoreLine" :min="0" :max="100" size="small" :disabled="!row.enabled" />
          </div>
          <div class="group-field">
            <span class="field-label">未解决沟通条数</span>
            <el-input-number v-model="row.values.unresolvedCount" :min="1" :max="20" size="small" :disabled="!row.enabled" />
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无学生分组" :image-size="60" />

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRiskStore } from '@/stores'
import type { RiskThresholds } from '@/types/risk'

// Props
interface Props {
  modelValue: boolean
}

defineProps<Props>()

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const emit = defineEmits<Emits>()

const riskStore = useRiskStore()

// 全局阈值表单
const thresholdForm = reactive<RiskThresholds>({ ...riskStore.thresholds })
const saving = ref(false)

// 分组阈值表单
interface GroupThresholdRow {
  group: string
  enabled: boolean
  values: RiskThresholds
}
const groupRows = ref<GroupThresholdRow[]>([])

// 初始化表单：同步当前全局阈值与分组阈值
const initForm = () => {
  Object.assign(thresholdForm, riskStore.thresholds)

  const groups = Array.from(new Set(riskStore.profiles.map(p => p.group))).sort()
  groupRows.value = groups.map(group => {
    const override = riskStore.groupThresholds[group]
    return {
      group,
      enabled: !!override,
      values: { ...(override ?? riskStore.thresholds) }
    }
  })
}

// 弹窗打开时同步（组件以 v-if 挂载时为打开态，需同时在创建时初始化）
const handleOpen = () => {
  initForm()
}

// 创建时先初始化一次，保证以 v-if 挂载（打开态）的场景也有分组数据
initForm()

const handleVisibleChange = (visible: boolean) => {
  emit('update:modelValue', visible)
}

// 保存阈值，保存后预警、列表、首页立即按新值生效
const handleSave = async () => {
  saving.value = true
  try {
    const groupThresholds: Record<string, RiskThresholds> = {}
    groupRows.value
      .filter(row => row.enabled)
      .forEach(row => {
        groupThresholds[row.group] = { ...row.values }
      })

    await riskStore.updateThresholdConfig({ ...thresholdForm }, groupThresholds)
    ElMessage.success('预警阈值已更新')
    emit('update:modelValue', false)
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.threshold-form {
  .hint-text {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }
}

.group-hint {
  margin-bottom: 12px;
  font-size: 12px;
  color: #909399;
}

.group-list {
  max-height: 320px;
  overflow-y: auto;

  .group-row {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;

    .group-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .group-name {
        font-weight: 600;
      }
    }

    .group-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;

      &.disabled {
        opacity: 0.6;
      }

      .group-field {
        display: flex;
        align-items: center;
        gap: 8px;

        .field-label {
          font-size: 12px;
          color: #606266;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
