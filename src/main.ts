import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import '@/assets/styles/index.scss'
import { initMockData, isMockEnabled } from './mock'
import '@/utils/echarts' // 导入 ECharts 配置以注册组件

// 初始化 Mock 数据
if (isMockEnabled()) {
  initMockData()
}

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

app.mount('#app')
