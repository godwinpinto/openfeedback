import { getFeedbackForm } from './actions'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { FormViewer } from './components/form-viewer'
import type { StoredFeedbackForm } from '@/lib/openfeedback/feedback-form'

interface FeedbackPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { id } = await params

  const result = await getFeedbackForm(id)

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-2xl">Feedback Form Not Found</CardTitle>
            <CardDescription>
              {result.error || 'It looks like the feedback form does not exist or you do not have permission to view it.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <FormViewer
      formId={result.form.formId}
      formData={result.form.questionnaireFormData}
    />
  )
}

