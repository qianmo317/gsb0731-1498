<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    class="student-form"
  >
    <el-form-item label="学生姓名" prop="name">
      <el-input
        v-model="formData.name"
        placeholder="请输入学生姓名"
        clearable
      />
    </el-form-item>

    <el-form-item label="性别" prop="gender">
      <el-radio-group v-model="formData.gender">
        <el-radio value="male">男</el-radio>
        <el-radio value="female">女</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="年龄" prop="age">
      <el-input-number
        v-model="formData.age"
        :min="6"
        :max="18"
        placeholder="请输入年龄"
      />
    </el-form-item>

    <el-form-item label="年级" prop="grade">
      <el-select
        v-model="formData.grade"
        placeholder="请选择年级"
        style="width: 100%"
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

    <el-form-item label="手机号" prop="phone">
      <el-input
        v-model="formData.phone"
        placeholder="请输入手机号"
        maxlength="11"
        clearable
      />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input
        v-model="formData.email"
        placeholder="请输入邮箱（选填）"
        clearable
      />
    </el-form-item>

    <el-form-item label="家长姓名" prop="parentName">
      <el-input
        v-model="formData.parentName"
        placeholder="请输入家长姓名"
        clearable
      />
    </el-form-item>

    <el-form-item label="家长电话" prop="parentPhone">
      <el-input
        v-model="formData.parentPhone"
        placeholder="请输入家长电话"
        maxlength="11"
        clearable
      />
    </el-form-item>

    <el-form-item label="分组" prop="group">
      <el-select
        v-model="formData.group"
        placeholder="请选择分组"
        style="width: 100%"
      >
        <el-option label="A组" value="A组" />
        <el-option label="B组" value="B组" />
        <el-option label="C组" value="C组" />
        <el-option label="D组" value="D组" />
      </el-select>
    </el-form-item>

    <el-form-item label="状态" prop="status">
      <el-select
        v-model="formData.status"
        placeholder="请选择状态"
        style="width: 100%"
      >
        <el-option label="在读" value="active" />
        <el-option label="休学" value="inactive" />
        <el-option label="毕业" value="graduated" />
      </el-select>
    </el-form-item>

    <el-form-item label="等级" prop="level">
      <el-select
        v-model="formData.level"
        placeholder="请选择等级"
        style="width: 100%"
      >
        <el-option label="优秀" value="excellent" />
        <el-option label="良好" value="good" />
        <el-option label="一般" value="average" />
        <el-option label="较差" value="poor" />
      </el-select>
    </el-form-item>

    <el-form-item label="标签" prop="tags">
      <el-select
        v-model="formData.tags"
        placeholder="请选择标签"
        multiple
        style="width: 100%"
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

    <el-form-item label="入学日期" prop="enrollDate">
      <el-date-picker
        v-model="formData.enrollDate"
        type="date"
        placeholder="请选择入学日期"
        style="width: 100%"
        value-format="YYYY-MM-DD"
      />
    </el-form-item>

    <el-form-item label="备注" prop="notes">
      <el-input
        v-model="formData.notes"
        type="textarea"
        :rows="3"
        placeholder="请输入备注信息（选填）"
        maxlength="200"
        show-word-limit
      />
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
import type { StudentFormData } from '@/types/student'

// Props
interface Props {
  modelValue?: Partial<StudentFormData>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  loading: false
})

// Emits
interface Emits {
  (e: 'submit', value: StudentFormData): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<StudentFormData>({
  name: '',
  gender: 'male',
  age: 10,
  grade: '',
  phone: '',
  email: '',
  parentName: '',
  parentPhone: '',
  status: 'active',
  level: 'average',
  tags: [],
  group: '',
  enrollDate: new Date().toISOString().split('T')[0],
  notes: '',
  ...props.modelValue
})

// 手机号验证
const validatePhone = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

// 邮箱验证
const validateEmail = (_rule: any, value: string, callback: any) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入正确的邮箱'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入学生姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 6, max: 18, message: '年龄必须在 6 到 18 之间', trigger: 'blur' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  phone: [
    { required: true, validator: validatePhone, trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  parentName: [
    { required: true, message: '请输入家长姓名', trigger: 'blur' }
  ],
  parentPhone: [
    { required: true, validator: validatePhone, trigger: 'blur' }
  ],
  group: [
    { required: true, message: '请选择分组', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择等级', trigger: 'change' }
  ],
  enrollDate: [
    { required: true, message: '请选择入学日期', trigger: 'change' }
  ],
  tags: [
    { type: 'array', message: '请选择标签', trigger: 'change' }
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
    emit('submit', { ...formData })
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
.student-form {
  padding: 20px;

  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  :deep(.el-input-number) {
    width: 100%;
  }
}
</style>
