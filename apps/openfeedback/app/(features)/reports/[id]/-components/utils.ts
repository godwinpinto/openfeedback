import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import type { QuestionAnalysis } from './types'

// Type guard for questionnaire data
export function isQuestionnaireData(data: unknown): data is { 
  questions: QuestionWithId[]
  formTitle?: string
  formDescription?: string
} {
  return (
    typeof data === 'object' &&
    data !== null &&
    'questions' in data &&
    Array.isArray((data as any).questions)
  )
}

// Extract form metadata from questionnaire data
export function getFormMetadata(data: unknown): { formTitle?: string; formDescription?: string } {
  if (isQuestionnaireData(data)) {
    return {
      formTitle: data.formTitle,
      formDescription: data.formDescription,
    }
  }
  return {}
}

// Type guard for response answers
function isResponseAnswers(data: unknown): data is Record<string, string | string[] | number | undefined> {
  if (typeof data !== 'object' || data === null) return false
  if ('answers' in data) {
    const answers = (data as any).answers
    return typeof answers === 'object' && answers !== null
  }
  return false
}

// Get answers from response data
export function getAnswers(response: unknown): Record<string, string | string[] | number | undefined> {
  if (typeof response === 'object' && response !== null) {
    // Check if response has 'answers' property (from serializeResponse)
    if ('answers' in response) {
      const answers = (response as any).answers
      if (typeof answers === 'object' && answers !== null) {
        return answers
      }
    }
    // If the response itself is the answers object
    if (isResponseAnswers(response)) {
      return response
    }
  }
  return {}
}

// Analyze responses for a question
export function analyzeQuestionResponses(
  question: QuestionWithId,
  allAnswers: Record<string, string | string[] | number | undefined>[]
): QuestionAnalysis | null {
  const questionAnswers = allAnswers
    .map((answers) => answers[question.id])
    .filter((answer) => answer !== undefined && answer !== null && answer !== '')

  if (question.type === 'multiple_choice') {
    // Count occurrences of each option
    const counts: Record<string, number> = {}
    questionAnswers.forEach((answer) => {
      const key = String(answer)
      counts[key] = (counts[key] || 0) + 1
    })
    return {
      type: 'multiple_choice',
      data: Object.entries(counts).map(([name, value]) => ({ name, value })),
      totalResponses: questionAnswers.length,
    }
  }

  if (question.type === 'multiple_select') {
    // Count occurrences of each option (can have multiple selections per response)
    const counts: Record<string, number> = {}
    questionAnswers.forEach((answer) => {
      const options = Array.isArray(answer) ? answer : [answer]
      options.forEach((option) => {
        const key = String(option)
        counts[key] = (counts[key] || 0) + 1
      })
    })
    return {
      type: 'multiple_select',
      data: Object.entries(counts).map(([name, value]) => ({ name, value })),
      totalResponses: questionAnswers.length,
    }
  }

  if (question.type === 'rating') {
    // Count occurrences of each rating value
    const counts: Record<number, number> = {}
    const maxRating = (question as any).maxRating || 5
    questionAnswers.forEach((answer) => {
      const rating = typeof answer === 'number' ? answer : Number(answer)
      if (!isNaN(rating) && rating >= 1 && rating <= maxRating) {
        counts[rating] = (counts[rating] || 0) + 1
      }
    })
    // Fill in missing ratings with 0
    const data = Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => ({
      name: `${rating} star${rating !== 1 ? 's' : ''}`,
      value: counts[rating] || 0,
    }))
    return {
      type: 'rating',
      data,
      totalResponses: questionAnswers.length,
      average: questionAnswers.length > 0
        ? questionAnswers.reduce((sum, a) => sum + (typeof a === 'number' ? a : Number(a) || 0), 0) / questionAnswers.length
        : 0,
    }
  }

  if (question.type === 'short_text' || question.type === 'long_text') {
    // For text fields, show list of responses
    return {
      type: 'text',
      data: questionAnswers.map((answer, index) => ({
        id: index,
        value: String(answer),
      })),
      totalResponses: questionAnswers.length,
    }
  }

  return null
}

