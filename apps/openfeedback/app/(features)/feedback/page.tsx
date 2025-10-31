"use client";

import * as React from "react";
import { FEEDBACK_FORM_STORAGE_KEY, FEEDBACK_RESPONSE_STORAGE_KEY, parseStoredForm, parseStoredResponse } from "@/lib/openfeedback/feedback-form";
import { FeedbackFormCore } from "./components/feedback-form-core";
import { Toaster } from "@/lib/genui-sonner";

export default function FeedbackPage() {
  const [formData, setFormData] = React.useState<ReturnType<typeof parseStoredForm> | null>(null);
  const [initialAnswers, setInitialAnswers] = React.useState<Record<string, string | string[] | number | undefined>>({});
  const [initialPage, setInitialPage] = React.useState<number>(0);

  React.useEffect(() => {
    // Load form from localStorage
    const raw = typeof window !== "undefined" ? localStorage.getItem(FEEDBACK_FORM_STORAGE_KEY) : null;
    const parsed = parseStoredForm(raw);
    setFormData(parsed);
    
    // Load saved responses if any
    const savedRaw = typeof window !== "undefined" ? localStorage.getItem(FEEDBACK_RESPONSE_STORAGE_KEY) : null;
    const saved = parseStoredResponse(savedRaw);
    if (saved.answers) setInitialAnswers(saved.answers);
    if (typeof saved.currentPage === "number") setInitialPage(saved.currentPage);
  }, []);

  if (!formData) {
    return null; // Component will show empty state
  }

  return (
    <>
      <Toaster richColors />
      <FeedbackFormCore
        formData={formData}
        mode="preview"
        storageKey={FEEDBACK_RESPONSE_STORAGE_KEY}
        initialAnswers={initialAnswers}
        initialPage={initialPage}
      />
    </>
  );
}


