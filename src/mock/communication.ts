/**
 * 沟通记录 Mock 数据
 */

import type { CommunicationRecord } from '@/types/communication'
import {
  generateId,
  randomPick,
  randomInt,
  randomDate,
  randomBoolean,
  randomPickMultiple
} from './utils'
import { mockStudents } from './student'

// 沟通标题模板
const COMMUNICATION_TITLES = {
  question: [
    '关于{subject}的问题咨询',
    '{subject}作业疑问解答',
    '不理解{subject}知识点',
    '请教{subject}题目解法',
    '{subject}概念理解困难',
    '课堂内容疑问反馈'
  ],
  feedback: [
    '本周学习情况反馈',
    '作业完成情况总结',
    '课堂表现评价',
    '学习进度跟踪',
    '月度学习总结',
    '阶段性学习反馈'
  ],
  parent: [
    '家长沟通记录',
    '与家长讨论学习计划',
    '家长会沟通内容',
    '家长咨询学习情况',
    '家校合作交流',
    '学生情况家长反馈'
  ],
  other: [
    '学习方法指导',
    '日常关怀沟通',
    '学习建议交流',
    '课程安排调整',
    '学习资源推荐',
    '心理辅导沟通'
  ]
}

// 详细沟通内容模板
const COMMUNICATION_CONTENTS = {
  question: [
    '学生在学习过程中对某个知识点产生了疑问，经过详细讲解后，学生表示理解了基本概念，但在实际应用中还需要多加练习。建议学生课后多做相关练习题，巩固所学知识。',
    '学生反映作业中有几道题目不太理解，特别是关于解题思路方面。我详细讲解了解题步骤和方法，并给出了类似的例题供学生参考。学生表示会认真复习，争取下次能够独立完成。',
    '课堂上讲解的内容学生有些困惑，课后主动找我询问。我重新梳理了知识点的逻辑关系，并用更简单的例子帮助学生理解。学生反馈说这次讲解更清楚了，对知识点有了新的认识。',
    '学生对某个概念的理解存在偏差，通过交流发现是基础知识不够扎实导致的。我建议学生先复习相关的基础内容，然后再来理解这个概念。学生表示会按照建议进行学习。',
    '学生在做题时遇到了困难，不知道从何入手。我引导学生分析题目，找出关键信息，然后一步步推导出答案。通过这次交流，学生掌握了分析问题的方法。'
  ],
  feedback: [
    '本周学生学习态度认真，课堂表现积极，作业完成质量较高。特别是在小组讨论环节表现突出，能够主动分享自己的想法。建议继续保持这种学习状态，同时注意劳逸结合。',
    '最近学生的学习状态有所下降，作业完成情况不如之前。经过沟通了解到是因为其他课程压力较大。我建议学生合理安排时间，制定学习计划，并表示会适当调整作业难度。',
    '学生在课堂上表现活跃，积极回答问题，但作业完成质量需要提高。部分题目存在粗心大意的问题。我提醒学生要养成检查的习惯，做完作业后要认真核对。',
    '本月学生进步明显，从开始的基础薄弱到现在能够独立完成大部分作业，这与学生的努力和家长的配合密不可分。建议继续保持，可以适当增加一些拓展性的学习内容。',
    '学生学习自觉性强，能够按时完成作业，但在学习方法上还有改进空间。我给学生介绍了一些高效的学习方法，并建议学生尝试使用，看看哪种方法更适合自己。'
  ],
  parent: [
    '与家长进行了深入沟通，讨论了学生最近的学习情况。家长表示会加强家庭辅导，督促孩子认真完成作业。我也向家长介绍了一些辅导方法，希望家校合作，共同帮助学生进步。',
    '家长反馈孩子在家学习时间较少，经常被其他事情分散注意力。我建议家长帮助孩子制定学习计划，营造良好的学习环境。同时，我也会在课堂上多关注这个学生，及时给予指导。',
    '在家长会上与家长交流了学生的学习目标和改进方向。家长非常配合，表示会全力支持孩子的学习。我们一起制定了下一阶段的学习计划，明确了各自的责任和任务。',
    '家长咨询了关于学生学习方法的问题，担心孩子的学习效率不高。我详细介绍了学生在课堂上的表现，并给出了一些建议。家长表示会按照建议帮助孩子改进学习方法。',
    '与家长沟通了学生的优势和不足，家长对学生的表现比较满意，但也希望孩子能够更加努力。我鼓励家长多给孩子正面的反馈，增强孩子的自信心，同时也要适当指出需要改进的地方。'
  ],
  other: [
    '与学生进行了学习方法的交流，分享了一些高效学习的技巧。学生表示会尝试使用这些方法，看看是否能够提高学习效率。我也鼓励学生要坚持，不要轻易放弃。',
    '日常关怀沟通中了解到学生最近心情不太好，影响了学习状态。我耐心倾听了学生的烦恼，并给予了一些建议和鼓励。学生表示感觉好多了，会调整心态，重新投入学习。',
    '根据学生的学习情况，我给出了一些针对性的学习建议，包括如何安排学习时间、如何做笔记、如何复习等。学生认真记录了这些建议，表示会认真执行。',
    '与学生讨论了课程安排的调整，考虑到学生的实际情况，我们决定适当调整学习进度，确保学生能够充分理解每个知识点。学生对这个调整表示认可。',
    '向学生推荐了一些优质的学习资源，包括参考书、学习网站、教学视频等。学生表示会利用这些资源进行自主学习，拓展知识面。'
  ]
}

