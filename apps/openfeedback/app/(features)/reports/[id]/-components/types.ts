import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'

export interface SubmissionData {
  responseData: unknown
  createdAt: string
  createdIp?: string | null
}

export interface ReportViewProps {
  questionnaireFormData: unknown
  feedbackResponseData: SubmissionData[]
  reportId: string
  formId: string
  createdAt: string
  createdIp?: string | null
  submissionCount: number
}

export interface QuestionAnalysis {
  type: 'multiple_choice' | 'multiple_select' | 'rating' | 'text'
  data: Array<{ name?: string; value: number | string; id?: number }>
  totalResponses: number
  average?: number
}

export type QuestionWithAnalysis = {
  question: QuestionWithId
  analysis: QuestionAnalysis | null
}

