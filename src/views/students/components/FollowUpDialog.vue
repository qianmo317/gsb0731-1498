<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="跟进学生">
        <div class="follow-up-students">
          <el-tag
            v-for="student in students"
            :key="student.id"
            type="danger"
            effect="plain"
            class="student-tag"
          >
            {{ student.name }}（{{ RISK_LEVEL_LABELS[student.risk.level] }}）
          </el-tag>
        </div>
      </el-form-item>

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

      <el-form-item label="跟进标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入跟进标题" clearable />
      </el-form-item>

      <el-form-item label="跟进内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="6"
          placeholder="请描述需要跟进的风险情况与沟通事项"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-select v-model="formData.tags" placeholder="请选择标签（可多选）" multiple style="width: 100%">
          <el-option label="重要" value="重要" />
          <el-option label="紧急" value="紧急" />
          <el-option label="待跟进" value="待跟进" />
          <el-option label="需家长配合" value="需家长配合" />
        </el-select>
      </el-form-item>

      <el-form-item label="标记重要">
        <el-checkbox v-model="formData.isImportant">将此跟进标记为重要</el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        发起跟进
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useCommunicationStore } from '@/stores'
import { RISK_LEVEL_LABELS } from '@/utils/risk'
import type { CommunicationFormData } from '@/types/communication'
import type { StudentRisk } from '@/types/risk'

interface Props {
  modelValue: boolean
  students: StudentRisk[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  students: () => []
})

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const emit = defineEmits<Emits>()

const communicationStore = useCommunicationStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive<Omit<CommunicationFormData, 'studentId'>>({
  type: 'feedback',
  method: 'phone',
  title: '',
  content: '',
  tags: ['待跟进'],
  isImportant: true
})

const dialogTitle = computed(() =>
  props.students.length > 1 ? `批量发起跟进（${props.students.length} 人）` : '发起跟进沟通'
)

const rules: FormRules = {
  type: [{ required: true, message: '请选择沟通类型', trigger: 'change' }],
  method: [{ required: true, message: '请选择沟通方式', trigger: 'change' }],
  title: [
    { required: true, message: '请输入跟进标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入跟进内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' }
  ]
}

// 打开时按当前学生自动带入默认标题
watch(
  () => props.modelValue,
  visible => {
    if (visible && props.students.length) {
      const names = props.students.map(s => s.name).join('、')
      formData.title = props.students.length === 1 ? `${names} 学情风险跟进` : '学情风险批量跟进'
      formData.content = `针对 ${names} 的学情风险发起跟进。风险原因：${
        props.students[0].risk.reasons.join('；') || '综合风险偏高'
      }`
    }
  }
)

const handleVisibleChange = (value: boolean) => {
  emit('update:modelValue', value)
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    // 逐个学生创建跟进沟通记录，自动带入学生信息
    for (const student of props.students) {
      const payload: CommunicationFormData = {
        studentId: student.id,
        type: formData.type,
        method: formData.method,
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
        isImportant: formData.isImportant
      }
      await communicationStore.createCommunication(payload)
    }
    ElMessage.success(
      props.students.length > 1
        ? `已为 ${props.students.length} 名学生发起跟进`
        : '已发起跟进沟通'
    )
    emit('update:modelValue', false)
    emit('success')
  } catch (error) {
    console.error('发起跟进失败:', error)
    ElMessage.error('发起跟进失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.follow-up-students {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .student-tag {
    margin: 0;
  }
}
</style>
