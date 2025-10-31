'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import type { QuestionAnalysis } from './types'
import { QuestionChart } from './question-chart'

interface QuestionCardProps {
  question: QuestionWithId
  analysis: QuestionAnalysis | null
}

export function QuestionCard({ question, analysis }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {(question as any).questionTitle || 'Untitled Question'}
          {(question as any).required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </CardTitle>
        {(question as any).questionHint && (
          <p className="text-sm text-muted-foreground mt-1">
            {(question as any).questionHint}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Type: {question.type.replace('_', ' ')} •{' '}
          {analysis?.totalResponses || 0} response
          {(analysis?.totalResponses || 0) !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <QuestionChart question={question} analysis={analysis} />
      </CardContent>
    </Card>
  )
}

