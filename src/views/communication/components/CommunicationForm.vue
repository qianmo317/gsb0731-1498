<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    class="communication-form"
  >
    <el-form-item label="学生" prop="studentId">
      <el-select
        v-model="formData.studentId"
        placeholder="请选择学生"
        filterable
        style="width: 100%"
      >
        <el-option
          v-for="student in students"
          :key="student.id"
          :label="student.name"
          :value="student.id"
        >
          <div class="student-option">
            <el-avatar :size="24" :src="student.avatar" />
            <span>{{ student.name }}</span>
            <span class="grade">{{ student.grade }}</span>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="沟通时间" prop="communicationTime">
      <el-date-picker
        v-model="formData.communicationTime"
        type="datetime"
        placeholder="请选择沟通时间"
        style="width: 100%"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
    </el-form-item>

    <el-form-item label="沟通类型" prop="type">
      <el-select
        v-model="formData.type"
        placeholder="请选择沟通类型"
        style="width: 100%"
      >
        <el-option label="提问" value="question" />
        <el-option label="反馈" value="feedback" />
        <el-option label="家长沟通" value="parent" />
        <el-option label="其他" value="other" />
      </el-select>
    </el-form-item>

    <el-form-item label="沟通方式" prop="method">
      <el-select
        v-model="formData.method"
        placeholder="请选择沟通方式"
        style="width: 100%"
      >
        <el-option label="在线" value="online" />
        <el-option label="电话" value="phone" />
        <el-option label="线下面谈" value="offline" />
        <el-option label="微信" value="wechat" />
      </el-select>
    </el-form-item>

    <el-form-item label="沟通标题" prop="title">
      <el-input
        v-model="formData.title"
        placeholder="请输入沟通标题"
        clearable
      />
    </el-form-item>

    <el-form-item label="沟通内容" prop="content">
      <el-input
        v-model="formData.content"
        type="textarea"
        :rows="6"
        placeholder="请详细描述沟通内容，包括学生的问题、反馈或讨论的事项"
        maxlength="1000"
        show-word-limit
      />
    </el-form-item>

    <el-form-item label="标签" prop="tags">
      <el-select
        v-model="formData.tags"
        placeholder="请选择标签（可多选）"
        multiple
        style="width: 100%"
      >
        <el-option label="重要" value="重要" />
        <el-option label="紧急" value="紧急" />
        <el-option label="待跟进" value="待跟进" />
        <el-option label="已解决" value="已解决" />
        <el-option label="需家长配合" value="需家长配合" />
      </el-select>
    </el-form-item>

    <el-form-item label="标记重要" prop="isImportant">
      <el-checkbox v-model="formData.isImportant">
        将此沟通记录标记为重要
      </el-checkbox>
      <div class="hint-text">
        重要的沟通记录会在列表中突出显示
      </div>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        提交
      </el-button>
      <el-button @click="handleCancel">
        取消
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CommunicationFormData } from '@/types/communication'
import type { Student } from '@/types/student'

// Props
interface Props {
  modelValue?: Partial<CommunicationFormData>
  students: Student[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  students: () => [],
  loading: false
})

// Emits
interface Emits {
  (e: 'submit', value: CommunicationFormData): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<CommunicationFormData & { communicationTime?: string }>({
  studentId: '',
  type: 'question',
  method: 'online',
  title: '',
  content: '',
  tags: [],
  isImportant: false,
  communicationTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  ...props.modelValue
})

// 表单验证规则
const rules: FormRules = {
  studentId: [
    { required: true, message: '请选择学生', trigger: 'change' }
  ],
  communicationTime: [
    { required: true, message: '请选择沟通时间', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择沟通类型', trigger: 'change' }
  ],
  method: [
    { required: true, message: '请选择沟通方式', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入沟通标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入沟通内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' }
  ]
}

// 监听 props 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      Object.assign(formData, newValue)
    }
  },
  { deep: true }
)

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    const { communicationTime, ...rest } = formData
    emit('submit', rest as CommunicationFormData)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 取消
const handleCancel = () => {
  formRef.value?.resetFields()
  emit('cancel')
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
}

// 暴露方法
defineExpose({
  resetForm
})
</script>

<style scoped lang="scss">
.communication-form {
  padding: 20px;

  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  .student-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .grade {
      margin-left: auto;
      font-size: 12px;
      color: #909399;
    }
  }

  .hint-text {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }
}
</style>
