<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isBatch ? '批量发起跟进沟通' : '发起跟进沟通'"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-if="students.length > 0" class="follow-up-dialog">
      <div class="student-info-section">
        <div class="section-label">跟进学生：</div>
        <div class="student-list">
          <el-tag
            v-for="student in students"
            :key="student.id"
            class="student-tag"
            type="info"
          >
            {{ student.name }}
          </el-tag>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="沟通类型" prop="type">
          <el-select v-model="formData.type" style="width: 100%">
            <el-option label="提问" value="question" />
            <el-option label="反馈" value="feedback" />
            <el-option label="家长沟通" value="parent" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="沟通方式" prop="method">
          <el-select v-model="formData.method" style="width: 100%">
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
            :rows="5"
            placeholder="请描述跟进内容、学生存在的问题及改进建议"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="标记重要">
          <el-checkbox v-model="formData.isImportant">
            标记为重要沟通
          </el-checkbox>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        提交跟进
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { Student } from '@/types/student'
import type { CommunicationFormData } from '@/types/communication'

interface Props {
  modelValue: boolean
  students: Student[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: CommunicationFormData[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const isBatch = computed(() => props.students.length > 1)

const formData = reactive({
  type: 'feedback' as CommunicationFormData['type'],
  method: 'online' as CommunicationFormData['method'],
  title: '',
  content: '',
  isImportant: false
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择沟通类型', trigger: 'change' }],
  method: [{ required: true, message: '请选择沟通方式', trigger: 'change' }],
  title: [
    { required: true, message: '请输入沟通标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入沟通内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  if (props.students.length === 0) {
    ElMessage.warning('请选择要跟进的学生')
    return
  }

  try {
    await formRef.value.validate()
    submitting.value = true

    const records: CommunicationFormData[] = props.students.map(student => ({
      studentId: student.id,
      type: formData.type,
      method: formData.method,
      title: formData.title,
      content: formData.content,
      isImportant: formData.isImportant
    }))

    emit('submit', records)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  formRef.value?.resetFields()
  formData.type = 'feedback'
  formData.method = 'online'
  formData.title = ''
  formData.content = ''
  formData.isImportant = false
}
</script>

<style scoped lang="scss">
.follow-up-dialog {
  .student-info-section {
    margin-bottom: 20px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 4px;

    .section-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
    }

    .student-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .student-tag {
      margin: 0;
    }
  }
}
</style>
