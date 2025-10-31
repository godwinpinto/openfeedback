'use client'

import { useMemo } from 'react'
import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import { isSeparatorQuestion } from '@/lib/openfeedback/feedback-form'
import type { ReportViewProps } from './types'
import { ReportInfo } from './report-info'
import { QuestionsGrid } from './questions-grid'
import { isQuestionnaireData, getAnswers, analyzeQuestionResponses, getFormMetadata } from './utils'

export function ReportView({
  questionnaireFormData,
  feedbackResponseData,
  reportId,
  formId,
  createdAt,
  createdIp,
  submissionCount,
}: ReportViewProps) {
  const questions = useMemo(() => {
    if (isQuestionnaireData(questionnaireFormData)) {
      return questionnaireFormData.questions.filter(
        (q) => !isSeparatorQuestion(q)
      )
    }
    return []
  }, [questionnaireFormData])

  const formMetadata = useMemo(() => {
    return getFormMetadata(questionnaireFormData)
  }, [questionnaireFormData])

  const allAnswers = useMemo(() => {
    return feedbackResponseData.map((submission) => getAnswers(submission.responseData))
  }, [feedbackResponseData])

  return (
    <div className="relative min-h-screen pt-16 pb-24">
      <div className="container mx-auto px-4 max-w-7xl">
        <ReportInfo
          formTitle={formMetadata.formTitle}
          formDescription={formMetadata.formDescription}
          formId={formId}
          createdAt={createdAt}
          createdIp={createdIp}
          submissionCount={submissionCount}
        />

        <QuestionsGrid
          questions={questions}
          allAnswers={allAnswers}
          analyzeQuestionResponses={analyzeQuestionResponses}
        />
      </div>
    </div>
  )
}

