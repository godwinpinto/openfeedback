"use client";

import * as React from "react";
import { Button, Card, CardContent, Input, Textarea, Field, FieldLabel, FieldDescription, FieldError, Separator as SeparatorComponent } from "@shared-ui";
import { FEEDBACK_FORM_STORAGE_KEY, FEEDBACK_RESPONSE_STORAGE_KEY, parseStoredForm, parseStoredResponse, serializeResponse, type QuestionWithId, isSeparatorQuestion } from "../../lib/feedback-form";
import { MultipleChoiceFieldResponse } from "../../../components/openfeedback/form/multiple-choice-field";
import { MultipleSelectFieldResponse } from "../../../components/openfeedback/form/multiple-select-field";
import { RatingFieldResponse } from "../../../components/openfeedback/form/rating-field";

type AnswersState = Record<string, string | string[] | number | undefined>;

export default function FeedbackPage() {
  const [questions, setQuestions] = React.useState<QuestionWithId[]>([]);
  const [answers, setAnswers] = React.useState<AnswersState>({});
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [headerTitle, setHeaderTitle] = React.useState<string>("Feedback");
  const [headerDescription, setHeaderDescription] = React.useState<string>("Please answer the questions below.");
  const [currentPage, setCurrentPage] = React.useState<number>(0);

  React.useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(FEEDBACK_FORM_STORAGE_KEY) : null;
    const parsed = parseStoredForm(raw);
    setQuestions(parsed.questions || []);
    setHeaderTitle(parsed.formTitle || "Feedback");
    setHeaderDescription(parsed.formDescription || "Please answer the questions below.");
    // hydrate saved responses if any
    const savedRaw = typeof window !== "undefined" ? localStorage.getItem(FEEDBACK_RESPONSE_STORAGE_KEY) : null;
    const saved = parseStoredResponse(savedRaw);
    if (saved.answers) setAnswers(saved.answers);
    if (typeof saved.currentPage === "number") setCurrentPage(saved.currentPage);
  }, []);

  const pages = React.useMemo(() => {
    const groups: QuestionWithId[][] = [[]];
    for (const q of questions) {
      if (isSeparatorQuestion(q)) {
        if (groups[groups.length - 1].length > 0) {
          groups.push([]);
        }
      } else {
        groups[groups.length - 1].push(q);
      }
    }
    // remove trailing empty group if separator at end
    return groups.filter((g) => g.length > 0);
  }, [questions]);

  React.useEffect(() => {
    if (currentPage > 0 && currentPage >= pages.length) {
      setCurrentPage(Math.max(0, pages.length - 1));
    }
  }, [pages, currentPage]);

  // Autosave responses periodically
  React.useEffect(() => {
    const save = () => {
      try {
        const payload = serializeResponse({ answers, currentPage });
        if (payload) localStorage.setItem(FEEDBACK_RESPONSE_STORAGE_KEY, payload);
      } catch {}
    };
    // initial save and then every 10s
    save();
    const id = setInterval(save, 10000);
    return () => clearInterval(id);
  }, [answers, currentPage]);

  const setAnswer = (id: string, value: string | string[] | number | undefined) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validate = () => {
    const nextErrors: Record<string, string | undefined> = {};
    for (const q of questions) {
      if (isSeparatorQuestion(q)) continue;
      const required = (q as any).required as boolean | undefined;
      if (!required) continue;
      const value = answers[q.id];
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) nextErrors[q.id] = "This question is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePage = (pageIndex: number) => {
    const nextErrors: Record<string, string | undefined> = {};
    const page = pages[pageIndex] || [];
    for (const q of page) {
      const required = (q as any).required as boolean | undefined;
      if (!required) continue;
      const value = answers[q.id];
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) nextErrors[q.id] = "This question is required";
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    // For now we only log locally. Hook up API later.
    try {
      // eslint-disable-next-line no-console
      console.log("Submitted answers", { answers });
    } catch {}
  };

  const handleSave = () => {
    try {
      const payload = serializeResponse({ answers, currentPage });
      if (payload) localStorage.setItem(FEEDBACK_RESPONSE_STORAGE_KEY, payload);
    } catch {}
  };

  const renderQuestion = (q: QuestionWithId) => {
    if (isSeparatorQuestion(q)) return null;

    const commonHeader = (
      <>
        <FieldLabel>
          {(q as any).questionTitle}
          {(q as any).required && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>
        {(q as any).questionHint && (
          <FieldDescription>{(q as any).questionHint}</FieldDescription>
        )}
      </>
    );

    if (q.type === "short_text") {
      return (
        <Field key={q.id} orientation="vertical" className="space-y-2">
          {commonHeader}
          <Input
            value={(answers[q.id] as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder={(q as any).placeholder || "Your answer"}
          />
          {errors[q.id] && <FieldError>{errors[q.id]}</FieldError>}
        </Field>
      );
    }

    if (q.type === "long_text") {
      return (
        <Field key={q.id} orientation="vertical" className="space-y-2">
          {commonHeader}
          <Textarea
            rows={(q as any).rows || 4}
            value={(answers[q.id] as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder={(q as any).placeholder || "Type your response"}
          />
          {errors[q.id] && <FieldError>{errors[q.id]}</FieldError>}
        </Field>
      );
    }

    if (q.type === "multiple_choice") {
      return (
        <MultipleChoiceFieldResponse
          key={q.id}
          field={q as any}
          fieldId={q.id}
          value={(answers[q.id] as string) || ""}
          error={errors[q.id]}
          onChange={(v) => setAnswer(q.id, v)}
        />
      );
    }

    if (q.type === "multiple_select") {
      return (
        <MultipleSelectFieldResponse
          key={q.id}
          field={q as any}
          fieldId={q.id}
          value={(answers[q.id] as string[]) || []}
          error={errors[q.id]}
          onChange={(v) => setAnswer(q.id, v)}
        />
      );
    }

    if (q.type === "rating") {
      return (
        <RatingFieldResponse
          key={q.id}
          field={q as any}
          fieldId={q.id}
          value={(answers[q.id] as number) || undefined}
          error={errors[q.id]}
          onChange={(v) => setAnswer(q.id, v)}
        />
      );
    }

    return null;
  };

  return (
    <div className="relative min-h-screen pt-16 pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8" />

        {pages.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">No questionnaire found in your browser.</div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="shadow-none">
              <CardContent className="pt-4 space-y-6">
                {currentPage === 0 && (
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold mb-1">{headerTitle}</h1>
                    {headerDescription && (
                      <div className="text-muted-foreground">{headerDescription}</div>
                    )}
                    <SeparatorComponent />
                  </div>
                )}
                {(pages[currentPage] || []).map((q, idx, arr) => (
                  <div key={q.id} className="space-y-6">
                    {renderQuestion(q)}
                    {idx < arr.length - 1 && <SeparatorComponent />}
                  </div>
                ))}
              </CardContent>
            </Card>
            {submitted && (
              <div className="text-sm text-green-600 dark:text-green-400">Thanks! Your feedback has been recorded locally.</div>
            )}
            <div className="h-20" />
            <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
              <div className="container mx-auto max-w-2xl border rounded-lg bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
                <div className="flex items-center justify-between gap-2 p-4">
                  <div className="text-xs text-muted-foreground">Page {Math.min(currentPage + 1, pages.length)} of {pages.length}</div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleSave}>Save</Button>
                    {currentPage > 0 && (
                      <Button type="button" variant="outline" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}>Previous</Button>
                    )}
                    {currentPage < pages.length - 1 ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (validatePage(currentPage)) setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
                        }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button type="submit">Submit</Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


