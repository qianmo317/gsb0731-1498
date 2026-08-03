<template>
  <div class="risk-settings-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>风险预警阈值配置</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="全局阈值" name="global">
          <el-alert
            title="全局阈值作为所有学生的默认配置；未单独配置阈值的分组将回退到此配置。修改后立即生效并保存在浏览器本地。"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 24px"
          />

          <el-form :model="form" label-width="200px" class="threshold-form">
            <el-divider content-position="left">作业逾期</el-divider>
            <el-form-item label="中风险：逾期次数 ≥">
              <el-input-number v-model="form.overdueHomework.medium" :min="1" :max="20" />
              <span class="hint">达到此次数判定为中风险</span>
            </el-form-item>
            <el-form-item label="高风险：逾期次数 ≥">
              <el-input-number v-model="form.overdueHomework.high" :min="1" :max="50" />
              <span class="hint">达到此次数判定为高风险（按当前时间与截止时间实时判定）</span>
            </el-form-item>

            <el-divider content-position="left">学习活跃度</el-divider>
            <el-form-item label="中风险：连续不活跃 ≥">
              <el-input-number v-model="form.inactivity.mediumDays" :min="1" :max="60" />
              <span class="hint">天</span>
            </el-form-item>
            <el-form-item label="高风险：连续不活跃 ≥">
              <el-input-number v-model="form.inactivity.highDays" :min="1" :max="120" />
              <span class="hint">天</span>
            </el-form-item>

            <el-divider content-position="left">成绩预警</el-divider>
            <el-form-item label="成绩警戒线（基线分）">
              <el-input-number v-model="form.scoreWarning.baseline" :min="0" :max="100" />
              <span class="hint">平均分低于此分数视为风险</span>
            </el-form-item>
            <el-form-item label="中风险：低于警戒线 ≥">
              <el-input-number v-model="form.scoreWarning.mediumGap" :min="1" :max="50" />
              <span class="hint">分</span>
            </el-form-item>
            <el-form-item label="高风险：低于警戒线 ≥">
              <el-input-number v-model="form.scoreWarning.highGap" :min="1" :max="100" />
              <span class="hint">分</span>
            </el-form-item>

            <el-divider content-position="left">沟通跟进</el-divider>
            <el-form-item label="中风险：未解决沟通 ≥">
              <el-input-number v-model="form.unresolvedCommunication.medium" :min="1" :max="20" />
              <span class="hint">条（含未解决沟通记录与未完成跟进）</span>
            </el-form-item>
            <el-form-item label="高风险：未解决沟通 ≥">
              <el-input-number v-model="form.unresolvedCommunication.high" :min="1" :max="50" />
              <span class="hint">条</span>
            </el-form-item>
          </el-form>

          <div class="form-actions">
            <el-button @click="handleReset">恢复默认</el-button>
            <el-button type="primary" @click="handleSaveGlobal">保存全局配置</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="分组阈值" name="group">
          <el-alert
            title="为特定分组单独配置阈值，未配置的分组自动回<[PLHD89_never_used_51bce0c785ca2f68081bfa7d91973934]>全局阈值。修改后首页概览、列表标识、趋势图、详情档案均按各学生实际生效的阈值重算。"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 24px"
          />

          <el-form label-width="120px" class="group-form">
            <el-form-item label="选择分组">
              <el-select v-model="selectedGroup" placeholder="请选择分组" @change="handleGroupChange">
                <el-option
                  v-for="g in groupOptions"
                  :key="g"
                  :label="`${g}${riskStore.getGroupOverride(g) ? '（已配置）' : ''}`"
                  :value="g"
                />
              </el-select>
              <el-button
                v-if="selectedGroup && riskStore.getGroupOverride(selectedGroup)"
                type="danger"
                link
                style="margin-left: 12px"
                @click="handleClearGroup"
              >
                清除该分组配置，回退全局
              </el-button>
            </el-form-item>

            <template v-if="selectedGroup">
              <el-divider content-position="left">作业逾期</el-divider>
              <el-form-item label="中风险次数 ≥">
                <el-input-number v-model="groupForm.overdueHomework.medium" :min="1" :max="20" />
              </el-form-item>
              <el-form-item label="高风险次数 ≥">
                <el-input-number v-model="groupForm.overdueHomework.high" :min="1" :max="50" />
              </el-form-item>

              <el-divider content-position="left">学习活跃度</el-divider>
              <el-form-item label="中风险天数 ≥">
                <el-input-number v-model="groupForm.inactivity.mediumDays" :min="1" :max="60" />
              </el-form-item>
              <el-form-item label="高风险天数 ≥">
                <el-input-number v-model="groupForm.inactivity.highDays" :min="1" :max="120" />
              </el-form-item>

              <el-divider content-position="left">成绩预警</el-divider>
              <el-form-item label="基线分">
                <el-input-number v-model="groupForm.scoreWarning.baseline" :min="0" :max="100" />
              </el-form-item>
              <el-form-item label="中风险分差 ≥">
                <el-input-number v-model="groupForm.scoreWarning.mediumGap" :min="1" :max="50" />
              </el-form-item>
              <el-form-item label="高风险分差 ≥">
                <el-input-number v-model="groupForm.scoreWarning.highGap" :min="1" :max="100" />
              </el-form-item>

              <el-divider content-position="left">沟通跟进</el-divider>
              <el-form-item label="中风险条数 ≥">
                <el-input-number v-model="groupForm.unresolvedCommunication.medium" :min="1" :max="20" />
              </el-form-item>
              <el-form-item label="高风险条数 ≥">
                <el-input-number v-model="groupForm.unresolvedCommunication.high" :min="1" :max="50" />
              </el-form-item>

              <div class="form-actions">
                <el-button type="primary" @click="handleSaveGroup">保存分组配置</el-button>
              </div>
            </template>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRiskStore } from '@/stores'
