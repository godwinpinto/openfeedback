// Type definitions for Chrome Summarizer API
export interface SummarizerOptions {
  sharedContext?: string;
  type?: "key-points" | "tldr" | "teaser" | "headline";
  format?: "markdown" | "plain-text";
  length?: "short" | "medium" | "long";
  expectedInputLanguages?: string[];
  outputLanguage?: string;
  expectedContextLanguages?: string[];
  monitor?: (monitor: any) => void;
}

export interface SummarizeOptions {
  context?: string;
}

export interface SummarizeSelectionProps {
  className?: string;
  defaultOptions?: SummarizerOptions;
  dialogTitle?: string;
}

export interface ButtonPosition {
  top: number;
  left: number;
  visible: boolean;
}

export interface UseSummarizerOptions extends SummarizerOptions {
  context?: string;
}

// Type definitions for Chrome Writer API
export interface WriterOptions {
  sharedContext?: string;
  tone?: "formal" | "neutral" | "casual";
  format?: "markdown" | "plain-text";
  length?: "short" | "medium" | "long";
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  monitor?: (monitor: any) => void;
  signal?: AbortSignal;
}

export interface WriteOptions {
  context?: string;
}

// Type definitions for Chrome Rewriter API
export interface RewriterOptions {
  sharedContext?: string;
  tone?: "more-formal" | "as-is" | "more-casual";
  format?: "as-is" | "markdown" | "plain-text";
  length?: "shorter" | "as-is" | "longer";
  expectedInputLanguages?: string[];
  expectedContextLanguages?: string[];
  outputLanguage?: string;
  monitor?: (monitor: any) => void;
  signal?: AbortSignal;
}

export interface RewriteOptions {
  context?: string;
  signal?: AbortSignal;
}
