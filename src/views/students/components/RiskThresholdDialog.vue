<template>
  <el-dialog
    :model-value="modelValue"
    title="风险预警阈值配置"
    width="560px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <el-form label-width="180px">
      <el-form-item label="配置范围">
        <el-select v-model="scope" style="width: 220px" @change="handleScopeChange">
          <el-option label="全局阈值" value="__global__" />
          <el-option
            v-for="group in groups"
            :key="group"
            :label="`分组：${group}`"
            :value="group"
          />
        </el-select>
        <span class="hint">
          {{ isGlobal ? '所有未单独配置的分组使用全局阈值' : '仅对该分组生效，未配置则回退全局' }}
        </span>
      </el-form-item>

      <el-alert
        v-if="!isGlobal && !hasGroupOverride"
        type="info"
        :closable="false"
        show-icon
        title="该分组当前使用全局阈值，保存后将启用分组独立阈值"
        style="margin-bottom: 16px"
      />

      <el-form-item label="逾期未交次数（高风险）">
        <el-input-number v-model="form.overdueCount" :min="1" :max="50" />
        <span class="hint">达到该次数触发高风险</span>
      </el-form-item>
      <el-form-item label="无学习动态天数">
        <el-input-number v-model="form.inactiveDays" :min="1" :max="90" />
        <span class="hint">连续多少天无动态算不活跃</span>
      </el-form-item>
      <el-form-item label="平均分警戒线">
        <el-input-number v-model="form.scoreLine" :min="0" :max="100" />
        <span class="hint">平均分低于该值扣分</span>
      </el-form-item>
      <el-form-item label="未解决沟通条数（高风险）">
        <el-input-number v-model="form.unresolvedCount" :min="1" :max="50" />
        <span class="hint">未解决沟通达到该条数触发高风险</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button v-if="isGlobal" @click="handleReset">恢复默认</el-button>
      <el-button
        v-else
        :disabled="!hasGroupOverride"
        @click="handleRemoveGroup"
      >
        回退全局
      </el-button>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存并生效</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { DEFAULT_RISK_THRESHOLDS } from '@/utils/risk'
import type { RiskThresholds, GroupThresholds } from '@/types/risk'

interface Props {
  modelValue: boolean
  thresholds: RiskThresholds // 全局阈值
  groupThresholds: GroupThresholds // 分组覆盖
  groups: string[] // 可配置的分组列表
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  groupThresholds: () => ({}),
  groups: () => []
})

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save-global', value: RiskThresholds): void
  (e: 'save-group', group: string, value: RiskThresholds): void
  (e: 'remove-group', group: string): void
}

const emit = defineEmits<Emits>()

// 配置范围：'__global__' 表示全局，否则为分组名
const scope = ref<string>('__global__')
const form = reactive<RiskThresholds>({ ...props.thresholds })

const isGlobal = computed(() => scope.value === '__global__')
const hasGroupOverride = computed(
  () => !isGlobal.value && !!props.groupThresholds[scope.value]
)

// 按当前范围载入对应阈值：分组已配置用分组值，否则回退全局值
const loadFormForScope = () => {
  if (isGlobal.value) {
    Object.assign(form, props.thresholds)
  } else {
    Object.assign(form, props.groupThresholds[scope.value] || props.thresholds)
  }
}

// 打开时同步最新阈值
watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      scope.value = '__global__'
      loadFormForScope()
    }
  }
)

const handleScopeChange = () => {
  loadFormForScope()
}

const handleVisibleChange = (value: boolean) => {
  emit('update:modelValue', value)
}

const handleReset = () => {
  Object.assign(form, DEFAULT_RISK_THRESHOLDS)
}

const handleRemoveGroup = () => {
  emit('remove-group', scope.value)
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSave = () => {
  if (isGlobal.value) {
    emit('save-global', { ...form })
  } else {
    emit('save-group', scope.value, { ...form })
  }
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.hint {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
