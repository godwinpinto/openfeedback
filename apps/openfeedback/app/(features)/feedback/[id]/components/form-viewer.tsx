"use client";

import * as React from "react";
import { FeedbackFormCore } from "../../components/feedback-form-core";
import { submitFeedback } from "@/app/(features)/feedback/[id]/actions";
import { Toaster } from "@/lib/genui-sonner";
import type { StoredFeedbackForm } from "@/lib/openfeedback/feedback-form";

interface FormViewerProps {
  formId: string;
  formData: StoredFeedbackForm;
}

export function FormViewer({ formId, formData }: FormViewerProps) {
  const handleSubmit = async (responseData: string) => {
    const result = await submitFeedback(formId, responseData);
    return {
      success: result.success,
      error: result.success ? undefined : result.error,
    };
  };

  return (
    <>
      <Toaster richColors />
      <FeedbackFormCore
        formData={formData}
        mode="submit"
        formId={formId}
        onSubmit={handleSubmit}
        storageKey={`feedback_response_${formId}`}
      />
    </>
  );
}

