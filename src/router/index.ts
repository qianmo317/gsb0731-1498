/**
 * 路由配置
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
      hidden: true,
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: () => import('@/views/layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '数据概览',
          icon: 'DataAnalysis'
        }
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('@/views/students/index.vue'),
        meta: {
          title: '学生管理',
          icon: 'User'
        }
      },
      {
        path: 'students/detail/:id',
        name: 'StudentDetail',
        component: () => import('@/views/students/detail.vue'),
        meta: {
          title: '学生详情',
          hidden: true
        }
      },
      {
        path: 'homework',
        name: 'Homework',
        component: () => import('@/views/homework/index.vue'),
        meta: {
          title: '作业管理',
          icon: 'Document'
        }
      },
      {
        path: 'homework/detail/:id',
        name: 'HomeworkDetail',
        component: () => import('@/views/homework/detail.vue'),
        meta: {
          title: '作业详情',
          hidden: true
        }
      },
      {
        path: 'homework/grade/:id',
        name: 'HomeworkGrade',
        component: () => import('@/views/homework/grade.vue'),
        meta: {
          title: '作业批改',
          hidden: true
        }
      },
      {
        path: 'communication',
        name: 'Communication',
        component: () => import('@/views/communication/index.vue'),
        meta: {
          title: '沟通记录',
          icon: 'ChatDotRound'
        }
      },
      {
        path: 'followup',
        name: 'FollowUp',
        component: () => import('@/views/followup/index.vue'),
        meta: {
          title: '学情跟进',
          icon: 'Bell'
        }
      },
      {
        path: 'risk-settings',
        name: 'RiskSettings',
        component: () => import('@/views/settings/index.vue'),
        meta: {
          title: '预警设置',
          icon: 'Setting'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      hidden: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = to.meta.title
    ? `${to.meta.title} - 伴学老师后台管理系统`
    : '伴学老师后台管理系统'

  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn()

  // 如果路由需要认证
  if (to.meta.requiresAuth !== false) {
    if (!isLoggedIn) {
      // 未登录，跳转到登录页
      ElMessage.warning('请先登录')
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 如果已登录，访问登录页，跳转到首页
  if (to.path === '/login' && isLoggedIn) {
    next({ path: '/' })
    return
  }

  next()
})

export default router
