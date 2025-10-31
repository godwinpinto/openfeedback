'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { SubmissionData } from './types'
import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import { getAnswers } from './utils'
import { GenUISummarizerContent, GenUISummarizerProvider, GenUISummarizerText, useGenUISummarizer } from '@/components/genui-summarize-block'

interface IndividualSummariesProps {
  feedbackResponseData: SubmissionData[]
  questions: QuestionWithId[]
}

function formatResponseValue(
  answer: string | string[] | number | undefined,
  question: QuestionWithId
): string {
  if (answer === undefined || answer === null || answer === '') {
    return '_No response_'
  }

  if (question.type === 'multiple_select') {
    const values = Array.isArray(answer) ? answer : [answer]
    return values.map((v) => `- ${String(v)}`).join('\n')
  }

  if (question.type === 'rating') {
    const rating = typeof answer === 'number' ? answer : Number(answer)
    const maxRating = (question as any).maxRating || 5
    return `${rating} / ${maxRating}`
  }

  return String(answer)
}

function formatQuestionType(type: string): string {
  return type.replace('_', ' ').replace('short text', 'text').replace('long text', 'text')
}

interface CachedSummaryDisplayProps {
  cachedResult: string
  title?: string
}

// Display component for cached summaries (mimics GenUISummarizerContent UI)
function CachedSummaryDisplay({ cachedResult, title = 'Individual Summary' }: CachedSummaryDisplayProps) {
  return (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap">{cachedResult}</div>
        </CardContent>
      </Card>
    </div>
  )
}

interface CacheAwareSummarizerProps {
  contentKey: string
  markdownContent: string
  cache: Map<string, string>
  onResult: (key: string, result: string) => void
}

// Component that wraps GenUISummarizerProvider and caches results
function CacheAwareSummarizer({ contentKey, markdownContent, cache, onResult }: CacheAwareSummarizerProps) {
  const [cachedSummary, setCachedSummary] = useState<string | null>(cache.get(contentKey) || null)

  // Check for cached result on mount and when cache updates
  useEffect(() => {
    const cached = cache.get(contentKey)
    if (cached) {
      setCachedSummary(cached)
    }
  }, [contentKey, cache])

  // If we have a cached result, don't render the provider to avoid API calls
  if (cachedSummary) {
    return (
      <>
        <CachedSummaryDisplay cachedResult={cachedSummary} />
        <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-md overflow-x-auto">
          {markdownContent}
        </pre>
      </>
    )
  }

  // No cache, render provider normally and cache result when it arrives
  return (
    <>
      <GenUISummarizerProvider 
        displayMode="static" 
        type="tldr" 
        length="medium" 
        format="plain-text"
        key={contentKey}
      >
        <ResultCacheInterceptor 
          contentKey={contentKey}
          cache={cache}
          onResult={(key, result) => {
            cache.set(key, result)
            onResult(key, result)
            setCachedSummary(result)
          }}
        />
        <GenUISummarizerContent title="Individual Summary" className="mb-6" />
        <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-md overflow-x-auto">
          <GenUISummarizerText text={markdownContent} as="div" />
        </pre>
      </GenUISummarizerProvider>
    </>
  )
}

interface ResultCacheInterceptorProps {
  contentKey: string
  cache: Map<string, string>
  onResult: (key: string, result: string) => void
}

// Component that intercepts results from GenUISummarizerProvider and caches them
function ResultCacheInterceptor({ contentKey, cache, onResult }: ResultCacheInterceptorProps) {
  // Use the exported hook to access the provider's result directly
  // This is safe because we're inside a GenUISummarizerProvider
  const { result } = useGenUISummarizer()
  const hasCachedRef = useRef(false)

  // Store result in cache when it becomes available
  useEffect(() => {
    if (result && result.trim().length > 0 && !hasCachedRef.current) {
      // Only cache if we don't already have this result cached
      const existingCache = cache.get(contentKey)
      if (!existingCache || existingCache !== result) {
        cache.set(contentKey, result)
        onResult(contentKey, result)
        hasCachedRef.current = true
      }
    }
  }, [result, contentKey, cache, onResult])

  return null
}

function RespondentCard({
  respondentIndex,
  submission,
  questions,
  contentKey,
  cache,
  onResult,
}: {
  respondentIndex: number
  submission: SubmissionData
  questions: QuestionWithId[]
  contentKey: string
  cache: Map<string, string>
  onResult: (key: string, result: string) => void
}) {
  const answers = getAnswers(submission.responseData)
  
  // Build markdown content
  const markdownContent = useMemo(() => {
    return questions
      .map((question) => {
        const questionTitle = (question as any).questionTitle || 'Untitled Question'
        const answer = answers[question.id]
        const formattedAnswer = formatResponseValue(answer, question)
        const questionType = formatQuestionType(question.type)
        
        return `# ${questionTitle} [${questionType}]\n${formattedAnswer}`
      })
      .join('\n\n')
  }, [questions, answers])

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Respondent {respondentIndex + 1}</CardTitle>
      </CardHeader>
      <CardContent>
        <CacheAwareSummarizer 
          contentKey={contentKey}
          markdownContent={markdownContent}
          cache={cache}
          onResult={onResult}
        />
      </CardContent>
    </Card>
  )
}

export function IndividualSummaries({
  feedbackResponseData,
  questions,
}: IndividualSummariesProps) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const summaryCache = useRef<Map<string, string>>(new Map())

  const totalPages = Math.ceil(feedbackResponseData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = useMemo(
    () => feedbackResponseData.slice(startIndex, endIndex),
    [feedbackResponseData, startIndex, endIndex]
  )

  // Use submissionId as the cache key (unique per submission)

  const handleCacheResult = (key: string, result: string) => {
    summaryCache.current.set(key, result)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setCurrentPage(1) // Reset to first page when page size changes
  }

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  if (feedbackResponseData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No individual responses have been submitted yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm text-muted-foreground">
            Show{' '}
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 inline-flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>{' '}
            records
          </label>
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} - {Math.min(endIndex, feedbackResponseData.length)} of{' '}
            {feedbackResponseData.length} respondent
            {feedbackResponseData.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Respondent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginatedData.map((submission, index) => (
          <RespondentCard
            key={submission.submissionId}
            respondentIndex={startIndex + index}
            submission={submission}
            questions={questions}
            contentKey={submission.submissionId}
            cache={summaryCache.current}
            onResult={handleCacheResult}
          />
        ))}
      </div>
    </div>
  )
}

