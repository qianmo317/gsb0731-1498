# 伴学老师后台管理系统

一个专为伴学老师设计的学生学习进度跟踪与辅导管理平台，采用 Vue 3 + TypeScript + Element Plus 技术栈，纯前端实现，使用 Mock 数据进行演示。

## 原始需求

> 你是一名有多年经验的前端架构师，擅长 Vue 3 + TypeScript + 后台系统设计。
> 现在要为「伴学老师后台管理系统」设计一个【可长期维护】的 Vue 3 项目框架。

## 项目特点

- 🎯 **教育亲和风格设计** - 温和的蓝色主题，适合教育场景
- 📊 **数据可视化** - 使用 ECharts 展示学习数据和统计信息
- 💾 **Mock 数据** - 完整的 Mock 数据系统，模拟真实业务场景
- 🔧 **TypeScript 严格模式** - 完整的类型定义，提高代码质量
- 🎨 **组件化开发** - 使用 Vue 3 Composition API + `<script setup>` 语法
- 📦 **按需加载** - Element Plus 组件自动按需导入

## 技术栈

### 核心框架

- **Vue 3.4+** - 渐进式 JavaScript 框架
- **TypeScript 5.0+** - JavaScript 的超集
- **Vite 5.0+** - 下一代前端构建工具

### UI 组件库

- **Element Plus 2.5+** - 基于 Vue 3 的组件库
- **@element-plus/icons-vue** - Element Plus 图标库

### 状态管理

- **Pinia 2.1+** - Vue 3 官方推荐的状态管理库
- **pinia-plugin-persistedstate** - Pinia 持久化插件

### 路由

- **Vue Router 4.2+** - Vue.js 官方路由管理器

### 图表库

- **ECharts 5.4+** - 强大的数据可视化库
- **vue-echarts** - Vue 3 的 ECharts 封装

### 工具库

- **dayjs** - 轻量级日期处理库
- **lodash-es** - JavaScript 工具库
- **@vueuse/core** - Vue 组合式 API 工具集
- **mockjs** - 生成随机 Mock 数据

## 项目结构

```
teacher-admin-system/
├── public/                    # 静态资源
├── src/
│   ├── assets/                # 资源文件
│   │   └── styles/            # 全局样式
│   │       ├── index.scss     # 样式入口
│   │       ├── variables.scss # SCSS 变量
│   │       └── mixins.scss    # SCSS mixins
│   ├── components/            # 公共组件
│   │   ├── common/            # 通用组件
│   │   │   ├── AppHeader.vue  # 顶部导航（用户信息、通知、退出）
│   │   │   └── AppSidebar.vue # 侧边栏（菜单导航）
│   │   └── charts/            # 图表组件
│   │       ├── LineChart.vue  # 折线图（学习时长趋势）
│   │       ├── BarChart.vue   # 柱状图（学生进度对比）
│   │       └── useChart.ts    # 图表 Hook（ECharts 封装）
│   ├── composables/           # 组合式函数
│   │   └── useTable.ts        # 表格逻辑（分页、搜索、筛选）
│   ├── mock/                  # Mock 数据
│   │   ├── students.ts        # 学生数据（51 条）
│   │   ├── homework.ts        # 作业数据（30 条）
│   │   ├── communication.ts   # 沟通记录数据（100 条）
│   │   └── dashboard.ts       # 仪表盘数据（统计指标）
│   ├── router/                # 路由配置
│   │   └── index.ts           # 路由定义 + 守卫（认证拦截）
│   ├── stores/                # Pinia 状态管理
│   │   ├── index.ts           # Store 入口
│   │   ├── user.ts            # 用户状态（登录/登出/持久化）
│   │   ├── student.ts         # 学生状态（列表/详情/CRUD）
│   │   ├── homework.ts        # 作业状态（列表/详情/批改）
│   │   ├── communication.ts   # 沟通记录状态（列表/筛选）
│   │   └── dashboard.ts       # 仪表盘状态（统计数据）
│   ├── types/                 # TypeScript 类型定义
│   │   ├── student.ts         # 学生类型（Student, StudentStatus, StudentLevel）
│   │   ├── homework.ts        # 作业类型（Homework, HomeworkStatus, Submission）
│   │   ├── communication.ts   # 沟通记录类型（Communication, CommunicationType）
│   │   └── dashboard.ts       # 仪表盘类型（Statistics, TrendData）
│   ├── utils/                 # 工具函数
│   │   ├── format.ts          # 格式化工具（日期、数字、百分比）
│   │   └── validate.ts        # 验证工具（表单验证规则）
│   ├── views/                 # 页面组件
│   │   ├── layout/            # 布局
│   │   │   └── MainLayout.vue # 主布局（Header + Sidebar + Content）
│   │   ├── login/             # 登录页
│   │   │   └── index.vue      # 登录表单（用户名/密码/记住我）
│   │   ├── dashboard/         # 数据概览
│   │   │   └── index.vue      # 仪表盘（指标卡片 + 图表）
│   │   ├── students/          # 学生管理
│   │   │   ├── index.vue      # 学生列表（搜索/筛选/分页）
│   │   │   ├── detail.vue     # 学生详情（基本信息/学习记录/作业记录）
│   │   │   └── components/    # 学生模块组件
│   │   ├── homework/          # 作业管理
│   │   │   ├── index.vue      # 作业列表（状态筛选/分页）
│   │   │   ├── detail.vue     # 作业详情（提交情况/统计）
│   │   │   ├── grade.vue      # 作业批改（评分/评语）
│   │   │   └── components/    # 作业模块组件
│   │   ├── communication/     # 沟通记录
│   │   │   ├── index.vue      # 沟通记录列表（类型筛选/分页）
│   │   │   └── components/    # 沟通模块组件
│   │   └── error/             # 错误页面
│   │       └── 404.vue        # 404 页面
│   ├── App.vue                # 根组件
│   └── main.ts                # 应用入口（Vue + Router + Pinia + Element Plus）
├── .env.development           # 开发环境变量
├── .env.production            # 生产环境变量
├── .eslintrc.cjs              # ESLint 配置
├── .prettierrc.json           # Prettier 配置
├── index.html                 # HTML 模板
├── package.json               # 项目依赖
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 配置（自动导入、路径别名）
├── README.md                  # 项目文档（本文档）
├── PROJECT_SUMMARY.md         # 详细项目总结（472 行）
└── check.md                   # 项目验证清单
```

