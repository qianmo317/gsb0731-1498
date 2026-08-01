<template>
  <div class="app-header">
    <div class="header-left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <el-badge :value="pendingCount" :max="99" class="header-badge">
        <el-button :icon="Bell" circle />
      </el-badge>

      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userAvatar" />
          <span class="user-name">{{ userName }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="settings">设置</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useHomeworkStore } from '@/stores'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const homeworkStore = useHomeworkStore()
const userStore = useUserStore()

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.meta?.title)
  return matched.map(r => ({
    path: r.path,
    title: r.meta?.title as string
  }))
})

const pendingCount = computed(() => homeworkStore.pendingGradeCount)

const userName = computed(() => userStore.user?.name || '未登录')
const userAvatar = computed(() => userStore.user?.avatar || 'https://i.pravatar.cc/150?img=1')

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中')
      break
    case 'settings':
      ElMessage.info('设置功能开发中')
      break
    case 'logout':
      await handleLogout()
      break
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消操作
  }
}
</script>

<style scoped lang="scss">
.app-header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .user-name {
    font-size: 14px;
    color: #303133;
  }
}
</style>
