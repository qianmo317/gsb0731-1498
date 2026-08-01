<template>
  <div class="grade-form">
    <el-card class="submission-card">
      <template #header>
        <div class="card-header">
          <div class="student-info">
            <el-avatar :size="40" :src="submission.studentAvatar" />
            <div class="info-text">
              <h3>{{ submission.studentName }}</h3>
              <span class="submit-time">
                提交时间：{{ formatDateTime(submission.submitTime || '') }}
              </span>
            </div>
          </div>
          <el-tag :type="getStatusType(submission.status)">
            {{ formatStatus(submission.status) }}
          </el-tag>
        </div>
      </template>

      <div class="submission-content">
        <div class="content-section">
          <h4>作业内容</h4>
          <div class="content-text">{{ submission.content }}</div>
        </div>

        <div v-if="submission.attachments && submission.attachments.length > 0" class="content-section">
          <h4>附件</h4>
          <div class="attachments">
            <el-tag
              v-for="(file, index) in submission.attachments"
              :key="index"
              type="info"
              class="attachment-tag"
            >
              <el-icon><Document /></el-icon>
              {{ file }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="grade-card">
      <template #header>
        <div class="card-header">
          <span>批改作业</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="评分" prop="score">
          <el-input-number
            v-model="formData.score"
            :min="0"
            :max="100"
            :step="1"
            placeholder="请输入分数"
            style="width: 200px"
          />
          <span class="score-hint">（满分100分）</span>
        </el-form-item>

        <el-form-item label="评语" prop="feedback">
          <el-input
            v-model="formData.feedback"
            type="textarea"
            :rows="5"
            placeholder="请输入评语，给学生一些建议和鼓励"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="标记优秀" prop="isExcellent">
          <el-checkbox v-model="formData.isExcellent">
            将此作业标记为优秀作业
          </el-checkbox>
          <div class="hint-text">
            优秀作业将在作业详情页展示，供其他学生参考学习
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="loading"
          >
            提交批改
          </el-button>
          <el-button @click="handleCancel">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Document } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { formatDateTime } from '@/utils/date'
import { formatStatus } from '@/utils/format'
import type { HomeworkSubmission, GradeFormData } from '@/types/homework'

// Props
interface Props {
  submission: HomeworkSubmission
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
interface Emits {
  (e: 'submit', value: GradeFormData): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<GradeFormData>({
  score: props.submission.score || 0,
  feedback: props.submission.feedback || '',
  isExcellent: props.submission.isExcellent || false
})

// 表单验证规则
const rules: FormRules = {
  score: [
    { required: true, message: '请输入分数', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '分数必须在 0 到 100 之间', trigger: 'blur' }
  ],
  feedback: [
    { required: true, message: '请输入评语', trigger: 'blur' },
    { min: 10, max: 500, message: '评语长度在 10 到 500 个字符', trigger: 'blur' }
  ]
}

// 监听 submission 变化
watch(
  () => props.submission,
  (newValue) => {
    if (newValue) {
      formData.score = newValue.score || 0
      formData.feedback = newValue.feedback || ''
      formData.isExcellent = newValue.isExcellent || false
    }
  },
  { deep: true }
)

// 获取状态类型
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    not_submitted: 'info',
    submitted: 'warning',
    graded: 'success'
  }
  return map[status] || 'info'
}

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
.grade-form {
  .submission-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .student-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .info-text {
          h3 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }

          .submit-time {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }

    .submission-content {
      .content-section {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #606266;
        }

        .content-text {
          padding: 12px;
          background: #f5f7fa;
          border-radius: 4px;
          line-height: 1.6;
          color: #303133;
          white-space: pre-wrap;
        }

        .attachments {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .attachment-tag {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            cursor: pointer;

            &:hover {
              opacity: 0.8;
            }
          }
        }
      }
    }
  }

  .grade-card {
    .card-header {
      font-weight: 600;
      font-size: 16px;
    }

    .score-hint {
      margin-left: 12px;
      font-size: 14px;
      color: #909399;
    }

    .hint-text {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      line-height: 1.5;
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
    }

    :deep(.el-input-number) {
      .el-input__inner {
        text-align: left;
      }
    }
  }
}
</style>