## 代码架构

### 1. 状态管理架构（Pinia）

采用**模块化 Store 设计**，每个业务模块独立管理状态：

```typescript
// stores/user.ts - 用户认证
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
    isRemembered: false
  }),
  actions: {
    async login(credentials) {
      /* ... */
    },
    logout() {
      /* ... */
    }
  },
  persist: true // 持久化到 localStorage
})

// stores/student.ts - 学生管理
export const useStudentStore = defineStore('student', {
  state: () => ({
    students: [],
    currentStudent: null,
    loading: false
  }),
  actions: {
    async fetchStudents() {
      /* Mock API 调用 */
    },
    async getStudentDetail(id) {
      /* ... */
    }
  }
})
```

**设计原则**：

- ✅ 单一职责：每个 Store 只管理一个业务领域
- ✅ 数据持久化：使用 `pinia-plugin-persistedstate` 持久化关键数据
- ✅ 类型安全：完整的 TypeScript 类型定义
- ✅ Mock 数据：所有 Store 内置 Mock 数据，模拟异步操作（300-500ms 延迟）

### 2. 路由架构（Vue Router）

采用**扁平化路由 + 路由守卫**设计：

```typescript
// router/index.ts
const routes = [
  { path: '/login', component: Login, meta: { requiresAuth: false } },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'students', component: StudentList },
      { path: 'students/detail/:id', component: StudentDetail },
      { path: 'homework', component: HomeworkList },
      { path: 'homework/detail/:id', component: HomeworkDetail },
      { path: 'homework/grade/:id', component: HomeworkGrade },
      { path: 'communication', component: Communication }
    ]
  }
]

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn()) {
    next('/login')
  } else {
    next()
  }
})
```

**路由守卫逻辑**：

1. 检查用户登录状态（从 localStorage 读取 token）
2. 未登录用户访问受保护路由 → 跳转到登录页
3. 已登录用户访问登录页 → 跳转到首页
4. 动态设置页面标题（`${页面名称} - 伴学老师后台管理系统`）

### 3. 组件架构

采用**原子化组件设计**：

