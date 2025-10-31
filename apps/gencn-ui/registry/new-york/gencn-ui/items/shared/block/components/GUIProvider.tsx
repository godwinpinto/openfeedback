"use client";

import * as React from "react";
import { SummarizeSelection } from "./SummarizeSelection";
import { SummarizeOptions, SummarizerOptions } from "@/registry/new-york/gencn-ui/items/shared/block/lib/gui-types";
import { WriterOptions, RewriterOptions, WriteOptions, RewriteOptions } from "@/registry/new-york/gencn-ui/items/shared/block/lib/gui-types";


// Type definitions for Chrome Language Detector API
export interface LanguageDetectorOptions {
  monitor?: (monitor: any) => void;
}

export interface DetectedLanguage {
  detectedLanguage: string;
  confidence: number;
}

export type AvailabilityStatus =
  | "available"
  | "downloadable"
  | "unavailable"
  | null;

// LanguageModel Prompt API types
export interface PromptOptions {
  temperature?: number;
  topK?: number;
  responseConstraint?: any; // JSON Schema for structured output
  omitResponseConstraintInput?: boolean;
  signal?: AbortSignal;
}

export interface LanguageModelAvailabilityStatus {
  // State
  isLanguageModelSupported: boolean | null;
  languageModelAvailability: AvailabilityStatus;
  languageModelError: string | null;

  // Functions
  checkLanguageModelAvailability: (
    options?: PromptOptions
  ) => Promise<AvailabilityStatus>;
}

export interface VoiceableContextValue extends LanguageModelAvailabilityStatus {
  // State
  isSupported: boolean | null;
  isWriterSupported: boolean | null;
  isRewriterSupported: boolean | null;
  isLanguageDetectorSupported: boolean | null;
  availability: AvailabilityStatus;
  writerAvailability: AvailabilityStatus;
  rewriterAvailability: AvailabilityStatus;
  languageDetectorAvailability: AvailabilityStatus;
  downloadProgress: number;
  writerDownloadProgress: number;
  rewriterDownloadProgress: number;
  languageDetectorDownloadProgress: number;
  isDownloading: boolean;
  isWriterDownloading: boolean;
  isRewriterDownloading: boolean;
  isLanguageDetectorDownloading: boolean;
  error: string | null;

  // Functions
  checkAvailability: () => Promise<AvailabilityStatus>;
  checkWriterAvailability: () => Promise<AvailabilityStatus>;
  checkRewriterAvailability: () => Promise<AvailabilityStatus>;
  checkLanguageDetectorAvailability: () => Promise<AvailabilityStatus>;
  createSummarizer: (options?: SummarizerOptions) => Promise<any>;
  createWriter: (options?: WriterOptions) => Promise<any>;
  createRewriter: (options?: RewriterOptions) => Promise<any>;
  createLanguageDetector: (options?: LanguageDetectorOptions) => Promise<any>;
  summarize: (
    text: string,
    options?: SummarizeOptions & {
      streaming?: boolean;
      onChunk?: (chunk: string) => void;
    }
  ) => Promise<string>;
  write: (
    prompt: string,
    options?: WriteOptions & {
      streaming?: boolean;
      onChunk?: (chunk: string) => void;
    }
  ) => Promise<string>;
  rewrite: (
    text: string,
    options?: RewriteOptions & {
      streaming?: boolean;
      onChunk?: (chunk: string) => void;
    }
  ) => Promise<string>;
  detectLanguage: (text: string) => Promise<DetectedLanguage[]>;
  resetError: () => void;
}

const VoiceableContext = React.createContext<VoiceableContextValue | undefined>(
  undefined
);

export interface VoiceableProviderProps {
  children: React.ReactNode;
  defaultOptions?: SummarizerOptions;
  defaultWriterOptions?: WriterOptions;
  defaultRewriterOptions?: RewriterOptions;
  defaultLanguageDetectorOptions?: LanguageDetectorOptions;
  enableSelectionSummarizer?: boolean;
}

