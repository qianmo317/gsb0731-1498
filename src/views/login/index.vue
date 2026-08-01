<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="48" color="#4a90e2">
          <Reading />
        </el-icon>
        <h1 class="login-title">伴学老师后台管理系统</h1>
        <p class="login-subtitle">学生学习进度跟踪与辅导管理平台</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <el-alert
          title="演示账号"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="demo-accounts">
              <p><strong>管理员：</strong>admin / admin123</p>
              <p><strong>老师：</strong>teacher / teacher123</p>
            </div>
          </template>
        </el-alert>
      </div>
    </div>

    <div class="login-footer">
      <p>© 2026 伴学老师后台管理系统. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Reading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: true
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true

    try {
      await userStore.login({
        username: loginForm.username,
        password: loginForm.password,
        remember: loginForm.remember
      })

      ElMessage.success('登录成功')

      const redirect = route.query.redirect
      router.push(typeof redirect === 'string' ? redirect : '/')
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  .el-icon {
    margin-bottom: 16px;
  }
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.login-form {
  margin-top: 32px;

  :deep(.el-form-item) {
    margin-bottom: 24px;
  }

  :deep(.el-input__wrapper) {
    padding: 12px 16px;
  }
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.login-tips {
  margin-top: 24px;

  .demo-accounts {
    p {
      margin: 4px 0;
      font-size: 13px;
      color: #606266;

      strong {
        color: #303133;
      }
    }
  }
}

.login-footer {
  margin-top: 32px;
  text-align: center;

  p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-box {
    padding: 32px 24px;
  }

  .login-title {
    font-size: 20px;
  }

  .login-subtitle {
    font-size: 13px;
  }
}
</style>
