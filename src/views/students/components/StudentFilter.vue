<template>
  <div class="student-filter">
    <el-form :model="filterForm" inline>
      <el-form-item>
        <el-input
          v-model="filterForm.keyword"
          placeholder="搜索学生姓名、手机号"
          :prefix-icon="Search"
          clearable
          style="width: 280px"
          @input="handleSearch"
        />
      </el-form-item>

      <el-form-item label="状态">
        <el-select
          v-model="filterForm.status"
          placeholder="请选择状态"
          clearable
          style="width: 150px"
          @change="handleFilter"
        >
          <el-option label="在读" value="active" />
          <el-option label="休学" value="inactive" />
          <el-option label="毕业" value="graduated" />
        </el-select>
      </el-form-item>

      <el-form-item label="等级">
        <el-select
          v-model="filterForm.level"
          placeholder="请选择等级"
          clearable
          style="width: 150px"
          @change="handleFilter"
        >
          <el-option label="优秀" value="excellent" />
          <el-option label="良好" value="good" />
          <el-option label="一般" value="average" />
          <el-option label="较差" value="poor" />
        </el-select>
      </el-form-item>

      <el-form-item label="风险等级">
        <el-select
          v-model="filterForm.riskLevel"
          placeholder="请选择风险等级"
          clearable
          style="width: 150px"
          @change="handleFilter"
        >
          <el-option label="高风险" value="high" />
          <el-option label="中风险" value="medium" />
          <el-option label="低风险" value="low" />
        </el-select>
      </el-form-item>

      <el-form-item label="分组">
        <el-select
          v-model="filterForm.group"
          placeholder="请选择分组"
          clearable
          style="width: 150px"
          @change="handleFilter"
        >
          <el-option label="A组" value="A组" />
          <el-option label="B组" value="B组" />
          <el-option label="C组" value="C组" />
          <el-option label="D组" value="D组" />
        </el-select>
      </el-form-item>

      <el-form-item label="年级">
        <el-select
          v-model="filterForm.grade"
          placeholder="请选择年级"
          clearable
          style="width: 150px"
          @change="handleFilter"
        >
          <el-option label="一年级" value="一年级" />
          <el-option label="二年级" value="二年级" />
          <el-option label="三年级" value="三年级" />
          <el-option label="四年级" value="四年级" />
          <el-option label="五年级" value="五年级" />
          <el-option label="六年级" value="六年级" />
          <el-option label="初一" value="初一" />
          <el-option label="初二" value="初二" />
          <el-option label="初三" value="初三" />
        </el-select>
      </el-form-item>

      <el-form-item label="标签">
        <el-select
          v-model="filterForm.tags"
          placeholder="请选择标签"
          multiple
          clearable
          style="width: 200px"
          @change="handleFilter"
        >
          <el-option label="认真" value="认真" />
          <el-option label="活跃" value="活跃" />
          <el-option label="需关注" value="需关注" />
          <el-option label="进步快" value="进步快" />
          <el-option label="基础薄弱" value="基础薄弱" />
          <el-option label="自律" value="自律" />
          <el-option label="有潜力" value="有潜力" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleFilter">
          搜索
        </el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import type { StudentFilterParams } from '@/types/student'
import type { RiskLevel } from '@/types/risk'

export interface StudentFilterValue extends StudentFilterParams {
  riskLevel?: RiskLevel
}

// Props
interface Props {
  modelValue?: StudentFilterValue
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: StudentFilterValue): void
  (e: 'search'): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

// 筛选表单
const filterForm = reactive<StudentFilterValue>({
  keyword: props.modelValue.keyword || '',
  status: props.modelValue.status,
  level: props.modelValue.level,
  riskLevel: props.modelValue.riskLevel,
  group: props.modelValue.group,
  grade: props.modelValue.grade,
  tags: props.modelValue.tags || []
})

// 搜索处理
const handleSearch = () => {
  emit('update:modelValue', { ...filterForm })
  emit('search')
}

// 筛选处理
const handleFilter = () => {
  emit('update:modelValue', { ...filterForm })
  emit('search')
}

// 重置处理
const handleReset = () => {
  filterForm.keyword = ''
  filterForm.status = undefined
  filterForm.level = undefined
  filterForm.riskLevel = undefined
  filterForm.group = undefined
  filterForm.grade = undefined
  filterForm.tags = []

  emit('update:modelValue', { ...filterForm })
  emit('reset')
}
</script>

<style scoped lang="scss">
.student-filter {
  margin-bottom: 20px;

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
  }
}
</style>
