'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Send, Loader2, MessageCircle, X, Minimize2, Maximize2, PlusIcon } from 'lucide-react'
import { useGenUIHybridLLM } from '@/hooks/use-genui-hybrid-llm'
import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import type { SubmissionData } from './types'
import { convertFeedbackDataToCsv } from './csv-utils'

interface ReportChatbotProps {
  questions: QuestionWithId[]
  feedbackResponseData: SubmissionData[]
  reportId: string
}

export function ReportChatbot({
  questions,
  feedbackResponseData,
  reportId,
}: ReportChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Convert feedback data to CSV
  const csvData = useMemo(() => {
    return convertFeedbackDataToCsv(questions, feedbackResponseData)
  }, [questions, feedbackResponseData])

  // Create system prompt with CSV data
  const systemPrompt = useMemo(() => {
    if (!csvData) {
      return 'You are a helpful assistant that helps analyze feedback data. However, there is no data available to analyze.'
    }

    return `You are a helpful assistant that helps analyze feedback data. You have access to feedback responses in CSV format.

The feedback data is provided below in CSV format:

\`\`\`csv
${csvData}
\`\`\`

You can answer questions about:
- Summary statistics (e.g., total responses, average ratings)
- Response patterns and trends
- Individual responses
- Question-specific insights
- Comparisons between different submissions

Please analyze the data and provide helpful, accurate insights based on the CSV data provided. Always refer to the actual data when making statements.`
  }, [csvData])

  // Use the hybrid LLM hook with system prompt
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    transportMode,
    isLocalSupported,
    localAvailability,
    setTransportMode,
  } = useGenUIHybridLLM({
    autoUseLocalIfAvailable: true,
    chatIdPrefix: `report-chat-${reportId}`,
    // Pass system message to local transport
    localTransportOptions: {
      system: systemPrompt,
    },
    // Pass system message to remote API via body
   
  })

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== 'ready') return

    sendMessage({ text: input },{body: {
      system: systemPrompt,
    }})
    setInput('')
  }

  return (
    <>
      {/* Floating Chat Button - Show when closed or minimized */}
      {(!isOpen || isMinimized) && (
        <Button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {messages.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {messages.length}
            </Badge>
          )}
        </Button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <Card
          className={`py-0 fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl border-2 transition-all duration-300 overflow-hidden gap-0 ${
            isMinimized
              ? 'h-16 w-80'
              : 'h-[60vh] max-h-[60vh] w-[480px] max-w-[calc(100vw-3rem)]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Discuss Feedback</h3>
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {messages.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
            {!isMinimized && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="mr-4"
              >
                <PlusIcon className="h-4 w-4" />
                New Chat
              </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              
            </div>
          </div>

          {/* Chat Content - Hidden when minimized */}
          {!isMinimized && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
                  <div className="flex flex-col gap-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">
                        Ask me anything about the feedback data!
                      </p>
                      <p className="text-xs mt-2 opacity-70">
                        I can help you analyze responses, find patterns, and summarize insights.
                      </p>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {message.role === 'user' ? 'You' : 'Assistant'}
                        </div>
                        <div className="whitespace-pre-wrap text-sm">
                          {message.parts.map((part, index) => {
                            if (part.type === 'text') {
                              return <span key={index}>{part.text}</span>
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {(status === 'submitted' || status === 'streaming') && (
                    <div className="flex justify-start gap-2">
                      <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                  </div>
              </div>

              {error && (
                <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t shrink-0">
                  <div>An error occurred. Please try again.</div>
                </div>
              )}

              <div className="border-t px-4 py-3 bg-background shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                  <Select
                    value={transportMode}
                    onValueChange={(value) => {
                      if (value === 'local' && isLocalSupported && localAvailability !== 'unavailable') {
                        setTransportMode('local')
                      } else {
                        setTransportMode('remote')
                      }
                    }}
                    disabled={
                      status === 'submitted' ||
                      status === 'streaming'
                    }
                  >
                    <SelectTrigger className="w-[120px] h-9" size="sm">
                      <SelectValue>
                        {transportMode === 'local' 
                          ? `Local AI${localAvailability === 'available' ? ' ✓' : ''}`
                          : 'Remote API'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">
                        Remote API{transportMode === 'remote' ? ' (Active)' : ''}
                      </SelectItem>
                      <SelectItem 
                        value="local"
                        disabled={!isLocalSupported || localAvailability === 'unavailable'}
                      >
                        Local Chrome AI
                        {localAvailability === 'checking' && ' (Checking...)'}
                        {localAvailability === 'downloadable' && ' (Downloadable)'}
                        {localAvailability === 'available' && ' (Available)'}
                        {transportMode === 'local' && ' (Active)'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about the feedback data..."
                    disabled={status !== 'ready'}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    {(status === 'submitted' || status === 'streaming') && (
                      <Button type="button" variant="outline" size="sm" onClick={stop}>
                        Stop
                      </Button>
                    )}
                    <Button type="submit" size="sm" disabled={status !== 'ready' || !input.trim()}>
                      {status === 'ready' ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  )
}