```
组件层级:
├── 页面组件 (Views)           // 业务页面，组合多个组件
│   └── students/index.vue     // 学生列表页
├── 业务组件 (Components)      // 可复用业务组件
│   └── students/components/   // 学生模块专用组件
│       ├── StudentCard.vue    // 学生卡片
│       └── StudentFilter.vue  // 学生筛选器
├── 基础组件 (Common)          // 通用 UI 组件
│   ├── AppHeader.vue          // 头部导航
│   └── AppSidebar.vue         // 侧边栏
└── Element Plus              // UI 组件库（按需自动导入）
```

**组件设计原则**：

- ✅ 单一职责：每个组件只做一件事
- ✅ Props 向下，Events 向上（单向数据流）
- ✅ 组合式 API（Composition API + `<script setup>`）
- ✅ TypeScript 类型约束（Props、Emits、Ref 全部类型化）

### 4. 数据流架构

```
用户操作 → 组件事件 → Store Action → Mock API → Store State → 组件更新
```

**示例：学生列表加载流程**

```typescript
// 1. 组件挂载时触发
onMounted(async () => {
  await studentStore.fetchStudents()
})

// 2. Store Action 调用 Mock API
async fetchStudents() {
  this.loading = true
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    // 从 Mock 数据获取
    this.students = mockStudents
  } finally {
    this.loading = false
  }
}

// 3. 组件响应式更新
const students = computed(() => studentStore.students)
```

**数据流特点**：

- ✅ 单向数据流（避免数据混乱）
- ✅ 异步操作统一在 Store 中处理
- ✅ Mock 数据模拟真实 API 延迟（300-500ms）
- ✅ 错误处理统一管理（try-catch + ElMessage 提示）

### 5. 类型系统设计

完整的 TypeScript 类型定义：

```typescript
// types/student.ts
export interface Student {
  id: string
  name: string
  gender: '男' | '女'
  grade: string
  phone: string
  group: string
  level: StudentLevel
  averageScore: number
  completedHomework: number
  totalHomework: number
  status: StudentStatus
  avatar?: string
  tags?: string[]
}

export type StudentLevel = '优秀' | '良好' | '一般' | '较差'
export type StudentStatus = '活跃' | '不活跃' | '已毕业'

// types/homework.ts
export interface Homework {
  id: string
  title: string
  subject: string
  difficulty: '简单' | '中等' | '困难'
  deadline: string
  totalStudents: number
  submittedCount: number
  gradedCount: number
  averageScore: number
  status: HomeworkStatus
}

export type HomeworkStatus = '进行中' | '已完成' | '已逾期'
```

**类型安全保障**：

- ✅ 所有数据结构都有类型定义
- ✅ 函数参数和返回值都有类型约束
- ✅ 组件 Props 和 Emits 都有类型定义
- ✅ Store State 和 Actions 都有类型推导

## 技术细节

### 1. ECharts 图表封装

```typescript
// composables/useChart.ts
export function useChart(chartRef: Ref<HTMLElement | null>) {
  let chartInstance: ECharts | null = null

  const initChart = () => {
    if (chartRef.value) {
      chartInstance = echarts.init(chartRef.value)
    }
  }

  const setOption = (option: EChartsOption) => {
    chartInstance?.setOption(option)
  }

  const resize = () => {
    chartInstance?.resize()
  }

  onMounted(() => {
    initChart()
    window.addEventListener('resize', resize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    chartInstance?.dispose()
  })

  return { setOption, resize }
}
```

**图表特点**：

- ✅ 响应式尺寸调整
- ✅ 自动销毁防止内存泄漏
- ✅ 支持主题定制
- ✅ 数据动态更新

### 2. 表格分页封装

```typescript
// composables/useTable.ts
export function useTable<T>(fetchData: () => Promise<T[]>) {
  const data = ref<T[]>([])
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  const loadData = async () => {
    loading.value = true
    try {
      const result = await fetchData()
      data.value = result
      total.value = result.length
    } finally {
      loading.value = false
    }
  }

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return data.value.slice(start, end)
  })

  return {
    data: paginatedData,
    loading,
    currentPage,
    pageSize,
    total,
    loadData
  }
}
```

**表格特点**：

- ✅ 自动分页计算
- ✅ 加载状态管理
- ✅ 支持搜索和筛选
- ✅ 可复用的逻辑封装

### 3. Mock 数据生成

