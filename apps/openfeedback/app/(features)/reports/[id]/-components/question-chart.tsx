'use client'

import { useState } from 'react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { QuestionWithId } from '@/lib/openfeedback/feedback-form'
import type { QuestionAnalysis } from './types'

// Chart colors that will be used in chartConfig
const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const
const ITEMS_PER_PAGE = 5

interface QuestionChartProps {
  question: QuestionWithId
  analysis: QuestionAnalysis | null
}

export function QuestionChart({ question, analysis }: QuestionChartProps) {
  if (!analysis || analysis.totalResponses === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No responses yet
      </div>
    )
  }

  if (analysis.type === 'multiple_choice' || analysis.type === 'multiple_select') {
    const chartConfig: ChartConfig = {}
    const dataWithColors = analysis.data.map((item, index) => {
      // Create a sanitized key for CSS variables (remove spaces, special chars)
      const configKey = item.name ? item.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : `item_${index}`
      const chartColor = CHART_COLORS[index % CHART_COLORS.length]
      
      if (item.name) {
        chartConfig[configKey] = {
          label: item.name,
          color: chartColor,
        }
      }
      
      // Use CSS variable format that ChartContainer will generate
      return {
        ...item,
        fill: `var(--color-${configKey})`,
      }
    })

    // Use pie chart for small datasets, bar chart for larger ones
    if (analysis.data.length <= 5) {
      return (
        <ChartContainer config={chartConfig} className="h-48">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={dataWithColors}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {dataWithColors.map((item, index) => (
                <Cell key={`cell-${index}`} fill={item.fill || CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      )
    }

    // Custom bar shape that uses fill from data
    const renderBar = (props: any) => {
      const { payload, x, y, width, height, entry } = props
      // In Recharts, entry contains the full data object
      const dataEntry = entry || payload
      const barFill = dataEntry?.fill || CHART_COLORS[0]
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={barFill}
            rx={4}
          />
        </g>
      )
    }

    return (
      <ChartContainer config={chartConfig} className="h-48">
        <BarChart data={dataWithColors}>
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" shape={renderBar} />
        </BarChart>
      </ChartContainer>
    )
  }

  if (analysis.type === 'rating') {
    const chartConfig: ChartConfig = {}
    const dataWithColors = analysis.data.map((item, index) => {
      // Create a sanitized key for CSS variables (remove spaces, special chars)
      const configKey = item.name ? item.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : `item_${index}`
      const chartColor = CHART_COLORS[index % CHART_COLORS.length]
      
      if (item.name) {
        chartConfig[configKey] = {
          label: item.name,
          color: chartColor,
        }
      }
      
      // Use CSS variable format that ChartContainer will generate
      return {
        ...item,
        fill: `var(--color-${configKey})`,
      }
    })

    // Custom bar shape that uses fill from data
    const renderBar = (props: any) => {
      const { payload, x, y, width, height, entry } = props
      // In Recharts, entry contains the full data object
      const dataEntry = entry || payload
      const barFill = dataEntry?.fill || CHART_COLORS[0]
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={barFill}
            rx={4}
          />
        </g>
      )
    }

    return (
      <div className="space-y-2">
        {analysis.average && (
          <div className="text-sm text-muted-foreground">
            Average: {analysis.average.toFixed(1)} / {(question as any).maxRating || 5}
          </div>
        )}
        <ChartContainer config={chartConfig} className="h-48">
          <BarChart data={dataWithColors}>
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" shape={renderBar} />
          </BarChart>
        </ChartContainer>
      </div>
    )
  }

  if (analysis.type === 'text') {
    return <TextResponsesWithPagination data={analysis.data} />
  }

  return null
}

function TextResponsesWithPagination({
  data,
}: {
  data: Array<{ name?: string; value: number | string; id?: number }>
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = data.slice(startIndex, endIndex)

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 min-h-[200px]">
        {currentData.map((item) => (
          <div
            key={item.id}
            className="text-sm p-2 bg-muted rounded border-l-2 border-primary"
          >
            {item.value}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {data.length} response
            {data.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

