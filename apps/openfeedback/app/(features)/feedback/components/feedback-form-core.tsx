"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { GenUIInput } from "@/components/genui-input";
import { GenUITextarea } from "@/components/genui-textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { serializeResponse, parseStoredResponse, type QuestionWithId, isSeparatorQuestion, type StoredFeedbackForm } from "@/lib/openfeedback/feedback-form";
import { MultipleChoiceFieldResponse } from "@/components/openfeedback/form/multiple-choice-field";
import { MultipleSelectFieldResponse } from "@/components/openfeedback/form/multiple-select-field";
import { RatingFieldResponse } from "@/components/openfeedback/form/rating-field";
import { genUIToast } from "@/lib/genui-sonner";
import { GenUIHumanVerification } from "@/components/genui-human-verification";
import { isFormSubmitted, markFormAsSubmitted, unmarkFormAsSubmitted } from "@/lib/openfeedback/submitted-forms";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AnswersState = Record<string, string | string[] | number | undefined>;

interface FeedbackFormCoreProps {
  formData: StoredFeedbackForm;
  mode: 'preview' | 'submit';
  formId?: string; // Required for 'submit' mode
  onSubmit?: (responseData: string) => Promise<{ success: boolean; error?: string }>;
  storageKey?: string; // For localStorage key
  initialAnswers?: AnswersState;
  initialPage?: number;
}

