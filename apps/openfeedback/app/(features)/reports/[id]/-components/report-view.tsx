'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import { isSeparatorQuestion } from '@/lib/openfeedback/feedback-form'
import type { ReportViewProps } from './types'
import { ReportInfo } from './report-info'
import { QuestionsGrid } from './questions-grid'
import { FeedbackCountChart } from './feedback-count-chart'
import { IndividualSummaries } from './individual-summaries'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { isQuestionnaireData, getAnswers, analyzeQuestionResponses, getFormMetadata } from './utils'

// Dynamically import chatbot to avoid SSR hydration issues
const ReportChatbot = dynamic(() => import('./report-chatbot').then(mod => ({ default: mod.ReportChatbot })), {
  ssr: false,
})

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

        <Tabs defaultValue="overall" className="mt-6">
          <TabsList>
            <TabsTrigger value="overall">Overall Summary</TabsTrigger>
            <TabsTrigger value="individual">Individual Summaries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overall" className="mt-6">
            <div className="space-y-6">
              <FeedbackCountChart feedbackResponseData={feedbackResponseData} />
              <QuestionsGrid
                questions={questions}
                allAnswers={allAnswers}
                analyzeQuestionResponses={analyzeQuestionResponses}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="individual" className="mt-6">
            <IndividualSummaries
              feedbackResponseData={feedbackResponseData}
              questions={questions}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Chatbot */}
      <ReportChatbot
        questions={questions}
        feedbackResponseData={feedbackResponseData}
        reportId={reportId}
      />
    </div>
  )
}

