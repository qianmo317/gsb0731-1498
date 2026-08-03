<template>
  <el-dialog
    v-model="dialogVisible"
    title="风险预警阈值设置"
    width="680px"
    :close-on-click-modal="false"
  >
    <el-form label-width="180px" class="threshold-form">
      <el-form-item label="配置范围">
        <el-radio-group v-model="selectedGroup" @change="handleGroupChange">
          <el-radio-button label="">全局阈值</el-radio-button>
          <el-radio-button
            v-for="g in groups"
            :key="g"
            :label="g"
          >
            {{ g }}
            <el-tag
              v-if="groupThresholds[g]"
              size="small"
              type="success"
              effect="dark"
              style="margin-left: 4px; transform: scale(0.85)"
            >已配置</el-tag>
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-alert
        v-if="selectedGroup"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #title>
          当前编辑 <b>{{ selectedGroup }}</b> 的独立阈值，未修改的维度将继承全局阈值。
          该组学生风险等级按此配置单独计算。
        </template>
      </el-alert>
      <el-alert
        v-else
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #title>
          全局阈值为默认配置，未单独设置阈值的分组将使用此配置。
        </template>
      </el-alert>

      <el-divider content-position="left">
        作业逾期
        <el-tag
          v-if="selectedGroup && isDimensionOverridden('homework')"
          size="small"
          type="success"
          style="margin-left: 8px"
        >分组覆盖</el-tag>
      </el-divider>
      <el-form-item label="中风险阈值（次）">
        <el-input-number
          v-model="localThresholds.homework.mediumThreshold"
          :min="1"
          :max="20"
          controls-position="right"
        />
        <span class="threshold-hint">逾期达到此次数标记为中风险</span>
      </el-form-item>
      <el-form-item label="高风险阈值（次）">
        <el-input-number
          v-model="localThresholds.homework.highThreshold"
          :min="1"
          :max="20"
          controls-position="right"
        />
        <span class="threshold-hint">逾期达到此次数标记为高风险</span>
      </el-form-item>

      <el-divider content-position="left">
        学习活跃度
        <el-tag
          v-if="selectedGroup && isDimensionOverridden('activity')"
          size="small"
          type="success"
          style="margin-left: 8px"
        >分组覆盖</el-tag>
      </el-divider>
      <el-form-item label="中风险阈值（天）">
        <el-input-number
          v-model="localThresholds.activity.mediumThreshold"
          :min="1"
          :max="365"
          controls-position="right"
        />
        <span class="threshold-hint">连续未活跃天数达到此值标记为中风险</span>
      </el-form-item>
      <el-form-item label="高风险阈值（天）">
        <el-input-number
          v-model="localThresholds.activity.highThreshold"
          :min="1"
          :max="999"
          controls-position="right"
        />
        <span class="threshold-hint">连续未活跃天数达到此值标记为高风险</span>
      </el-form-item>

      <el-divider content-position="left">
        成绩预警
        <el-tag
          v-if="selectedGroup && isDimensionOverridden('score')"
          size="small"
          type="success"
          style="margin-left: 8px"
        >分组覆盖</el-tag>
      </el-divider>
      <el-form-item label="成绩警戒线（分）">
        <el-input-number
          v-model="localThresholds.score.warningLine"
          :min="0"
          :max="100"
          controls-position="right"
        />
        <span class="threshold-hint">平均分低于此线进入预警范围</span>
      </el-form-item>
      <el-form-item label="中风险分差（分）">
        <el-input-number
          v-model="localThresholds.score.mediumGap"
          :min="1"
          :max="50"
          controls-position="right"
        />
        <span class="threshold-hint">低于警戒线此分数标记为中风险</span>
      </el-form-item>
      <el-form-item label="高风险分差（分）">
        <el-input-number
          v-model="localThresholds.score.highGap"
          :min="1"
          :max="100"
          controls-position="right"
        />
        <span class="threshold-hint">低于警戒线此分数标记为高风险</span>
      </el-form-item>

      <el-divider content-position="left">
        沟通跟进
        <el-tag
          v-if="selectedGroup && isDimensionOverridden('communication')"
          size="small"
          type="success"
          style="margin-left: 8px"
        >分组覆盖</el-tag>
      </el-divider>
      <el-form-item label="中风险阈值（条）">
        <el-input-number
          v-model="localThresholds.communication.mediumThreshold"
          :min="1"
          :max="20"
          controls-position="right"
        />
        <span class="threshold-hint">未解决沟通达到此条数标记为中风险</span>
      </el-form-item>
      <el-form-item label="高风险阈值（条）">
        <el-input-number
          v-model="localThresholds.communication.highThreshold"
          :min="1"
          :max="20"
          controls-position="right"
        />
        <span class="threshold-hint">未解决沟通达到此条数标记为高风险</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button
        v-if="selectedGroup && groupThresholds[selectedGroup]"
        type="danger"
        plain
        @click="handleClearGroup"
      >
        清除{{ selectedGroup }}配置，回退全局
      </el-button>
      <el-button v-if="!selectedGroup" @click="handleReset">恢复默认</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">
        {{ selectedGroup ? `保存${selectedGroup}阈值` : '保存并生效' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { RiskThresholdConfig, GroupThresholdMap, RiskDimension } from '@/types/risk'
import { DEFAULT_RISK_THRESHOLDS, mergeThresholds } from '@/utils/risk'

interface Props {
  modelValue: boolean
  thresholds: RiskThresholdConfig
  groupThresholds: GroupThresholdMap
  groups: string[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', thresholds: RiskThresholdConfig): void
  (e: 'reset'): void
  (e: 'save-group', payload: { group: string; thresholds: Partial<RiskThresholdConfig> }): void
  (e: 'clear-group', group: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const saving = ref(false)
const selectedGroup = ref('')

const dialogVisible = ref(props.modelValue)
watch(() => props.modelValue, val => {
  dialogVisible.value = val
})
watch(dialogVisible, val => {
  emit('update:modelValue', val)
})

const createDefaultLocal = (): RiskThresholdConfig => ({
  homework: { ...DEFAULT_RISK_THRESHOLDS.homework },
  activity: { ...DEFAULT_RISK_THRESHOLDS.activity },
  score: { ...DEFAULT_RISK_THRESHOLDS.score },
  communication: { ...DEFAULT_RISK_THRESHOLDS.communication }
})

const localThresholds = reactive<RiskThresholdConfig>(createDefaultLocal())

const syncFromProps = () => {
  if (selectedGroup.value) {
    const effective = mergeThresholds(
      props.thresholds,
      props.groupThresholds[selectedGroup.value]
    )
    localThresholds.homework = { ...effective.homework }
    localThresholds.activity = { ...effective.activity }
    localThresholds.score = { ...effective.score }
    localThresholds.communication = { ...effective.communication }
  } else {
    localThresholds.homework = { ...props.thresholds.homework }
    localThresholds.activity = { ...props.thresholds.activity }
    localThresholds.score = { ...props.thresholds.score }
    localThresholds.communication = { ...props.thresholds.communication }
  }
}

watch(
  () => [props.thresholds, props.groupThresholds, selectedGroup.value],
  syncFromProps,
  { deep: true }
)

watch(
  () => props.modelValue,
  val => {
    if (val) {
      selectedGroup.value = ''
      syncFromProps()
    }
  }
)

const handleGroupChange = () => {
  syncFromProps()
}

const isDimensionOverridden = (dim: RiskDimension): boolean => {
  if (!selectedGroup.value) return false
  const override = props.groupThresholds[selectedGroup.value]
  return !!(override && override[dim])
}

const buildGroupOverride = (): Partial<RiskThresholdConfig> => {
  const override: Partial<RiskThresholdConfig> = {}
  const base = props.thresholds
  const t = localThresholds

  const homeworkDiff: Partial<RiskThresholdConfig['homework']> = {}
  if (t.homework.mediumThreshold !== base.homework.mediumThreshold) {
    homeworkDiff.mediumThreshold = t.homework.mediumThreshold
  }
  if (t.homework.highThreshold !== base.homework.highThreshold) {
    homeworkDiff.highThreshold = t.homework.highThreshold
  }
  if (Object.keys(homeworkDiff).length > 0) override.homework = homeworkDiff

  const activityDiff: Partial<RiskThresholdConfig['activity']> = {}
  if (t.activity.mediumThreshold !== base.activity.mediumThreshold) {
    activityDiff.mediumThreshold = t.activity.mediumThreshold
  }
  if (t.activity.highThreshold !== base.activity.highThreshold) {
    activityDiff.highThreshold = t.activity.highThreshold
  }
  if (Object.keys(activityDiff).length > 0) override.activity = activityDiff

  const scoreDiff: Partial<RiskThresholdConfig['score']> = {}
  if (t.score.warningLine !== base.score.warningLine) {
    scoreDiff.warningLine = t.score.warningLine
  }
  if (t.score.mediumGap !== base.score.mediumGap) {
    scoreDiff.mediumGap = t.score.mediumGap
  }
  if (t.score.highGap !== base.score.highGap) {
    scoreDiff.highGap = t.score.highGap
  }
  if (Object.keys(scoreDiff).length > 0) override.score = scoreDiff

  const communicationDiff: Partial<RiskThresholdConfig['communication']> = {}
  if (t.communication.mediumThreshold !== base.communication.mediumThreshold) {
    communicationDiff.mediumThreshold = t.communication.mediumThreshold
  }
  if (t.communication.highThreshold !== base.communication.highThreshold) {
    communicationDiff.highThreshold = t.communication.highThreshold
  }
  if (Object.keys(communicationDiff).length > 0) override.communication = communicationDiff

  return override
}

const validate = (): boolean => {
  if (localThresholds.homework.highThreshold < localThresholds.homework.mediumThreshold) {
    ElMessage.warning('作业逾期高风险阈值不能小于中风险阈值')
    return false
  }
  if (localThresholds.activity.highThreshold < localThresholds.activity.mediumThreshold) {
    ElMessage.warning('活跃度高风险阈值不能小于中风险阈值')
    return false
  }
  if (localThresholds.score.highGap < localThresholds.score.mediumGap) {
    ElMessage.warning('成绩高风险分差不能小于中风险分差')
    return false
  }
  if (localThresholds.communication.highThreshold < localThresholds.communication.mediumThreshold) {
    ElMessage.warning('沟通高风险阈值不能小于中风险阈值')
    return false
  }
  return true
}

const handleSave = async () => {
  if (!validate()) return
  saving.value = true
  try {
    if (selectedGroup.value) {
      const override = buildGroupOverride()
      emit('save-group', { group: selectedGroup.value, thresholds: override })
      ElMessage.success(`${selectedGroup.value} 阈值已保存，预警结果已更新`)
    } else {
      emit('save', {
        homework: { ...localThresholds.homework },
        activity: { ...localThresholds.activity },
        score: { ...localThresholds.score },
        communication: { ...localThresholds.communication }
      })
      ElMessage.success('全局阈值已保存，预警结果已更新')
    }
    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  localThresholds.homework = { ...DEFAULT_RISK_THRESHOLDS.homework }
  localThresholds.activity = { ...DEFAULT_RISK_THRESHOLDS.activity }
  localThresholds.score = { ...DEFAULT_RISK_THRESHOLDS.score }
  localThresholds.communication = { ...DEFAULT_RISK_THRESHOLDS.communication }
  emit('reset')
  ElMessage.success('已恢复默认阈值')
}

const handleClearGroup = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清除 ${selectedGroup.value} 的独立阈值配置吗？清除后该组学生将回退使用全局阈值。`,
      '确认清除',
      { type: 'warning' }
    )
    emit('clear-group', selectedGroup.value)
    ElMessage.success(`${selectedGroup.value} 配置已清除，回退全局阈值`)
    syncFromProps()
  } catch {
    // cancelled
  }
}
</script>

<style scoped lang="scss">
.threshold-form {
  .threshold-hint {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }

  :deep(.el-divider__text) {
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;
  }
}
</style>
