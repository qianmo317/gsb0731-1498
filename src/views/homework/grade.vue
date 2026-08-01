<template>
  <div class="homework-grade">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">作业批改</span>
      </template>
    </el-page-header>

    <div class="grade-content" v-loading="loading">
      <!-- 使用 GradeForm 组件 -->
      <GradeForm
        v-if="submission"
        :submission="submission"
        :loading="submitting"
        @submit="handleSubmit"
        @cancel="goBack"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useHomeworkStore } from '@/stores'
import GradeForm from './components/GradeForm.vue'
import type { HomeworkSubmission, GradeFormData } from '@/types/homework'

const route = useRoute()
const router = useRouter()
const homeworkStore = useHomeworkStore()

const loading = ref(false)
const submitting = ref(false)
const submission = ref<HomeworkSubmission | null>(null)

const goBack = () => {
  router.back()
}

const handleSubmit = async (formData: GradeFormData) => {
  if (!submission.value) return

  try {
    submitting.value = true
    await homeworkStore.gradeHomework(submission.value.id, formData)
    ElMessage.success('批改成功')
    goBack()
  } catch (error) {
    ElMessage.error('批改失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const id = route.params.id as string
    await homeworkStore.fetchSubmissionDetail(id)
    submission.value = homeworkStore.currentSubmission
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.homework-grade {
  padding: 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.grade-content {
  margin-top: 20px;
}
</style>
