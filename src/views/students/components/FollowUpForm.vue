<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    class="followup-form"
  >
    <el-form-item label="学生">
      <div class="student-list">
        <el-tag
          v-for="student in selectedStudents"
          :key="student.id"
          class="student-tag"
          size="large"
        >
          <el-avatar :size="20" :src="student.avatar" style="margin-right: 4px" />
          {{ student.name }}
        </el-tag>
        <span v-if="selectedStudents.length > 1" class="batch-hint">
          将为 {{ selectedStudents.length }} 名学生批量创建跟进记录
        </span>
      </div>
    </el-form-item>

    <el-form-item label="风险等级">
      <el-tag :type="riskTagType" effect="dark">
        {{ riskLabel }}
      </el-tag>
    </el-form-item>

    <el-form-item label="跟进标题" prop="title">
      <el-input
        v-model="formData.title"
        placeholder="请输入跟进标题"
        clearable
        maxlength="50"
        show-word-limit
      />
    </el-form-item>

    <el-form-item label="跟进内容" prop="content">
      <el-input
        v-model="formData.content"
        type="textarea"
        :rows="6"
        placeholder="请描述跟进原因、沟通内容或处理方案"
        maxlength="1000"
        show-word-limit
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        发起跟进
      </el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Student } from '@/types/student'
import type { RiskLevel } from '@/types/risk'
import { formatRiskLevel, getRiskTagType } from '@/utils/format'

interface Props {
  students: Student[]
  riskLevel: RiskLevel
  loading?: boolean
  defaultTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  defaultTitle: ''
})

interface Emits {
  (e: 'submit', data: { title: string; content: string }): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

const formData = reactive({
  title: props.defaultTitle,
  content: ''
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入跟进标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入跟进内容', trigger: 'blur' },
    { min: 5, max: 1000, message: '内容长度在 5 到 1000 个字符', trigger: 'blur' }
  ]
}

const selectedStudents = computed(() => props.students)
const riskLabel = computed(() => formatRiskLevel(props.riskLevel))
const riskTagType = computed(() => getRiskTagType(props.riskLevel))

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    emit('submit', { ...formData })
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleCancel = () => {
  formRef.value?.resetFields()
  emit('cancel')
}

const resetForm = () => {
  formRef.value?.resetFields()
}

defineExpose({
  resetForm
})
</script>

<style scoped lang="scss">
.followup-form {
  padding: 20px;

  .student-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .student-tag {
    display: inline-flex;
    align-items: center;
  }

  .batch-hint {
    font-size: 13px;
    color: #e6a23c;
  }
}
</style>