import { DEFAULT_RISK_THRESHOLD } from '@/utils/risk'
import type { RiskThresholdConfig, GroupThresholdOverride } from '@/types/risk'

const riskStore = useRiskStore()
const activeTab = ref<'global' | 'group'>('global')

const groupOptions = ['A组', 'B组', 'C组', 'D组']
const selectedGroup = ref('')

const form = reactive<RiskThresholdConfig>({
  overdueHomework: { ...DEFAULT_RISK_THRESHOLD.overdueHomework },
  inactivity: { ...DEFAULT_RISK_THRESHOLD.inactivity },
  scoreWarning: { ...DEFAULT_RISK_THRESHOLD.scoreWarning },
  unresolvedCommunication: { ...DEFAULT_RISK_THRESHOLD.unresolvedCommunication }
})

const emptyGroupForm = (): RiskThresholdConfig => ({
  overdueHomework: { ...DEFAULT_RISK_THRESHOLD.overdueHomework },
  inactivity: { ...DEFAULT_RISK_THRESHOLD.inactivity },
  scoreWarning: { ...DEFAULT_RISK_THRESHOLD.scoreWarning },
  unresolvedCommunication: { ...DEFAULT_RISK_THRESHOLD.unresolvedCommunication }
})

const groupForm = reactive<RiskThresholdConfig>(emptyGroupForm())

const syncFromStore = () => {
  const t = riskStore.threshold
  form.overdueHomework = { ...t.overdueHomework }
  form.inactivity = { ...t.inactivity }
  form.scoreWarning = { ...t.scoreWarning }
  form.unresolvedCommunication = { ...t.unresolvedCommunication }
}

const validateThreshold = (t: RiskThresholdConfig): boolean => {
  if (t.overdueHomework.high < t.overdueHomework.medium) {
    ElMessage.warning('作业逾期高风险阈值不能小于中风险阈值')
    return false
  }
  if (t.inactivity.highDays < t.inactivity.mediumDays) {
    ElMessage.warning('不活跃高风险天数不能小于中风险天数')
    return false
  }
  if (t.scoreWarning.highGap < t.scoreWarning.mediumGap) {
    ElMessage.warning('成绩高风险分差不能小于中风险分差')
    return false
  }
  if (t.unresolvedCommunication.high < t.unresolvedCommunication.medium) {
    ElMessage.warning('沟通高风险阈值不能小于中风险阈值')
    return false
  }
  return true
}

const handleSave = () => {
  if (!validateThreshold(form)) return
  riskStore.updateThreshold({
    overdueHomework: { ...form.overdueHomework },
    inactivity: { ...form.inactivity },
    scoreWarning: { ...form.scoreWarning },
    unresolvedCommunication: { ...form.unresolvedCommunication }
  })
  riskStore.refreshEvaluation()
  ElMessage.success('阈值配置已保存，预警结果已实时更新')
}

const handleSaveGlobal = () => {
  handleSave()
}

const handleReset = () => {
  riskStore.resetThreshold()
  syncFromStore()
  riskStore.refreshEvaluation()
  ElMessage.success('已恢复默认阈值')
}

const handleGroupChange = (group: string) => {
  const effective = riskStore.getGroupEffectiveThreshold(group)
  groupForm.overdueHomework = { ...effective.overdueHomework }
  groupForm.inactivity = { ...effective.inactivity }
  groupForm.scoreWarning = { ...effective.scoreWarning }
  groupForm.unresolvedCommunication = { ...effective.unresolvedCommunication }
}

const handleSaveGroup = () => {
  if (!selectedGroup.value) return
  if (!validateThreshold(groupForm)) return

  // 计算与全局阈值的差异字段，只存覆盖部分
  const globalT = riskStore.threshold
  const override: GroupThresholdOverride = {}
  ;(['overdueHomework', 'inactivity', 'scoreWarning', 'unresolvedCommunication'] as const).forEach(
    section => {
      const diff: Record<string, number> = {}
      ;(Object.keys(groupForm[section]) as Array<keyof typeof groupForm[typeof section]>).forEach(
        key => {
          const gv = groupForm[section][key] as number
          const lv = globalT[section][key] as number
          if (gv !== lv) {
            diff[key as string] = gv
          }
        }
      )
      if (Object.keys(diff).length > 0) {
        override[section] = diff as GroupThresholdOverride[typeof section]
      }
    }
  )

  riskStore.updateGroupOverride(selectedGroup.value, override)
  ElMessage.success(`分组「${selectedGroup.value}」阈值已保存，相关学生风险已重算`)
}

const handleClearGroup = async () => {
  if (!selectedGroup.value) return
  try {
    await ElMessageBox.confirm(
      `确定清除「${selectedGroup.value}」的分组阈值吗？该分组学生将回退到全局阈值。`,
      '提示',
      { type: 'warning' }
    )
    riskStore.clearGroupOverride(selectedGroup.value)
    handleGroupChange(selectedGroup.value)
    ElMessage.success('已清除分组配置，回退全局阈值')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  syncFromStore()
})
</script>

<style scoped lang="scss">
.risk-settings-page {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.threshold-form,
.group-form {
  max-width: 700px;

  .hint {
    margin-left: 12px;
    color: #909399;
    font-size: 13px;
  }
}

.form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
