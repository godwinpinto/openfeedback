'use server'

import { db } from '@/lib/openfeedback/db'
import { feedbackForm } from '@/lib/openfeedback/schema'
import { randomUUID } from 'crypto'

export interface LaunchFormResult {
  success: true
  formId: string
  reportId: string
}

export interface LaunchFormError {
  success: false
  error: string
}

export type LaunchFormResponse = LaunchFormResult | LaunchFormError

export async function launchFeedbackForm(
  questionnaireFormData: string
): Promise<LaunchFormResponse> {
  try {
    // Validate JSON
    JSON.parse(questionnaireFormData)

    const formId = randomUUID()
    const reportId = randomUUID()

    await db.insert(feedbackForm).values({
      formId,
      reportId,
      questionnaireFormData,
      createdAt: new Date(),
    })

    return {
      success: true,
      formId,
      reportId,
    }
  } catch (error) {
    console.error('Error launching feedback form:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