// 沟通结果记录模板
const COMMUNICATION_RESULTS = [
  '问题已得到解决，学生表示理解清楚了',
  '制定了后续学习计划，将持续跟进',
  '家长表示会加强配合，共同帮助学生进步',
  '学生态度积极，承诺会改进学习方法',
  '达成共识，明确了下一步的行动方案',
  '沟通效果良好，学生和家长都很满意',
  '需要继续观察学生的学习情况，定期跟进'
]

// 后续跟进计划模板
const FOLLOW_UP_PLANS = [
  '一周后再次检查学生的学习情况，确认是否有改善',
  '下次课重点关注学生对相关知识点的掌握情况',
  '与家长保持联系，及时反馈学生的学习进展',
  '安排额外的辅导时间，帮助学生巩固薄弱环节',
  '定期与学生沟通，了解学习中遇到的困难',
  '制定详细的学习计划，分阶段检查完成情况'
]

// 科目
const SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理']

// 标签
const TAGS = ['重要', '紧急', '待跟进', '已解决', '需家长配合', '学习方法', '心理辅导', '进度调整']

// 生成沟通标题
const generateTitle = (type: CommunicationRecord['type']): string => {
  const templates = COMMUNICATION_TITLES[type]
  const template = randomPick(templates)
  return template.replace('{subject}', randomPick(SUBJECTS))
}

// 生成沟通内容
const generateContent = (type: CommunicationRecord['type']): string => {
  const contents = COMMUNICATION_CONTENTS[type]
  const mainContent = randomPick(contents)

  // 添加沟通结果
  const result = '\n\n沟通结果：\n' + randomPick(COMMUNICATION_RESULTS)

  // 如果未解决，添加后续跟进计划
  const needFollowUp = randomBoolean(0.4)
  const followUp = needFollowUp ? '\n\n后续跟进：\n' + randomPick(FOLLOW_UP_PLANS) : ''

  return mainContent + result + followUp
}

// 生成附件
const generateAttachments = (): string[] | undefined => {
  if (!randomBoolean(0.3)) return undefined

  const attachmentTypes = [
    '学习资料.pdf',
    '作业截图.jpg',
    '沟通记录.docx',
    '学习计划.xlsx',
    '测试成绩.pdf'
  ]

  return randomPickMultiple(attachmentTypes, randomInt(1, 2))
}

// 生成单条沟通记录
const generateCommunication = (): CommunicationRecord => {
  const student = randomPick(mockStudents)
  const type = randomPick(['question', 'feedback', 'parent', 'other'] as const)
  const isImportant = randomBoolean(0.2)
  const isResolved = randomBoolean(0.7)

  return {
    id: generateId(),
    studentId: student.id,
    studentName: student.name,
    studentAvatar: student.avatar,
    type,
    method: randomPick(['online', 'phone', 'offline', 'wechat'] as const),
    title: generateTitle(type),
    content: generateContent(type),
    attachments: generateAttachments(),
    tags: randomPickMultiple(TAGS, randomInt(0, 3)),
    isImportant,
    isResolved,
    createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    updatedAt: randomDate(new Date(2024, 0, 1), new Date()),
    createdBy: '张老师'
  }
}

// 生成沟通记录列表
export const generateCommunications = (count: number = 100): CommunicationRecord[] => {
  return Array.from({ length: count }, generateCommunication)
}

// 默认沟通记录数据
export const mockCommunications = generateCommunications(100)