export function FeedbackFormCore({
  formData,
  mode,
  formId,
  onSubmit,
  storageKey,
  initialAnswers = {},
  initialPage = 0,
}: FeedbackFormCoreProps) {
  const [questions] = React.useState<QuestionWithId[]>(formData.questions || []);
  const [answers, setAnswers] = React.useState<AnswersState>(initialAnswers);
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [headerTitle] = React.useState<string>(formData.formTitle || "Feedback");
  const [headerDescription] = React.useState<string>(formData.formDescription || "Please answer the questions below.");
  const [currentPage, setCurrentPage] = React.useState<number>(initialPage);
  const [hasLoadedInitialData, setHasLoadedInitialData] = React.useState<boolean>(false);
  const [showVerificationDialog, setShowVerificationDialog] = React.useState<boolean>(false);
  const [isVerified, setIsVerified] = React.useState<boolean>(false);
  const [needsVerification, setNeedsVerification] = React.useState<boolean>(false);

  // Check if form needs verification on mount (only for submit mode)
  React.useEffect(() => {
    if (mode === 'submit' && formId && typeof window !== 'undefined') {
      const wasSubmitted = isFormSubmitted(formId);
      setNeedsVerification(wasSubmitted);
    }
  }, [mode, formId]); // Only check once on mount or when formId changes

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

  // Load saved data from localStorage on mount
  React.useEffect(() => {
    if (!storageKey) {
      setHasLoadedInitialData(true);
      return;
    }
    
    const savedRaw = typeof window !== "undefined" 
      ? localStorage.getItem(storageKey) 
      : null;
    const saved = parseStoredResponse(savedRaw);
    if (saved.answers && Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers);
    }
    if (typeof saved.currentPage === "number") {
      setCurrentPage(saved.currentPage);
    }
    setHasLoadedInitialData(true);
  }, [storageKey]); // Only run once when storageKey changes

  // Autosave responses periodically to localStorage (only after initial data is loaded, and before submission)
  React.useEffect(() => {
    if (!storageKey || !hasLoadedInitialData || submitted) return;
    
    const save = () => {
      try {
        const payload = serializeResponse({ answers, currentPage });
        if (payload) localStorage.setItem(storageKey, payload);
      } catch {}
    };
    // initial save and then every 10s
    save();
    const id = setInterval(save, 10000);
    return () => clearInterval(id);
  }, [answers, currentPage, storageKey, hasLoadedInitialData, submitted]);

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

  const handleSubmit = async () => {
    if (!validate()) {
      setShowConfirmDialog(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const responseData = serializeResponse({ answers, currentPage });
      if (!responseData) {
        throw new Error("Failed to serialize response");
      }

      if (mode === 'preview') {
        // Preview mode: just log and mark as submitted
        console.log("Submitted answers", { answers });
        setSubmitted(true);
      } else if (mode === 'submit' && onSubmit) {
        // Submit mode: call the submit handler
        const result = await onSubmit(responseData);

        if (result.success) {
          setSubmitted(true);
          // Clear localStorage after successful submission
          if (storageKey) {
            localStorage.removeItem(storageKey);
          }
          // Mark form as submitted
          if (formId) {
            markFormAsSubmitted(formId);
          }
          // Reset verification state for next submission
          setIsVerified(false);
          // Show success toast
          await genUIToast.success('Feedback submitted successfully!', {
            tone: 'funny',
          });
        } else {
          alert(`Failed to submit feedback: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("An error occurred while submitting your feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (mode === 'preview') {
      // Preview mode: submit immediately without confirmation
      handleSubmit();
    } else {
      // Submit mode: show confirmation dialog (verification already handled before showing form)
      setShowConfirmDialog(true);
    }
  };

  const handleSave = async () => {
    if (!storageKey) return;
    try {
      const payload = serializeResponse({ answers, currentPage });
      if (payload) {
        localStorage.setItem(storageKey, payload);
        // Show success toast
        await genUIToast.success('Progress saved successfully!', {
          tone: 'funny',
        });
      }
    } catch {
      await genUIToast.error('Failed to save progress');
    }
  };

  const buildSharedContext = (currentQuestionId: string): string => {
    const previousAnswers: string[] = [];
    
    questions.forEach((question) => {
      if (isSeparatorQuestion(question) || question.id === currentQuestionId) {
        return;
      }
      
      const answer = answers[question.id];
      if (answer === undefined || answer === null || answer === '') {
        return;
      }
      
      const questionTitle = (question as any).questionTitle || 'Untitled question';
      let answerText = '';
      
      if (typeof answer === 'string') {
        answerText = answer;
      } else if (Array.isArray(answer)) {
        answerText = answer.join(', ');
      } else if (typeof answer === 'number') {
        answerText = answer.toString();
      }
      
      if (answerText.trim()) {
        previousAnswers.push(`Q: "${questionTitle}"\nA: "${answerText}"`);
      }
    });
    
    if (previousAnswers.length === 0) {
      return '';
    }
    
    return `Context from previous responses in this feedback form:\n\n${previousAnswers.join('\n\n')}\n\nUse this context to provide a consistent and coherent response that aligns with the user's previous answers.`;
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
    
    const sharedContext = buildSharedContext(q.id);

    if (q.type === "short_text") {
      return (
        <Field key={q.id} orientation="vertical" className="space-y-2">
          {commonHeader}
          <GenUIInput
            value={(answers[q.id] as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder={(q as any).placeholder || "Your answer"}
            features={["compose", "improve", "fix-grammar", "translate"]}
            translateTargets={["en", "fr", "es", "de", "hi", "ja", "zh-CN"]}
            translateLanguageMap={{
              en: 'English',
              fr: 'French',
              es: 'Spanish',
              de: 'German',
              hi: 'Hindi',
              ja: 'Japanese',
              'zh-CN': 'Chinese (Simplified)'
            }}
            placeholderPrompt="Describe what you want"
            writerOptions={{
              tone: 'neutral',
              format: 'plain-text',
              length: 'short',
              sharedContext: sharedContext || undefined,
              expectedInputLanguages: ['en'],
              expectedContextLanguages: ['en'],
              outputLanguage: 'en',
            }}
            onAccept={(text) => setAnswer(q.id, text)}
            onAIError={(e) => console.error('AI input error:', e)}
          />
          {errors[q.id] && <FieldError>{errors[q.id]}</FieldError>}
        </Field>
      );
    }

    if (q.type === "long_text") {
      return (
        <Field key={q.id} orientation="vertical" className="space-y-2">
          {commonHeader}
          <GenUITextarea
            rows={(q as any).rows || 4}
            value={(answers[q.id] as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder={(q as any).placeholder || "Type your response"}
            features={["compose", "improve", "fix-grammar", "translate", "inline-suggest"]}
            translateTargets={["en", "fr", "es", "de", "hi", "ja", "zh-CN"]}
            translateLanguageMap={{
              en: 'English',
              fr: 'French',
              es: 'Spanish',
              de: 'German',
              hi: 'Hindi',
              ja: 'Japanese',
              'zh-CN': 'Chinese (Simplified)'
            }}
            placeholderPrompt="Describe what you want"
            writerOptions={{
              tone: 'neutral',
              format: 'plain-text',
              length: 'medium',
              sharedContext: sharedContext || undefined,
              expectedInputLanguages: ['en'],
              expectedContextLanguages: ['en'],
              outputLanguage: 'en',
            }}
            onAccept={(text) => setAnswer(q.id, text)}
            onAIError={(e) => console.error('AI error:', e)}
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

  const submitMessage = mode === 'preview' 
    ? "Thanks! Your feedback has been recorded locally."
    : "Thanks! Your feedback has been submitted successfully.";

  return (
    <>
      <div className="relative min-h-screen pt-16 pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8" />

          {submitted ? (
            <Card className="shadow-none">
              <CardContent className="pt-12 pb-12">
                <div className="space-y-6 text-center">
                  <h1 className="text-3xl font-bold mb-2">{headerTitle}</h1>
                  <div className="text-lg text-green-600 dark:text-green-400 font-medium">
                    Thanks! Your feedback has been submitted successfully.
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : mode === 'submit' && needsVerification ? (
            <Card className="shadow-none">
              <CardContent className="pt-12 pb-12">
                <div className="space-y-6 text-center">
                  <h1 className="text-3xl font-bold mb-2">{headerTitle}</h1>
                  {headerDescription && (
                    <div className="text-muted-foreground mb-6">{headerDescription}</div>
                  )}
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      You've already submitted this form. Please verify you are human to submit again.
                    </p>
                    <GenUIHumanVerification
                      onVerified={async (confidence) => {
                        // On successful verification, remove form ID and show the form
                        if (formId) {
                          unmarkFormAsSubmitted(formId);
                          setIsVerified(true);
                          setNeedsVerification(false);
                          await genUIToast.success('Verification successful! You can now submit the form.', {
                            tone: 'funny',
                          });
                        }
                      }}
                      onVerificationFailed={async () => {
                        // Keep verification screen visible on failure
                        setNeedsVerification(true);
                        await genUIToast.error('Verification failed. Please try again.');
                      }}
                      onError={async (error) => {
                        // Keep verification screen visible on error
                        console.error('Verification error:', error);
                        setNeedsVerification(true);
                        await genUIToast.error('An error occurred during verification.');
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : pages.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  {mode === 'preview' 
                    ? "No questionnaire found in your browser."
                    : "No questions found in this form."}
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmitClick} className="space-y-6">
              <Card className="shadow-none">
                <CardContent className="pt-4 space-y-6">
                  {currentPage === 0 && (
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold mb-1">{headerTitle}</h1>
                      {headerDescription && (
                        <div className="text-muted-foreground">{headerDescription}</div>
                      )}
                      <Separator />
                    </div>
                  )}
                  {(pages[currentPage] || []).map((q, idx, arr) => (
                    <div key={q.id} className="space-y-6">
                      {renderQuestion(q)}
                      {idx < arr.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
              {submitted && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  {submitMessage}
                </div>
              )}
              <div className="h-20" />
              <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
                <div className="container mx-auto max-w-2xl border rounded-lg bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="text-xs text-muted-foreground">
                      Page {Math.min(currentPage + 1, pages.length)} of {pages.length}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {storageKey && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleSave}
                          disabled={isSubmitting}
                        >
                          Save
                        </Button>
                      )}
                      {currentPage > 0 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                          disabled={isSubmitting}
                        >
                          Previous
                        </Button>
                      )}
                      {currentPage < pages.length - 1 ? (
                        <Button
                          type="button"
                          onClick={() => {
                            if (validatePage(currentPage)) setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
                          }}
                          disabled={isSubmitting}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {mode === 'submit' && (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to submit your feedback? Once submitted, you won't be able to make changes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

