import { eq } from 'drizzle-orm'
import { db } from '@/lib/openfeedback/db'
import { feedbackForm, feedbackSubmission } from '@/lib/openfeedback/schema'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { ReportView } from './-components/report-view'

interface ReportPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Report ID</CardTitle>
            <CardDescription>
              It looks like the report ID does not exist or you do not have permission to view it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch the feedback form for this report_id (max one form per report)
  const form = await db
    .select()
    .from(feedbackForm)
    .where(eq(feedbackForm.reportId, id))
    .limit(1)
    .then((forms) => forms[0] ?? null)

  // If no form found, show centered card message
  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-2xl">No Feedback Form Found</CardTitle>
            <CardDescription>
              It looks like the report ID does not exist or you do not have permission to view it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch all submissions for this form
  const allSubmissions = await db
    .select()
    .from(feedbackSubmission)
    .where(eq(feedbackSubmission.formId, form.formId))

  // Parse JSON data
  const questionnaireFormData = JSON.parse(form.questionnaireFormData)
  const feedbackResponseData = allSubmissions.map((submission) => ({
    responseData: JSON.parse(submission.feedbackResponseData),
    createdAt: new Date(submission.createdAt).toLocaleString(),
    createdIp: submission.createdIp,
  }))

  // Format date on server to avoid hydration mismatch
  const formattedCreatedAt = new Date(form.createdAt).toLocaleString()

  return (
    <ReportView
      questionnaireFormData={questionnaireFormData}
      feedbackResponseData={feedbackResponseData}
      reportId={id}
      formId={form.formId}
      createdAt={formattedCreatedAt}
      createdIp={form.createdIp}
      submissionCount={allSubmissions.length}
    />
  )
}