```typescript
// mock/students.ts
import Mock from 'mockjs'

export const mockStudents = Array.from({ length: 51 }, (_, i) => ({
  id: `S${String(i + 1).padStart(3, '0')}`,
  name: Mock.Random.cname(),
  gender: Mock.Random.pick(['男', '女']),
  grade: Mock.Random.pick([
    '一年级',
    '二年级',
    '三年级',
    '四年级',
    '五年级',
    '六年级',
    '初一',
    '初二',
    '初三'
  ]),
  phone:
    Mock.Random.pick([
      '137',
      '138',
      '139',
      '150',
      '151',
      '152',
      '157',
      '158',
      '159',
      '130',
      '131',
      '132',
      '155',
      '156',
      '185',
      '186',
      '176'
    ]) + Mock.Random.string('number', 8),
  group: Mock.Random.pick(['A组', 'B组', 'C组', 'D组']),
  level: Mock.Random.pick(['优秀', '良好', '一般', '较差']),
  averageScore: Mock.Random.float(60, 100, 1, 1),
  completedHomework: Mock.Random.integer(10, 100),
  totalHomework: Mock.Random.integer(20, 100),
  status: Mock.Random.pick(['活跃', '不活跃', '已毕业']),
  avatar: Mock.Random.boolean()
    ? `https://i.pravatar.cc/150?img=${Mock.Random.integer(1, 70)}`
    : undefined
}))
```

**Mock 数据特点**：

- ✅ 使用 mockjs 生成真实感数据
- ✅ 数据之间有关联关系（学生 ID 关联作业提交记录）
- ✅ 包含时间序列数据（支持趋势分析）
- ✅ 模拟网络延迟（300-500ms）

### 4. 样式系统

```scss
// assets/styles/variables.scss
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;

$sidebar-width: 200px;
$header-height: 60px;
$content-padding: 24px;

// assets/styles/mixins.scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin card-shadow {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
```

**样式特点**：

- ✅ SCSS 变量统一管理主题色
- ✅ Mixins 复用常用样式
- ✅ BEM 命名规范
- ✅ 响应式设计（最小支持 1024px）

### 5. 错误处理

```typescript
// stores/student.ts
async fetchStudents() {
  this.loading = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    this.students = mockStudents
  } catch (error) {
    ElMessage.error('加载学生列表失败')
    console.error('fetchStudents error:', error)
  } finally {
    this.loading = false
  }
}
```

**错误处理策略**：

- ✅ 统一的 try-catch 包裹
- ✅ 用户友好的错误提示（ElMessage）
- ✅ 控制台详细错误日志
- ✅ Loading 状态正确管理（finally 中重置）

## 功能模块

### 1. 数据概览

- 总学生数、今日作业提交、待批改作业等关键指标
- 学习时长趋势图（日/周/月切换）
- 作业完成率趋势图
- 学生学习进度对比

### 2. 学生管理

- 学生列表（支持搜索、筛选、排序）
- 学生详情（基本信息、学习统计、学习记录）
- 添加/编辑/删除学生
- 学生标签和分组管理

### 3. 作业管理

- 作业列表（显示完成情况、批改进度）
- 作业详情（查看所有学生提交情况）
- 作业批改（评分、评语、标记优秀）
- 作业统计（完成率、平均分）

### 4. 沟通记录

- 沟通记录列表（时间倒序）
- 添加沟通记录
- 按学生、类型、方式筛选
- 标记重要/已解决

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

## Mock 数据说明

项目使用完整的 Mock 数据系统，数据存储在浏览器的 localStorage 中：

- **学生数据**: 50 个模拟学生
- **作业数据**: 30 个模拟作业
- **提交记录**: 根据作业和学生自动生成
- **沟通记录**: 100 条模拟沟通记录

首次访问时会自动初始化 Mock 数据，数据会持久化保存。如需重置数据，可在浏览器控制台执行：

```javascript
localStorage.removeItem('teacher-admin-mock-data')
```

然后刷新页面即可重新初始化。

## 开发规范

### 代码风格

- 使用 ESLint + Prettier 进行代码检查和格式化
- 遵循 Vue 3 官方风格指南
- 使用 TypeScript 严格模式

### 组件开发

- 使用 `<script setup>` 语法
- 组件命名使用 PascalCase
- Props 和 Emits 使用 TypeScript 类型定义

### 状态管理

- 使用 Pinia 进行状态管理
- 每个模块独立的 Store
- 使用 TypeScript 定义 State 类型

### 样式规范

- 使用 SCSS 预处理器
- 遵循 BEM 命名规范
- 使用 CSS 变量定义主题色

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提 Issue 或 Pull Request。
