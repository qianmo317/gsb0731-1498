<template>
  <div class="communication-list">
    <el-timeline>
      <el-timeline-item
        v-for="record in records"
        :key="record.id"
        :timestamp="formatDateTime(record.createdAt)"
        placement="top"
        :color="getTimelineColor(record)"
      >
        <el-card class="communication-card" shadow="hover">
          <div class="card-header">
            <div class="left-section">
              <el-avatar :size="40" :src="record.studentAvatar" />
              <div class="info">
                <div class="title-row">
                  <h3 class="title">{{ record.title }}</h3>
                  <el-icon
                    v-if="record.isImportant"
                    color="#faad14"
                    :size="18"
                    class="important-icon"
                  >
                    <Star />
                  </el-icon>
                </div>
                <div class="meta">
                  <span class="student-name">{{ record.studentName }}</span>
                  <el-divider direction="vertical" />
                  <el-tag :type="getTypeColor(record.type)" size="small">
                    {{ formatStatus(record.type) }}
                  </el-tag>
                  <el-divider direction="vertical" />
                  <el-tag type="info" size="small">
                    {{ formatStatus(record.method) }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="right-section">
              <el-tag :type="record.isResolved ? 'success' : 'warning'" size="small">
                {{ record.isResolved ? '已解决' : '待处理' }}
              </el-tag>
            </div>
          </div>

          <div class="card-content">
            <div class="content-text">
              {{ truncate(record.content, 200) }}
            </div>

            <div v-if="record.tags && record.tags.length > 0" class="tags">
              <el-tag
                v-for="tag in record.tags"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>

            <div v-if="record.attachments && record.attachments.length > 0" class="attachments">
              <el-icon><Paperclip /></el-icon>
              <span>{{ record.attachments.length }} 个附件</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="creator">
              <el-icon><User /></el-icon>
              <span>{{ record.createdBy }}</span>
            </div>
            <div class="actions">
              <el-button
                type="primary"
                size="small"
                link
                @click="handleView(record)"
              >
                查看详情
              </el-button>
              <el-button
                v-if="!record.isResolved"
                type="success"
                size="small"
                link
                @click="handleResolve(record)"
              >
                标记已解决
              </el-button>
              <el-button
                type="danger"
                size="small"
                link
                @click="handleDelete(record)"
              >
                删除
              </el-button>
            </div>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-empty
      v-if="!records || records.length === 0"
      description="暂无沟通记录"
    />
  </div>
</template>

<script setup lang="ts">
import { Star, Paperclip, User } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/date'
import { formatStatus, truncate } from '@/utils/format'
import type { CommunicationRecord } from '@/types/communication'

// Props
interface Props {
  records: CommunicationRecord[]
}

defineProps<Props>()

// Emits
interface Emits {
  (e: 'view', record: CommunicationRecord): void
  (e: 'resolve', record: CommunicationRecord): void
  (e: 'delete', record: CommunicationRecord): void
}

const emit = defineEmits<Emits>()

// 获取时间线颜色
const getTimelineColor = (record: CommunicationRecord): string => {
  if (record.isImportant) return '#faad14'
  if (record.isResolved) return '#67c23a'
  return '#409eff'
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  const map: Record<string, any> = {
    question: 'primary',
    feedback: 'success',
    parent: 'warning',
    other: 'info'
  }
  return map[type] || 'info'
}

// 查看详情
const handleView = (record: CommunicationRecord) => {
  emit('view', record)
}

// 标记已解决
const handleResolve = (record: CommunicationRecord) => {
  emit('resolve', record)
}

// 删除
const handleDelete = (record: CommunicationRecord) => {
  emit('delete', record)
}
</script>

<style scoped lang="scss">
.communication-list {
  :deep(.el-timeline) {
    padding-left: 0;
  }

  :deep(.el-timeline-item__timestamp) {
    color: #909399;
    font-size: 13px;
  }

  .communication-card {
    margin-bottom: 0;

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;

      .left-section {
        display: flex;
        gap: 12px;
        flex: 1;

        .info {
          flex: 1;

          .title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;

            .title {
              margin: 0;
              font-size: 16px;
              font-weight: 600;
              color: #303133;
            }

            .important-icon {
              flex-shrink: 0;
            }
          }

          .meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;

            .student-name {
              color: #606266;
              font-weight: 500;
            }

            .el-divider {
              margin: 0;
            }
          }
        }
      }

      .right-section {
        flex-shrink: 0;
      }
    }

    .card-content {
      .content-text {
        margin-bottom: 12px;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 4px;
        line-height: 1.6;
        color: #303133;
        white-space: pre-wrap;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
      }

      .attachments {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #909399;
        font-size: 14px;
      }
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #ebeef5;

      .creator {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #909399;
        font-size: 14px;
      }

      .actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}
</style>