export function VoiceableProvider({
  children,
  defaultOptions,
  defaultWriterOptions,
  defaultLanguageDetectorOptions,
  defaultRewriterOptions,
  enableSelectionSummarizer = false,
}: VoiceableProviderProps) {
  const [isSupported, setIsSupported] = React.useState<boolean | null>(null);
  const [isWriterSupported, setIsWriterSupported] = React.useState<
    boolean | null
  >(null);
  const [isRewriterSupported, setIsRewriterSupported] = React.useState<
    boolean | null
  >(null);
  const [isLanguageDetectorSupported, setIsLanguageDetectorSupported] =
    React.useState<boolean | null>(null);
  const [availability, setAvailability] =
    React.useState<AvailabilityStatus>(null);
  const [writerAvailability, setWriterAvailability] =
    React.useState<AvailabilityStatus>(null);
  const [rewriterAvailability, setRewriterAvailability] =
    React.useState<AvailabilityStatus>(null);
  const [languageDetectorAvailability, setLanguageDetectorAvailability] =
    React.useState<AvailabilityStatus>(null);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [writerDownloadProgress, setWriterDownloadProgress] = React.useState(0);
  const [rewriterDownloadProgress, setRewriterDownloadProgress] =
    React.useState(0);
  const [
    languageDetectorDownloadProgress,
    setLanguageDetectorDownloadProgress,
  ] = React.useState(0);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isWriterDownloading, setIsWriterDownloading] = React.useState(false);
  const [isRewriterDownloading, setIsRewriterDownloading] =
    React.useState(false);
  const [isLanguageDetectorDownloading, setIsLanguageDetectorDownloading] =
    React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasCheckedAvailability = React.useRef(false);
  const hasCheckedWriterAvailability = React.useRef(false);
  const hasCheckedRewriterAvailability = React.useRef(false);
  const hasCheckedLanguageDetectorAvailability = React.useRef(false);

  // LanguageModel Prompt API state
  const [isLanguageModelSupported, setIsLanguageModelSupported] =
    React.useState<boolean | null>(null);
  const [languageModelAvailability, setLanguageModelAvailability] =
    React.useState<AvailabilityStatus>(null);
  const [languageModelError, setLanguageModelError] = React.useState<
    string | null
  >(null);
  const hasCheckedLanguageModelAvailability = React.useRef(false);

  // Check if Chrome Summarizer API is supported
  React.useEffect(() => {
    const checkSupport = () => {
      const hasSummarizer = "Summarizer" in self;
      const hasWriter = "Writer" in self;
      const hasLanguageDetector = "LanguageDetector" in self;
      const hasRewriter = "Rewriter" in self;

      setIsSupported(hasSummarizer);
      setIsWriterSupported(hasWriter);
      setIsRewriterSupported(hasRewriter);
      setIsLanguageDetectorSupported(hasLanguageDetector);

      if (
        !hasSummarizer &&
        !hasWriter &&
        !hasRewriter &&
        !hasLanguageDetector
      ) {
        const errorMsg =
          "Chrome AI APIs are not supported in this browser. Please use Chrome 137+ with the required hardware specifications.";
        setError(errorMsg);
      }
    };

    checkSupport();
  }, []);

  // Check if Chrome LanguageModel Prompt API is supported
  React.useEffect(() => {
    const checkLanguageModelSupport = () => {
      if ("LanguageModel" in self) {
        setIsLanguageModelSupported(true);
      } else {
        setIsLanguageModelSupported(false);
        const errorMsg =
          "Chrome Prompt API (LanguageModel) is not supported in this browser. Please use Chrome 138+ with the required hardware specifications.";
        setLanguageModelError(errorMsg);
      }
    };

    checkLanguageModelSupport();
  }, []);

  // Check model availability
  const checkAvailability =
    React.useCallback(async (): Promise<AvailabilityStatus> => {
      if (!isSupported) {
        const errorMsg = "Chrome Summarizer API is not supported.";
        setError(errorMsg);
        return null;
      }

      try {
        const availabilityStatus = await (
          self as any
        ).Summarizer.availability();

        if (availabilityStatus === "unavailable") {
          const errorMsg =
            "Summarizer API is not available on this device. Please check hardware requirements.";
          setError(errorMsg);
          setAvailability("unavailable");
          return "unavailable";
        }

        setAvailability(availabilityStatus);
        setError(null);

        if (availabilityStatus === "downloadable") {
          setIsDownloading(true);
          setDownloadProgress(0);
        }

        return availabilityStatus;
      } catch (err) {
        const errorMsg =
          "Failed to check summarizer availability: " + (err as Error).message;
        setError(errorMsg);
        setAvailability(null);
        return null;
      }
    }, [isSupported]);

  // Check Writer model availability
  const checkWriterAvailability =
    React.useCallback(async (): Promise<AvailabilityStatus> => {
      if (!isWriterSupported) {
        const errorMsg = "Chrome Writer API is not supported.";
        setError(errorMsg);
        return null;
      }

      try {
        const availabilityStatus = await (self as any).Writer.availability();

        if (availabilityStatus === "unavailable") {
          const errorMsg =
            "Writer API is not available on this device. Please check hardware requirements.";
          setError(errorMsg);
          setWriterAvailability("unavailable");
          return "unavailable";
        }

        setWriterAvailability(availabilityStatus);
        setError(null);

        if (availabilityStatus === "downloadable") {
          setIsWriterDownloading(true);
          setWriterDownloadProgress(0);
        }

        return availabilityStatus;
      } catch (err) {
        const errorMsg =
          "Failed to check writer availability: " + (err as Error).message;
        setError(errorMsg);
        setWriterAvailability(null);
        return null;
      }
    }, [isWriterSupported]);

  // Automatically check availability when support is confirmed
  React.useEffect(() => {
    if (isSupported === true && !hasCheckedAvailability.current) {
      hasCheckedAvailability.current = true;
      checkAvailability();
    }
  }, [isSupported, checkAvailability]);

  // Check Language Detector model availability
  const checkLanguageDetectorAvailability =
    React.useCallback(async (): Promise<AvailabilityStatus> => {
      if (!isLanguageDetectorSupported) {
        const errorMsg = "Chrome Language Detector API is not supported.";
        setError(errorMsg);
        return null;
      }

      try {
        const availabilityStatus = await (
          self as any
        ).LanguageDetector.availability();

        if (availabilityStatus === "unavailable") {
          const errorMsg =
            "Language Detector API is not available on this device. Please check hardware requirements.";
          setError(errorMsg);
          setLanguageDetectorAvailability("unavailable");
          return "unavailable";
        }

        setLanguageDetectorAvailability(availabilityStatus);
        setError(null);

        if (availabilityStatus === "downloadable") {
          setIsLanguageDetectorDownloading(true);
          setLanguageDetectorDownloadProgress(0);
        }

        return availabilityStatus;
      } catch (err) {
        const errorMsg =
          "Failed to check language detector availability: " +
          (err as Error).message;
        setError(errorMsg);
        setLanguageDetectorAvailability(null);
        return null;
      }
    }, [isLanguageDetectorSupported]);

  // Automatically check writer availability when support is confirmed
  React.useEffect(() => {
    if (isWriterSupported === true && !hasCheckedWriterAvailability.current) {
      hasCheckedWriterAvailability.current = true;
      checkWriterAvailability();
    }
  }, [isWriterSupported, checkWriterAvailability]);

  // Check Rewriter model availability
  const checkRewriterAvailability =
    React.useCallback(async (): Promise<AvailabilityStatus> => {
      if (!isRewriterSupported) {
        const errorMsg = "Chrome Rewriter API is not supported.";
        setError(errorMsg);
        return null;
      }

      try {
        const availabilityStatus = await (self as any).Rewriter.availability();

        if (availabilityStatus === "unavailable") {
          const errorMsg =
            "Rewriter API is not available on this device. Please check hardware requirements.";
          setError(errorMsg);
          setRewriterAvailability("unavailable");
          return "unavailable";
        }

        setRewriterAvailability(availabilityStatus);
        setError(null);

        if (availabilityStatus === "downloadable") {
          setIsRewriterDownloading(true);
          setRewriterDownloadProgress(0);
        }

        return availabilityStatus;
      } catch (err) {
        const errorMsg =
          "Failed to check rewriter availability: " + (err as Error).message;
        setError(errorMsg);
        setRewriterAvailability(null);
        return null;
      }
    }, [isRewriterSupported]);

  // Automatically check rewriter availability when support is confirmed
  React.useEffect(() => {
    if (
      isRewriterSupported === true &&
      !hasCheckedRewriterAvailability.current
    ) {
      hasCheckedRewriterAvailability.current = true;
      checkRewriterAvailability();
    }
  }, [isRewriterSupported, checkRewriterAvailability]);

  // Automatically check language detector availability when support is confirmed
  React.useEffect(() => {
    if (
      isLanguageDetectorSupported === true &&
      !hasCheckedLanguageDetectorAvailability.current
    ) {
      hasCheckedLanguageDetectorAvailability.current = true;
      checkLanguageDetectorAvailability();
    }
  }, [isLanguageDetectorSupported, checkLanguageDetectorAvailability]);

  // Create summarizer instance
  const createSummarizer = React.useCallback(
    async (options?: SummarizerOptions): Promise<any> => {
      if (!isSupported) {
        const errorMsg = "Chrome Summarizer API is not supported.";
        setError(errorMsg);
        return null;
      }

      try {
        const summarizerOptions: SummarizerOptions = {
          ...defaultOptions,
          ...options,
          monitor: (monitor) => {
            // Merge with user-provided monitor if exists
            if (options?.monitor) {
              options.monitor(monitor);
            }

            monitor.addEventListener("downloadprogress", (e: any) => {
              const progress = e.loaded * 100;
              setDownloadProgress(progress);
            });
          },
        };

        const summarizer = await (self as any).Summarizer.create(
          summarizerOptions
        );
        setIsDownloading(false);
        setDownloadProgress(100);
        setError(null);
        return summarizer;
      } catch (err) {
        const errorMsg =
          "Failed to create summarizer: " + (err as Error).message;
        setError(errorMsg);
        setIsDownloading(false);
        return null;
      }
    },
    [isSupported, defaultOptions]
  );

  // Summarize function (batch or streaming)
  const summarize = React.useCallback(
    async (
      text: string,
      options?: SummarizeOptions & {
        streaming?: boolean;
        onChunk?: (chunk: string) => void;
      }
    ): Promise<string> => {
      if (!text.trim()) {
        const errorMsg = "Please enter some text to summarize.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!isSupported) {
        const errorMsg = "Chrome Summarizer API is not supported.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        // Check availability first
        const availabilityStatus = await checkAvailability();
        if (
          availabilityStatus === "unavailable" ||
          availabilityStatus === null
        ) {
          throw new Error("Summarizer is not available.");
        }

        // Create summarizer
        const summarizer = await createSummarizer();
        if (!summarizer) {
          throw new Error("Failed to create summarizer.");
        }

        const summarizeOptions: SummarizeOptions = {
          context:
            options?.context ||
            defaultOptions?.sharedContext ||
            "This text is being summarized for better understanding.",
        };

        // Perform summarization
        if (options?.streaming) {
          const stream = summarizer.summarizeStreaming(text, summarizeOptions);
          let result = "";

          for await (const chunk of stream) {
            result += chunk;
            options?.onChunk?.(result);
          }

          return result;
        } else {
          const result = await summarizer.summarize(text, summarizeOptions);
          return result;
        }
      } catch (err) {
        const errorMsg = (err as Error).message;
        setError(errorMsg);
        throw err;
      }
    },
    [isSupported, checkAvailability, createSummarizer, defaultOptions]
  );

  // Create writer instance
  const createWriter = React.useCallback(
    async (options?: WriterOptions): Promise<any> => {
      if (!isWriterSupported) {
        const errorMsg = "Chrome Writer API is not supported.";
        setError(errorMsg);
        return null;
      }

      try {
        const writerOptions: WriterOptions = {
          ...defaultWriterOptions,
          ...options,
          monitor: (monitor) => {
            // Merge with user-provided monitor if exists
            if (options?.monitor) {
              options.monitor(monitor);
            }

            monitor.addEventListener("downloadprogress", (e: any) => {
              const progress = e.loaded * 100;
              setWriterDownloadProgress(progress);
            });
          },
        };

        const writer = await (self as any).Writer.create(writerOptions);
        setIsWriterDownloading(false);
        setWriterDownloadProgress(100);
        setError(null);
        return writer;
      } catch (err) {
        const errorMsg = "Failed to create writer: " + (err as Error).message;
        setError(errorMsg);
        setIsWriterDownloading(false);
        return null;
      }
    },
    [isWriterSupported, defaultWriterOptions]
  );

  // Write function (batch or streaming)
  const write = React.useCallback(
    async (
      prompt: string,
      options?: WriteOptions & {
        streaming?: boolean;
        onChunk?: (chunk: string) => void;
      }
    ): Promise<string> => {
      if (!prompt.trim()) {
        const errorMsg = "Please enter a prompt to write content.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!isWriterSupported) {
        const errorMsg = "Chrome Writer API is not supported.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        // Check availability first
        const availabilityStatus = await checkWriterAvailability();
        if (
          availabilityStatus === "unavailable" ||
          availabilityStatus === null
        ) {
          throw new Error("Writer is not available.");
        }

        // Create writer
        const writer = await createWriter();
        if (!writer) {
          throw new Error("Failed to create writer.");
        }

        const writeOptions: WriteOptions = {
          context:
            options?.context ||
            defaultWriterOptions?.sharedContext ||
            "Generate helpful and appropriate content.",
        };

        // Perform writing
        if (options?.streaming) {
          const stream = writer.writeStreaming(prompt, writeOptions);
          let result = "";

          for await (const chunk of stream) {
            result += chunk;
            options?.onChunk?.(result);
          }

          return result;
        } else {
          const result = await writer.write(prompt, writeOptions);
          return result;
        }
      } catch (err) {
        const errorMsg = (err as Error).message;
        setError(errorMsg);
        throw err;
      }
    },
    [
      isWriterSupported,
      checkWriterAvailability,
      createWriter,
      defaultWriterOptions,
    ]
  );

  // Create rewriter instance
  const createRewriter = React.useCallback(
    async (options?: RewriterOptions): Promise<any> => {
      if (!isRewriterSupported) {
        const errorMsg = "Chrome Rewriter API is not supported.";
        setError(errorMsg);
        return null;
      }

      try {
        const rewriterOptions: RewriterOptions = {
          ...defaultRewriterOptions,
          ...options,
          monitor: (monitor) => {
            if (options?.monitor) {
              options.monitor(monitor);
            }
            monitor.addEventListener("downloadprogress", (e: any) => {
              const progress = e.loaded * 100;
              setRewriterDownloadProgress(progress);
            });
          },
        };

        const rewriter = await (self as any).Rewriter.create(rewriterOptions);
        setIsRewriterDownloading(false);
        setRewriterDownloadProgress(100);
        setError(null);
        return rewriter;
      } catch (err) {
        const errorMsg = "Failed to create rewriter: " + (err as Error).message;
        setError(errorMsg);
        setIsRewriterDownloading(false);
        return null;
      }
    },
    [isRewriterSupported, defaultRewriterOptions]
  );

  // Rewrite function (batch or streaming)
  const rewrite = React.useCallback(
    async (
      text: string,
      options?: RewriteOptions & {
        streaming?: boolean;
        onChunk?: (chunk: string) => void;
      }
    ): Promise<string> => {
      if (!text.trim()) {
        const errorMsg = "Please enter some text to improve.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!isRewriterSupported) {
        const errorMsg = "Chrome Rewriter API is not supported.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        const availabilityStatus = await checkRewriterAvailability();
        if (
          availabilityStatus === "unavailable" ||
          availabilityStatus === null
        ) {
          throw new Error("Rewriter is not available.");
        }

        const rewriter = await createRewriter();
        if (!rewriter) {
          throw new Error("Failed to create rewriter.");
        }

        const rewriteOptions: RewriteOptions = {
          context:
            options?.context ||
            defaultRewriterOptions?.sharedContext ||
            "Improve clarity and readability without changing meaning.",
          signal: options?.signal,
        };

        if (options?.streaming) {
          const stream = rewriter.rewriteStreaming(text, rewriteOptions);
          let result = "";
          for await (const chunk of stream) {
            result += chunk;
            options?.onChunk?.(result);
          }
          return result;
        } else {
          const result = await rewriter.rewrite(text, rewriteOptions);
          return result;
        }
      } catch (err) {
        const errorMsg = (err as Error).message;
        setError(errorMsg);
        throw err;
      }
    },
    [
      isRewriterSupported,
      checkRewriterAvailability,
      createRewriter,
      defaultRewriterOptions,
    ]
  );

  // Create language detector instance
  const createLanguageDetector = React.useCallback(
    async (options?: LanguageDetectorOptions): Promise<any> => {
      if (!isLanguageDetectorSupported) {
        const errorMsg = "Chrome Language Detector API is not supported.";
        setError(errorMsg);
        return null;
      }

      try {
        const detectorOptions: LanguageDetectorOptions = {
          ...defaultLanguageDetectorOptions,
          ...options,
          monitor: (monitor) => {
            // Merge with user-provided monitor if exists
            if (options?.monitor) {
              options.monitor(monitor);
            }

            monitor.addEventListener("downloadprogress", (e: any) => {
              const progress = e.loaded * 100;
              setLanguageDetectorDownloadProgress(progress);
            });
          },
        };

        const detector = await (self as any).LanguageDetector.create(
          detectorOptions
        );
        setIsLanguageDetectorDownloading(false);
        setLanguageDetectorDownloadProgress(100);
        setError(null);
        return detector;
      } catch (err) {
        const errorMsg =
          "Failed to create language detector: " + (err as Error).message;
        setError(errorMsg);
        setIsLanguageDetectorDownloading(false);
        return null;
      }
    },
    [isLanguageDetectorSupported, defaultLanguageDetectorOptions]
  );

  // Detect language function
  const detectLanguage = React.useCallback(
    async (text: string): Promise<DetectedLanguage[]> => {
      if (!text.trim()) {
        const errorMsg = "Please enter some text to detect language.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!isLanguageDetectorSupported) {
        const errorMsg = "Chrome Language Detector API is not supported.";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        // Check availability first
        const availabilityStatus = await checkLanguageDetectorAvailability();
        if (
          availabilityStatus === "unavailable" ||
          availabilityStatus === null
        ) {
          throw new Error("Language Detector is not available.");
        }

        // Create language detector
        const detector = await createLanguageDetector();
        if (!detector) {
          throw new Error("Failed to create language detector.");
        }

        // Perform language detection
        const results = await detector.detect(text);
        return results;
      } catch (err) {
        const errorMsg = (err as Error).message;
        setError(errorMsg);
        throw err;
      }
    },
    [
      isLanguageDetectorSupported,
      checkLanguageDetectorAvailability,
      createLanguageDetector,
    ]
  );

  // Check LanguageModel availability
  const checkLanguageModelAvailability = React.useCallback(
    async (options?: PromptOptions): Promise<AvailabilityStatus> => {
      if (!isLanguageModelSupported) {
        const errorMsg = "Chrome Prompt API (LanguageModel) is not supported.";
        setLanguageModelError(errorMsg);
        return null;
      }
      try {
        // Always pass the same options to availability() that will be used in prompt()
        const availabilityStatus = await (
          self as any
        ).LanguageModel.availability(options);

        if (availabilityStatus === "unavailable") {
          const errorMsg =
            "Prompt API (LanguageModel) is not available on this device. Please check hardware requirements.";
          setLanguageModelError(errorMsg);
          setLanguageModelAvailability("unavailable");
          return "unavailable";
        }

        setLanguageModelAvailability(availabilityStatus);
        setLanguageModelError(null);
        return availabilityStatus;
      } catch (err) {
        const errorMsg =
          "Failed to check LanguageModel availability: " +
          (err as Error).message;
        setLanguageModelError(errorMsg);
        setLanguageModelAvailability(null);
        return null;
      }
    },
    [isLanguageModelSupported]
  );

  // Automatically check LanguageModel availability when support is confirmed
  React.useEffect(() => {
    if (
      isLanguageModelSupported === true &&
      !hasCheckedLanguageModelAvailability.current
    ) {
      hasCheckedLanguageModelAvailability.current = true;
      checkLanguageModelAvailability();
    }
  }, [isLanguageModelSupported, checkLanguageModelAvailability]);

  // Reset error
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const value: VoiceableContextValue = React.useMemo(
    () => ({
      // Summarizer API
      isSupported,
      isWriterSupported,
      isRewriterSupported,
      isLanguageDetectorSupported,
      availability,
      writerAvailability,
      rewriterAvailability,
      languageDetectorAvailability,
      downloadProgress,
      writerDownloadProgress,
      rewriterDownloadProgress,
      languageDetectorDownloadProgress,
      isDownloading,
      isWriterDownloading,
      isRewriterDownloading,
      isLanguageDetectorDownloading,
      error,
      checkAvailability,
      checkWriterAvailability,
      checkRewriterAvailability,
      checkLanguageDetectorAvailability,
      createSummarizer,
      createWriter,
      createRewriter,
      createLanguageDetector,
      summarize,
      write,
      rewrite,
      detectLanguage,
      resetError,
      // LanguageModel Prompt API
      isLanguageModelSupported,
      languageModelAvailability,
      languageModelError,
      checkLanguageModelAvailability,
    }),
    [
      isSupported,
      isWriterSupported,
      isRewriterSupported,
      isLanguageDetectorSupported,
      availability,
      writerAvailability,
      rewriterAvailability,
      languageDetectorAvailability,
      downloadProgress,
      writerDownloadProgress,
      rewriterDownloadProgress,
      languageDetectorDownloadProgress,
      isDownloading,
      isWriterDownloading,
      isRewriterDownloading,
      isLanguageDetectorDownloading,
      error,
      checkAvailability,
      checkWriterAvailability,
      checkRewriterAvailability,
      checkLanguageDetectorAvailability,
      createSummarizer,
      createWriter,
      createRewriter,
      createLanguageDetector,
      summarize,
      write,
      rewrite,
      detectLanguage,
      resetError,
      isLanguageModelSupported,
      languageModelAvailability,
      languageModelError,
      checkLanguageModelAvailability,
    ]
  );

  return (
    <VoiceableContext.Provider value={value}>
      {children}
      {enableSelectionSummarizer ? (
        // Lazy import to avoid SSR issues if any consumer renders on server
        <SummarizeSelection defaultOptions={defaultOptions} />
      ) : null}
    </VoiceableContext.Provider>
  );
}

// Hook to use Voiceable context
export function useVoiceable(): VoiceableContextValue {
  const context = React.useContext(VoiceableContext);
  if (context === undefined) {
    throw new Error("useVoiceable must be used within a VoiceableProvider");
  }
  return context;
}
