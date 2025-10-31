import type { LongTextFieldProps } from "@/components/openfeedback/form/long-text-field";
import type { MultipleChoiceFieldProps } from "@/components/openfeedback/form/multiple-choice-field";
import type { MultipleSelectFieldProps } from "@/components/openfeedback/form/multiple-select-field";
import type { RatingFieldProps } from "@/components/openfeedback/form/rating-field";
import type { ShortTextFieldProps } from "@/components/openfeedback/form/short-text-field";

export const FEEDBACK_FORM_STORAGE_KEY = "encatch_feedback_form";
export const FEEDBACK_RESPONSE_STORAGE_KEY = "encatch_feedback_response";

export type SeparatorItem = { type: "separator" };

export type FeedbackQuestion =
  | ShortTextFieldProps
  | LongTextFieldProps
  | MultipleChoiceFieldProps
  | RatingFieldProps
  | MultipleSelectFieldProps
  | SeparatorItem;

export type QuestionWithId = FeedbackQuestion & { id: string };

export type StoredFeedbackForm = {
  savedAt?: string;
  formTitle?: string;
  formDescription?: string;
  theme?: {
    lightPrimary?: string;
    darkPrimary?: string;
  };
  questions: QuestionWithId[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const hasValidType = (question: Record<string, unknown>): question is QuestionWithId => {
  const type = question.type;
  if (typeof type !== "string") return false;
  if (typeof question.id !== "string") return false;

  if (type === "separator") {
    return true;
  }

  switch (type) {
    case "short_text":
      return typeof (question as Partial<ShortTextFieldProps>).questionTitle === "string";
    case "long_text":
      return typeof (question as Partial<LongTextFieldProps>).questionTitle === "string";
    case "multiple_choice":
      return Array.isArray((question as Partial<MultipleChoiceFieldProps>).options);
    case "rating":
      return typeof (question as Partial<RatingFieldProps>).questionTitle === "string";
    case "multiple_select":
      return Array.isArray((question as Partial<MultipleSelectFieldProps>).options);
    default:
      return false;
  }
};

export const parseStoredQuestions = (raw: string | null): QuestionWithId[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((candidate): candidate is QuestionWithId => {
          if (!isRecord(candidate)) return false;
          return hasValidType(candidate);
        })
        .map((question) => question);
    }

    if (isRecord(parsed) && Array.isArray(parsed.questions)) {
      return parsed.questions.filter((candidate): candidate is QuestionWithId => {
        if (!isRecord(candidate)) return false;
        return hasValidType(candidate);
      });
    }
  } catch (error) {
    console.warn("Failed to parse stored feedback questions", error);
  }

  return [];
};

export const parseStoredForm = (raw: string | null): StoredFeedbackForm => {
  const fallback: StoredFeedbackForm = { questions: [] };
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return fallback;
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((candidate): candidate is QuestionWithId => {
          if (!isRecord(candidate)) return false;
          return hasValidType(candidate);
        })
      : [];
    const theme = isRecord(parsed.theme)
      ? {
          lightPrimary: typeof parsed.theme.lightPrimary === "string" ? parsed.theme.lightPrimary : undefined,
          darkPrimary: typeof parsed.theme.darkPrimary === "string" ? parsed.theme.darkPrimary : undefined,
        }
      : undefined;
    return {
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : undefined,
      formTitle: typeof parsed.formTitle === "string" ? parsed.formTitle : undefined,
      formDescription:
        typeof parsed.formDescription === "string" ? parsed.formDescription : undefined,
      theme,
      questions,
    };
  } catch {
    return fallback;
  }
};

export const serializeQuestions = (questions: QuestionWithId[]) => {
  try {
    return JSON.stringify({
      savedAt: new Date().toISOString(),
      questions,
    });
  } catch {
    return null;
  }
};

export const serializeForm = (form: StoredFeedbackForm) => {
  try {
    return JSON.stringify({
      savedAt: new Date().toISOString(),
      formTitle: form.formTitle,
      formDescription: form.formDescription,
      theme: form.theme,
      questions: form.questions,
    });
  } catch {
    return null;
  }
};

export const isSeparatorQuestion = (
  question: FeedbackQuestion | QuestionWithId,
): question is SeparatorItem | (SeparatorItem & { id: string }) => {
  return question.type === "separator";
};

// Response persistence
export type StoredFeedbackResponse = {
  updatedAt?: string;
  answers: Record<string, string | string[] | number | undefined>;
  currentPage?: number;
};

export const parseStoredResponse = (raw: string | null): StoredFeedbackResponse => {
  const fallback: StoredFeedbackResponse = { answers: {} };
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return fallback;
    const answers = isRecord(parsed.answers)
      ? (parsed.answers as Record<string, string | string[] | number | undefined>)
      : {};
    return {
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : undefined,
      currentPage: typeof parsed.currentPage === "number" ? parsed.currentPage : undefined,
      answers,
    };
  } catch {
    return fallback;
  }
};

export const serializeResponse = (resp: StoredFeedbackResponse) => {
  try {
    return JSON.stringify({
      updatedAt: new Date().toISOString(),
      answers: resp.answers || {},
      currentPage: typeof resp.currentPage === "number" ? resp.currentPage : undefined,
    });
  } catch {
    return null;
  }
};


