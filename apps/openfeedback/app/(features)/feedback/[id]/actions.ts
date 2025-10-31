'use server'

import { db } from '@/lib/openfeedback/db'
import { feedbackForm, feedbackSubmission } from '@/lib/openfeedback/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import type { StoredFeedbackForm } from '@/lib/openfeedback/feedback-form'

export interface GetFeedbackFormResult {
  success: true
  form: {
    formId: string
    questionnaireFormData: StoredFeedbackForm
  }
}

export interface GetFeedbackFormError {
  success: false
  error: string
}

export type GetFeedbackFormResponse = GetFeedbackFormResult | GetFeedbackFormError

export async function getFeedbackForm(
  formId: string
): Promise<GetFeedbackFormResponse> {
  try {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(formId)) {
      return {
        success: false,
        error: 'Invalid form ID format',
      }
    }

    const form = await db
      .select()
      .from(feedbackForm)
      .where(eq(feedbackForm.formId, formId))
      .limit(1)
      .then((forms) => forms[0] ?? null)

    if (!form) {
      return {
        success: false,
        error: 'Feedback form not found',
      }
    }

    // Parse the questionnaire form data
    const questionnaireFormData = JSON.parse(form.questionnaireFormData) as StoredFeedbackForm

    return {
      success: true,
      form: {
        formId: form.formId,
        questionnaireFormData,
      },
    }
  } catch (error) {
    console.error('Error fetching feedback form:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export interface SubmitFeedbackResult {
  success: true
  submissionId: string
}

export interface SubmitFeedbackError {
  success: false
  error: string
}

export type SubmitFeedbackResponse = SubmitFeedbackResult | SubmitFeedbackError

export async function submitFeedback(
  formId: string,
  feedbackResponseData: string
): Promise<SubmitFeedbackResponse> {
  try {
    // Validate form ID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(formId)) {
      return {
        success: false,
        error: 'Invalid form ID format',
      }
    }

    // Validate JSON
    JSON.parse(feedbackResponseData)

    // Verify form exists
    const form = await db
      .select()
      .from(feedbackForm)
      .where(eq(feedbackForm.formId, formId))
      .limit(1)
      .then((forms) => forms[0] ?? null)

    if (!form) {
      return {
        success: false,
        error: 'Feedback form not found',
      }
    }

    const submissionId = randomUUID()

    await db.insert(feedbackSubmission).values({
      submissionId,
      formId,
      feedbackResponseData,
      createdAt: new Date(),
    })

    return {
      success: true,
      submissionId,
    }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

