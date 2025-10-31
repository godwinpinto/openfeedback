'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import type { QuestionAnalysis } from './types'
import { QuestionCard } from './question-card'

interface QuestionsGridProps {
  questions: QuestionWithId[]
  allAnswers: Record<string, string | string[] | number | undefined>[]
  analyzeQuestionResponses: (
    question: QuestionWithId,
    allAnswers: Record<string, string | string[] | number | undefined>[]
  ) => QuestionAnalysis | null
}

export function QuestionsGrid({
  questions,
  allAnswers,
  analyzeQuestionResponses,
}: QuestionsGridProps) {
  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Questions Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This form does not contain any questions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {questions.map((question) => {
        const analysis = analyzeQuestionResponses(question, allAnswers)
        return (
          <QuestionCard key={question.id} question={question} analysis={analysis} />
        )
      })}
    </div>
  )
}

