/**
 * 风险预警相关 API
 */

import type { Student } from '@/types/student'
import type { Homework, HomeworkSubmission } from '@/types/homework'
import type { CommunicationRecord } from '@/types/communication'
import { getMockData } from '@/mock'
import { delay } from '@/mock/utils'

export interface RiskAssessmentData {
  students: Student[]
  homeworks: Homework[]
  submissions: HomeworkSubmission[]
  communications: CommunicationRecord[]
}

export const getRiskAssessmentData = async (): Promise<RiskAssessmentData> => {
  await delay(200)

  const mockData = getMockData()

  return {
    students: mockData.students as Student[],
    homeworks: mockData.homeworks as Homework[],
    submissions: mockData.submissions as HomeworkSubmission[],
    communications: mockData.communications as CommunicationRecord[]
  }
}
