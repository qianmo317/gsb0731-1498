/**
 * Pinia Store 入口
 */

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia

// 导出所有 store
export { useStudentStore } from './student'
export { useHomeworkStore } from './homework'
export { useCommunicationStore } from './communication'
export { useStatisticsStore } from './statistics'
