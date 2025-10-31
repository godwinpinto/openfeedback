'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import type { QuestionAnalysis } from './types'
import { QuestionChart } from './question-chart'

interface QuestionCardProps {
  question: QuestionWithId
  analysis: QuestionAnalysis | null
}

export function QuestionCard({ question, analysis }: QuestionCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">
          {(question as any).questionTitle || 'Untitled Question'}
          {(question as any).required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </CardTitle>
        {(question as any).questionHint && (
          <p className="text-sm text-muted-foreground">
            {(question as any).questionHint}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {question.type.replace('_', ' ')}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {analysis?.totalResponses || 0} response
            {(analysis?.totalResponses || 0) !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="border-t p-4">
        <QuestionChart question={question} analysis={analysis} />
      </CardContent>
      {question.type === 'rating' && analysis?.average !== undefined && (
        <CardFooter className="border-t pt-4">
          <div className="text-sm font-medium">
            Overall Average: <span className="text-lg font-semibold">{analysis.average.toFixed(1)}</span>
            <span className="text-muted-foreground ml-1">
              / {((question as any).maxRating || 5)}
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

