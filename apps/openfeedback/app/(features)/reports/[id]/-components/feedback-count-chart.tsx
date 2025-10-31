'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'
import type { SubmissionData } from './types'

interface FeedbackCountChartProps {
  feedbackResponseData: SubmissionData[]
}

export function FeedbackCountChart({ feedbackResponseData }: FeedbackCountChartProps) {
  const chartData = useMemo(() => {
    // Get the last 30 days from today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const days: Map<string, number> = new Map()
    
    // Initialize all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
      days.set(dateKey, 0)
    }
    
    // Count submissions per day
    feedbackResponseData.forEach((submission) => {
      // Parse the createdAt string - it might be in different formats
      const submissionDate = new Date(submission.createdAt)
      submissionDate.setHours(0, 0, 0, 0)
      const dateKey = submissionDate.toISOString().split('T')[0]
      
      // Only count if within the last 30 days
      const daysDiff = Math.floor((today.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff >= 0 && daysDiff < 30) {
        days.set(dateKey, (days.get(dateKey) || 0) + 1)
      }
    })
    
    // Convert to array format for chart
    return Array.from(days.entries()).map(([date, count]) => {
      const dateObj = new Date(date)
      // Format: "Jan 1" or "Dec 15"
      const month = dateObj.toLocaleDateString('en-US', { month: 'short' })
      const day = dateObj.getDate()
      return {
        date: date,
        label: `${month} ${day}`,
        count: count,
      }
    })
  }, [feedbackResponseData])

  const chartConfig: ChartConfig = {
    count: {
      label: 'Feedback Count',
      color: 'hsl(var(--chart-1))',
    },
  }

  // Custom bar shape
  const renderBar = (props: any) => {
    const { x, y, width, height } = props
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="var(--color-count)"
          rx={4}
        />
      </g>
    )
  }

  const totalCount = feedbackResponseData.length
  const last30DaysCount = chartData.reduce((sum, day) => sum + day.count, 0)

  return (
    <Card className="w-full gap-0 my-4 py-0 pt-2 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <CardTitle className="text-lg">Feedback Activity - Last 30 Days</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Total: {totalCount} submission{totalCount !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>Last 30 Days: {last30DaysCount} submission{last30DaysCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 mb-0">
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={chartData}>
            <XAxis
              dataKey="label"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={Math.floor(chartData.length / 10)} // Show approximately 10 labels
            />
            <YAxis />
            <ChartTooltip
              content={<ChartTooltipContent />}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const data = payload[0].payload
                  const dateObj = new Date(data.date)
                  return dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                return label
              }}
            />
            <Bar dataKey="count" name="Feedback Count" shape={renderBar} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

