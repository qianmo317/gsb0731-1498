<template>
  <div class="error-page">
    <div class="error-content">
      <h1>404</h1>
      <p>页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f7fa;
}

.error-content {
  text-align: center;

  h1 {
    font-size: 120px;
    color: #4a90e2;
    margin: 0;
  }

  p {
    font-size: 24px;
    color: #606266;
    margin: 20px 0 40px;
  }
}
</style>
