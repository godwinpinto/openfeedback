interface ReportInfoProps {
  formTitle?: string
  formDescription?: string
  formId: string
  createdAt: string
  createdIp?: string | null
  submissionCount: number
}

export function ReportInfo({
  formTitle,
  formDescription,
  formId,
  createdAt,
  createdIp,
  submissionCount,
}: ReportInfoProps) {
  return (
    <div className="mb-8">
      <div className="mt-10 p-4 border rounded-lg bg-muted/50">
        <div className="flex justify-between items-start">
          <div>
            {formTitle && (
              <h3 className="text-2xl font-bold mb-1">
                {formTitle}
              </h3>
            )}
            {formDescription && (
              <p className="text-muted-foreground mb-3">
                {formDescription}
              </p>
            )}
            <p className="text-sm text-muted-foreground">Created: {createdAt}</p>
            {createdIp && (
              <p className="text-sm text-muted-foreground">IP: {createdIp}</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Submissions: {submissionCount}
          </div>
        </div>
      </div>
    </div>
  )
}

