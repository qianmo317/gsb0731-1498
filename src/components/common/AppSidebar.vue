<template>
  <div class="app-sidebar">
    <div class="sidebar-logo">
      <el-icon :size="32" color="#4a90e2">
        <Reading />
      </el-icon>
      <span class="logo-text">伴学老师</span>
    </div>

    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :unique-opened="true"
      router
      class="sidebar-menu"
    >
      <el-menu-item
        v-for="route in menuRoutes"
        :key="route.path"
        :index="route.path"
      >
        <el-icon v-if="resolveIcon(route.meta?.icon)">
          <component :is="resolveIcon(route.meta?.icon)" />
        </el-icon>
        <template #title>{{ route.meta?.title }}</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChatDotRound, DataAnalysis, Document, List, Reading, User } from '@element-plus/icons-vue'

const iconMap: Record<string, Component> = {
  ChatDotRound,
  DataAnalysis,
  Document,
  List,
  User
}

const resolveIcon = (icon: unknown): Component | undefined => {
  if (typeof icon !== 'string') return
  return iconMap[icon]
}

const route = useRoute()
const router = useRouter()

const isCollapse = ref(false)

const activeMenu = computed(() => {
  const { path } = route
  return path
})

const menuRoutes = computed(() => {
  // 找到主布局路由（path 为 '/'）
  const mainRoute = router.options.routes.find(r => r.path === '/')
  return mainRoute?.children?.filter(r => !r.meta?.hidden) || []
})
</script>

<style scoped lang="scss">
.app-sidebar {
  width: 220px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-bottom: 1px solid #e4e7ed;

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}
</style>
