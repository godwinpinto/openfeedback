import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import type { SubmissionData } from './types'
import { getAnswers } from './utils'

/**
 * Escape CSV field values (handle commas, quotes, newlines)
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Format answer value for CSV
 */
function formatAnswerForCsv(
  answer: string | string[] | number | undefined,
  question: QuestionWithId
): string {
  if (answer === undefined || answer === null || answer === '') {
    return ''
  }

  if (question.type === 'multiple_select') {
    const values = Array.isArray(answer) ? answer : [answer]
    return values.join('; ')
  }

  if (question.type === 'rating') {
    return String(answer)
  }

  return String(answer)
}

/**
 * Convert feedback response data to CSV format
 */
export function convertFeedbackDataToCsv(
  questions: QuestionWithId[],
  feedbackResponseData: SubmissionData[]
): string {
  if (questions.length === 0 || feedbackResponseData.length === 0) {
    return ''
  }

  // Build CSV header row with question titles
  const headers = [
    'Submission ID',
    'Created At',
    'IP Address',
    ...questions.map((q) => {
      const questionTitle = (q as any).questionTitle || `Question ${q.id}`
      return questionTitle
    }),
  ]

  // Build CSV data rows
  const rows = feedbackResponseData.map((submission) => {
    const answers = getAnswers(submission.responseData)
    const row = [
      submission.submissionId,
      submission.createdAt || '',
      submission.createdIp || '',
      ...questions.map((question) => {
        const answer = answers[question.id]
        const formatted = formatAnswerForCsv(answer, question)
        return escapeCsvField(formatted)
      }),
    ]
    return row.join(',')
  })

  // Combine header and rows
  const csvLines = [headers.map(escapeCsvField).join(','), ...rows]
  return csvLines.join('\n')
}

