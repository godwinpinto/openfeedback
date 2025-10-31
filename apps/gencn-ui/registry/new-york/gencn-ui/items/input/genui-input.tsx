"use client";
// This component is a wrapper around the Shadcn UI Input component that adds AI capabilities.
import * as React from "react";
import { Sparkles, Wand2, Languages, Repeat2, SpellCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  type DetectedLanguage,
  type RewriterOptions,
} from "@/registry/new-york/gencn-ui/items/shared/genui-types";
import { proofreadOnce } from "@/registry/new-york/gencn-ui/items/shared/lib/proofreader";
import { ensureTranslator } from "@/registry/new-york/gencn-ui/items/shared/lib/translator";
import {
  isWriterSupported as svcIsWriterSupported,
  checkWriterAvailability as svcCheckWriterAvailability,
  ensureWriter as svcEnsureWriter,
} from "@/registry/new-york/gencn-ui/items/shared/lib/writer";
import {
  isRewriterSupported as svcIsRewriterSupported,
  checkRewriterAvailability as svcCheckRewriterAvailability,
  ensureRewriter as svcEnsureRewriter,
} from "@/registry/new-york/gencn-ui/items/shared/lib/rewriter";
import { detectLanguages } from "@/registry/new-york/gencn-ui/items/shared/lib/language-detector";

export type ButtonVisibility = "ALWAYS" | "ON_FOCUS";

export interface GenUIInputProps extends React.ComponentProps<"input"> {
  buttonVisibility?: ButtonVisibility;
  buttonContent?: React.ReactNode;
  containerClassName?: string;
  buttonClassName?: string;

  features?: Array<
    "compose" | "improve" | "fix-grammar" | "translate" | "auto-suggest"
  >;
  translateTargets?: string[];
  translateLanguageMap?: Record<string, string>;
  placeholderPrompt?: string;
  writerOptions?: {
    tone?: "formal" | "neutral" | "casual";
    format?: "markdown" | "plain-text";
    length?: "short" | "medium" | "long";
    sharedContext?: string;
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
  };
  autoSuggestDebounceMs?: number;
  autoSuggestMinChars?: number;
  autoSuggestPrompt?: string;
  onAccept?: (text: string) => void;
  onAIError?: (error: Error) => void;
}

export const GenUIInput = React.forwardRef<HTMLInputElement, GenUIInputProps>(
  (
    {
      buttonVisibility = "ALWAYS",
      buttonContent,
      containerClassName,
      buttonClassName,
      className,
      onFocus,
      onBlur,
      features,
      translateTargets,
      translateLanguageMap,
      placeholderPrompt,
      writerOptions,
      autoSuggestDebounceMs = 500,
      autoSuggestMinChars = 3,
      autoSuggestPrompt,
      onAccept,
      onAIError,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-suggest state
    const [suggestions, setSuggestions] = React.useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = React.useState<number>(-1);
    const [isLoadingSuggestions, setIsLoadingSuggestions] =
      React.useState(false);
    const suggestTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const suggestAbortRef = React.useRef<AbortController | null>(null);
    const autoSuggestRewriterRef = React.useRef<any>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const autoSuggestActive = features?.includes("auto-suggest") ?? false;

    // AI Feature UI state
    const [isFeatureOpen, setIsFeatureOpen] = React.useState(false);
    const [activeFeature, setActiveFeature] = React.useState<
      "compose" | "improve" | "fix-grammar" | "translate" | null
    >(null);
    const [phase, setPhase] = React.useState<
      "prompt" | "generating" | "result"
    >("prompt");
    const [promptText, setPromptText] = React.useState("");
    const [resultText, setResultText] = React.useState("");
    const [aiError, setAiError] = React.useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = React.useState<
      number | null
    >(null);
    const [detected, setDetected] = React.useState<DetectedLanguage[] | null>(
      null
    );
    const [selectedTarget, setSelectedTarget] = React.useState<string>("");
    const abortRef = React.useRef<AbortController | null>(null);
    const writerRef = React.useRef<any>(null);
    const rewriterRef = React.useRef<any>(null);

    const isWriterSupported = svcIsWriterSupported();
    const isRewriterSupported = svcIsRewriterSupported();

    React.useImperativeHandle(
      ref,
      () => inputRef.current as HTMLInputElement,
      []
    );

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        // Delay clearing suggestions to allow clicking on them
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (
            containerRef.current &&
            !containerRef.current.contains(activeElement)
          ) {
            setSuggestions([]);
            setSelectedIndex(-1);
          }
        }, 200);
        onBlur?.(e);
      },
      [onBlur]
    );

    const ensureWriter = React.useCallback(async () => {
      try {
        if (!isWriterSupported) {
          throw new Error("Chrome Writer API is not supported.");
        }
        const avail = await svcCheckWriterAvailability();
        if (avail === "unavailable" || avail === null) {
          throw new Error("Writer API is unavailable on this device.");
        }
        const options = {
          ...(writerOptions ?? {}),
          monitor: (m: any) => {
            m?.addEventListener?.("downloadprogress", (e: any) => {
              if (typeof e.loaded === "number") {
                setDownloadProgress(Math.round(e.loaded * 100));
              }
            });
          },
        };
        writerRef.current = await svcEnsureWriter(options as any);
        return writerRef.current;
      } catch (err) {
        setAiError((err as Error).message);
        onAIError?.(err as Error);
        return null;
      }
    }, [isWriterSupported, writerOptions, onAIError]);

    const startComposeStreaming = React.useCallback(async () => {
      setAiError(null);
      setResultText("");
      setPhase("generating");
      setIsLoading(true);
      try {
        const writer = writerRef.current ?? (await ensureWriter());
        if (!writer) {
          setIsLoading(false);
          setPhase("prompt");
          return;
        }
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const stream = writer.writeStreaming(promptText, {
          signal: abortRef.current.signal,
          context: writerOptions?.sharedContext,
        });
        let acc = "";
        for await (const chunk of stream) {
          acc += chunk;
          setResultText(acc);
        }
        setPhase("result");
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          const msg = (err as Error).message;
          setAiError(msg);
          onAIError?.(err as Error);
          setPhase("prompt");
        }
      } finally {
        setIsLoading(false);
      }
    }, [ensureWriter, promptText, writerOptions, onAIError]);

    const closeFeature = React.useCallback(() => {
      abortRef.current?.abort();
      abortRef.current = null;
      setIsFeatureOpen(false);
      setActiveFeature(null);
      setPhase("prompt");
      setPromptText("");
      setResultText("");
      setAiError(null);
      setDownloadProgress(null);
      setDetected(null);
    }, []);

    // Improve controls state
    const [tone, setTone] = React.useState<
      "more-formal" | "as-is" | "more-casual"
    >("as-is");
    const [lengthPref, setLengthPref] = React.useState<
      "shorter" | "as-is" | "longer"
    >("as-is");
    const [formatPref, setFormatPref] = React.useState<
      "as-is" | "markdown" | "plain-text"
    >("plain-text");
    const [contextText, setContextText] = React.useState("");

    const ensureRewriter = React.useCallback(async () => {
      try {
        if (!isRewriterSupported) {
          throw new Error("Chrome Rewriter API is not supported.");
        }
        const avail = await svcCheckRewriterAvailability();
        if (avail === "unavailable" || avail === null) {
          throw new Error("Rewriter API is unavailable on this device.");
        }
        const options: RewriterOptions = {
          tone,
          length: lengthPref,
          format: formatPref,
          monitor: (m: any) => {
            m?.addEventListener?.("downloadprogress", (e: any) => {
              if (typeof e.loaded === "number") {
                setDownloadProgress(Math.round(e.loaded * 100));
              }
            });
          },
        };
        rewriterRef.current = await svcEnsureRewriter(options as any);
        return rewriterRef.current;
      } catch (err) {
        setAiError((err as Error).message);
        onAIError?.(err as Error);
        return null;
      }
    }, [isRewriterSupported, tone, lengthPref, formatPref, onAIError]);

    const startImprove = React.useCallback(async () => {
      setAiError(null);
      setResultText("");
      setPhase("generating");
      setIsLoading(true);
      try {
        const text = inputRef.current?.value || "";
        if (!text.trim()) {
          throw new Error("Please enter some text to improve.");
        }
        const rewriter = rewriterRef.current ?? (await ensureRewriter());
        if (!rewriter) {
          setIsLoading(false);
          setPhase("prompt");
          return;
        }
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        if (typeof rewriter.rewriteStreaming === "function") {
          const stream = rewriter.rewriteStreaming(text, {
            signal: abortRef.current.signal,
            context: contextText || undefined,
          });
          let acc = "";
          for await (const chunk of stream) {
            acc += chunk;
            setResultText(acc);
          }
          setPhase("result");
        } else {
          const result = await rewriter.rewrite(text, {
            signal: abortRef.current.signal,
            context: contextText || undefined,
          });
          setResultText(result);
          setPhase("result");
        }
      } catch (err) {
        if ((err as any)?.name === "AbortError") {
          // ignore aborts
        } else {
          const msg = (err as Error).message;
          setAiError(msg);
          onAIError?.(err as Error);
          setPhase("prompt");
        }
      } finally {
        setIsLoading(false);
      }
    }, [ensureRewriter, contextText, onAIError]);

    React.useEffect(() => {
      return () => {
        abortRef.current?.abort();
        try {
          writerRef.current?.destroy?.();
        } catch {}
      };
    }, []);

    const openCompose = React.useCallback(() => {
      setActiveFeature("compose");
      setIsFeatureOpen(true);
      setPhase("prompt");
      setPromptText("");
      setResultText("");
      setAiError(null);
    }, []);

    const openImprove = React.useCallback(() => {
      setActiveFeature("improve");
      setIsFeatureOpen(true);
      setPhase("prompt");
      setResultText("");
      setAiError(null);
      setDownloadProgress(null);
    }, []);

    const openFixGrammar = React.useCallback(() => {
      setActiveFeature("fix-grammar");
      setIsFeatureOpen(true);
      setPhase("generating");
      setResultText("");
      setAiError(null);
      setDownloadProgress(null);
      setDetected(null);
    }, []);

    const openTranslate = React.useCallback(async () => {
      setActiveFeature("translate");
      setIsFeatureOpen(true);
      setPhase("prompt");
      setResultText("");
      setAiError(null);
      setDownloadProgress(null);
      
      // Detect language when modal opens
      const text = inputRef.current?.value || "";
      let detectedSource: string | null = null;
      if (text.trim()) {
        try {
          const detectedLangs = await detectLanguages(text);
          setDetected(detectedLangs);
          if (detectedLangs && detectedLangs.length > 0) {
            detectedSource = detectedLangs[0].detectedLanguage;
          }
        } catch {
          setDetected(null);
        }
      } else {
        setDetected(null);
      }
      
      // Preselect first provided target that is not the detected source language
      const availableTargets = translateTargets?.filter((code: string) => {
        return !detectedSource || code !== detectedSource;
      }) || [];
      setSelectedTarget(availableTargets[0] || "");
    }, [translateTargets]);

    const startTranslate = React.useCallback(async () => {
      setAiError(null);
      setResultText("");
      setPhase("generating");
      setIsLoading(true);
      try {
        const text = inputRef.current?.value || "";
        if (!text.trim())
          throw new Error("Please enter some text to translate.");
        if (!selectedTarget)
          throw new Error("Please select a target language.");
        const detectedLangs = await detectLanguages(text);
        setDetected(detectedLangs);
        const sourceLanguage =
          detectedLangs && detectedLangs.length > 0
            ? detectedLangs[0].detectedLanguage
            : "en";
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const translator = await ensureTranslator({
          sourceLanguage,
          targetLanguage: selectedTarget,
          monitor(m: any) {
            try {
              m.addEventListener("downloadprogress", (e: any) => {
                if (typeof e.loaded === "number")
                  setDownloadProgress(Math.round(e.loaded * 100));
              });
            } catch {}
          },
        } as any);
        if (typeof (translator as any).translateStreaming === "function") {
          const stream = (translator as any).translateStreaming(text, {
            signal: abortRef.current.signal,
          });
          let acc = "";
          for await (const chunk of stream) {
            acc += chunk;
            setResultText(acc);
          }
          setPhase("result");
        } else {
          const result = await (translator as any).translate(text);
          setResultText(result);
          setPhase("result");
        }
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          const msg = (err as Error).message;
          setAiError(msg);
          setPhase("result");
        }
      } finally {
        setIsLoading(false);
      }
    }, [selectedTarget]);

    const startFixGrammar = React.useCallback(async () => {
      setAiError(null);
      setIsLoading(true);
      try {
        const text = inputRef.current?.value || "";
        if (!text.trim())
          throw new Error("Please enter some text to fix grammar.");
        const detectedLangs = await detectLanguages(text);
        setDetected(detectedLangs);
        const topLanguage =
          detectedLangs && detectedLangs.length > 0
            ? detectedLangs[0].detectedLanguage
            : "en";
        const res = await proofreadOnce(text, {
          expectedInputLanguages: [topLanguage],
          onProgress: (p) => setDownloadProgress(p),
        });
        setResultText(res.corrected);
        setPhase("result");
      } catch (err) {
        const msg = (err as Error).message;
        setAiError(msg);
        setPhase("result");
      } finally {
        setIsLoading(false);
      }
    }, []);

    React.useEffect(() => {
      if (
        isFeatureOpen &&
        activeFeature === "fix-grammar" &&
        phase === "generating" &&
        !resultText
      ) {
        startFixGrammar();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFeatureOpen, activeFeature, phase]);

    const acceptResult = React.useCallback(() => {
      if (inputRef.current) {
        inputRef.current.value = resultText;
        const event = new Event("input", { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
      onAccept?.(resultText);
      closeFeature();
    }, [resultText, onAccept, closeFeature]);

    const regen = React.useCallback(() => {
      setPhase("prompt");
      setResultText("");
      setAiError(null);
    }, []);

    const handleStop = React.useCallback(() => {
      abortRef.current?.abort();
      setIsLoading(false);
      setPhase("result");
    }, []);

    // Clear suggestions helper
    const clearSuggestions = React.useCallback(() => {
      setSuggestions([]);
      setSelectedIndex(-1);
      setIsLoadingSuggestions(false);
      suggestAbortRef.current?.abort();
      suggestAbortRef.current = null;
      if (suggestTimeoutRef.current) {
        clearTimeout(suggestTimeoutRef.current);
        suggestTimeoutRef.current = null;
      }
    }, []);

    // Ensure rewriter for auto-suggest
    const ensureAutoSuggestRewriter = React.useCallback(async () => {
      try {
        if (!isRewriterSupported) {
          return null;
        }
        if (autoSuggestRewriterRef.current) {
          return autoSuggestRewriterRef.current;
        }
        const rewriter = await svcEnsureRewriter({
          tone: "as-is",
          length: "as-is",
          format: "plain-text",
        });
        autoSuggestRewriterRef.current = rewriter;
        return rewriter;
      } catch (err) {
        console.error("Failed to initialize auto-suggest rewriter:", err);
        return null;
      }
    }, [isRewriterSupported]);

    // Generate suggestions with uniqueness checking
    const generateSuggestions = React.useCallback(
      async (text: string) => {
        if (
          !autoSuggestActive ||
          !text.trim() ||
          text.trim().length < autoSuggestMinChars
        ) {
          clearSuggestions();
          return;
        }

        // Debounce: cancel prior
        if (suggestTimeoutRef.current) {
          clearTimeout(suggestTimeoutRef.current);
        }

        suggestTimeoutRef.current = setTimeout(async () => {
          try {
            setIsLoadingSuggestions(true);
            suggestAbortRef.current?.abort();
            suggestAbortRef.current = new AbortController();

            const rewriter = await ensureAutoSuggestRewriter();
            if (!rewriter) {
              clearSuggestions();
              return;
            }

            // Use provided prompt or default
            const prompt =
              autoSuggestPrompt ||
              "Continue from the caret as an autocomplete. Do not change or repeat any existing user text before the caret. If you must return the full text, ensure it begins with the original text exactly and then adds only the natural continuation. No quotes or prefaces. Keep it coherent and concise (about 8–12 words).";

            // Start with empty suggestions array
            setSuggestions([]);
            setSelectedIndex(-1);

            // Track completion count
            let completedCount = 0;
            const totalSuggestions = 3;

            // Generate 3 variants in parallel, show them as they arrive
            [0, 1, 2].forEach(async (index) => {
              try {
                let result: string | null = null;

                if (typeof rewriter.rewrite === "function") {
                  result = (await rewriter.rewrite(text, {
                    context: prompt,
                    signal: suggestAbortRef.current?.signal,
                  })) as string;
                } else if (typeof rewriter.rewriteStreaming === "function") {
                  let acc = "";
                  const stream = rewriter.rewriteStreaming(text, {
                    context: prompt,
                    signal: suggestAbortRef.current?.signal,
                  });
                  for await (const chunk of stream) {
                    acc += chunk;
                  }
                  result = acc;
                }

                // Check if request was aborted
                if (suggestAbortRef.current?.signal.aborted) {
                  return;
                }

                // Update suggestions as each one arrives
                if (result && result.trim().length > 0) {
                  setSuggestions((prev) => {
                    // Append the new suggestion to the array
                    const newSuggestions = [...prev, result!];
                    // Limit to 3 suggestions max
                    return newSuggestions.slice(0, 3);
                  });
                }

                // Update loading state
                completedCount++;
                // Stop loading when all 3 are complete
                if (completedCount >= totalSuggestions) {
                  setIsLoadingSuggestions(false);
                }
              } catch (err) {
                if ((err as any)?.name === "AbortError") {
                  return;
                }
                console.error(`Error generating suggestion ${index + 1}:`, err);

                // Update completion count even on error
                completedCount++;
                // Stop loading when all are complete
                if (completedCount >= totalSuggestions) {
                  setIsLoadingSuggestions(false);
                }
              }
            });
          } catch (err) {
            if ((err as any)?.name !== "AbortError") {
              // Silent fail for auto-suggest
              console.error("Auto-suggest error:", err);
            }
            clearSuggestions();
          }
        }, autoSuggestDebounceMs);
      },
      [
        autoSuggestActive,
        autoSuggestMinChars,
        autoSuggestDebounceMs,
        autoSuggestPrompt,
        ensureAutoSuggestRewriter,
        clearSuggestions,
      ]
    );

    // Apply selected suggestion
    const applySuggestion = React.useCallback(
      (suggestion: string) => {
        if (inputRef.current) {
          inputRef.current.value = suggestion;
          const event = new Event("input", { bubbles: true });
          inputRef.current.dispatchEvent(event);
        }
        clearSuggestions();
        inputRef.current?.focus();
      },
      [clearSuggestions]
    );

    // Handle input changes
    const handleInput = React.useCallback(
      (e: React.FormEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;
        if (autoSuggestActive) {
          generateSuggestions(value);
        }
        props.onInput?.(e);
      },
      [autoSuggestActive, generateSuggestions, props]
    );

    // Handle keyboard navigation
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!autoSuggestActive || suggestions.length === 0) {
          props.onKeyDown?.(e);
          return;
        }

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        } else if (
          e.key === "Enter" &&
          selectedIndex >= 0 &&
          selectedIndex < suggestions.length
        ) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex]);
        } else if (e.key === "Escape") {
          e.preventDefault();
          clearSuggestions();
        } else {
          props.onKeyDown?.(e);
        }
      },
      [
        autoSuggestActive,
        suggestions,
        selectedIndex,
        applySuggestion,
        clearSuggestions,
        props,
      ]
    );

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        clearSuggestions();
        try {
          autoSuggestRewriterRef.current?.destroy?.();
        } catch {}
        autoSuggestRewriterRef.current = null;
      };
    }, [clearSuggestions]);

    const featureIcon = React.useMemo(() => {
      if (!activeFeature && (features?.length ?? 0) === 1) {
        const f = features![0];
        if (f === "compose") return <Wand2 className="size-4" />;
        if (f === "translate") return <Languages className="size-4" />;
        if (f === "improve" || f === "fix-grammar")
          return <Repeat2 className="size-4" />;
      }
      return <Wand2 className="size-4" />;
    }, [activeFeature, features]);

    const shouldShowButton =
      buttonVisibility === "ALWAYS" ||
      (buttonVisibility === "ON_FOCUS" && isFocused);
    const defaultButtonContent = buttonContent ?? (
      <Sparkles className="size-4" />
    );
    const buttonContentWithLoading = isLoading ? (
      <Spinner className="size-4" />
    ) : (
      defaultButtonContent
    );
    const hasFeatureUI = Array.isArray(features) && features.length > 0;
    const showSuggestions =
      autoSuggestActive && (suggestions.length > 0 || isLoadingSuggestions);

    return (
      <div ref={containerRef} className={cn("relative", containerClassName)}>
        <Popover
          open={showSuggestions}
          onOpenChange={(open) => {
            if (!open) {
              clearSuggestions();
            }
          }}
        >
          <PopoverAnchor asChild>
            <Input
              ref={inputRef}
              className={cn(
                className,
                shouldShowButton && hasFeatureUI && "pr-12"
              )}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              {...props}
            />
          </PopoverAnchor>

          {/* Auto-suggest dropdown */}
          {showSuggestions && (
            <PopoverContent
              side="bottom"
              align="start"
              className="w-[var(--radix-popover-trigger-width)] p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command
                shouldFilter={false}
                value={
                  selectedIndex >= 0 && selectedIndex < suggestions.length
                    ? suggestions[selectedIndex]
                    : undefined
                }
              >
                <CommandList className="max-h-none">
                  {isLoadingSuggestions ? (
                    <CommandEmpty>
                      <div className="flex items-center justify-center py-4">
                        <Spinner className="size-4 mr-2" />
                        <span className="text-sm text-muted-foreground">
                          Generating suggestions...
                        </span>
                      </div>
                    </CommandEmpty>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={index}
                        value={suggestion}
                        onSelect={() => applySuggestion(suggestion)}
                        className={cn(
                          "cursor-pointer",
                          selectedIndex === index && "bg-accent"
                        )}
                        data-selected={selectedIndex === index}
                      >
                        <span className="text-sm">{suggestion}</span>
                      </CommandItem>
                    ))
                  ) : null}
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>

        {shouldShowButton &&
          hasFeatureUI &&
          (features!.length === 1 ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (features![0] === "compose") {
                  openCompose();
                } else if (features![0] === "improve") {
                  openImprove();
                } else if (features![0] === "fix-grammar") {
                  openFixGrammar();
                } else if (features![0] === "translate") {
                  openTranslate();
                }
              }}
              disabled={isLoading}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md shadow-sm hover:bg-accent/80 transition-opacity z-10",
                isLoading && "cursor-wait",
                buttonClassName
              )}
              aria-label="AI actions"
            >
              {isLoading ? <Spinner className="size-4" /> : featureIcon}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isLoading}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md shadow-sm hover:bg-accent/80 transition-opacity z-10",
                    isLoading && "cursor-wait",
                    buttonClassName
                  )}
                  aria-label="Choose AI action"
                >
                  {isLoading ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Wand2 className="size-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                {features!.includes("compose") && (
                  <DropdownMenuItem onClick={openCompose}>
                    <Wand2 className="mr-2 h-4 w-4" /> Compose
                  </DropdownMenuItem>
                )}
                {features!.includes("improve") && (
                  <DropdownMenuItem onClick={openImprove}>
                    <Repeat2 className="mr-2 h-4 w-4" /> Improve
                  </DropdownMenuItem>
                )}
                {features!.includes("fix-grammar") && (
                  <DropdownMenuItem onClick={openFixGrammar}>
                    <SpellCheck className="mr-2 h-4 w-4" /> Fix grammar
                  </DropdownMenuItem>
                )}
                {features!.includes("translate") && (
                  <DropdownMenuItem onClick={openTranslate}>
                    <Languages className="mr-2 h-4 w-4" /> Translate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

        {/* Compose Modal */}
        <Dialog
          open={isFeatureOpen && activeFeature === "compose"}
          onOpenChange={(open) => {
            if (!open) closeFeature();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Compose with AI</DialogTitle>
            </DialogHeader>

            {aiError && (
              <Alert variant="destructive" className="mb-2">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}

            {downloadProgress !== null && downloadProgress < 100 && (
              <div className="text-xs text-muted-foreground">
                Model downloading… {downloadProgress}%
              </div>
            )}

            {phase === "prompt" && (
              <div className="space-y-3">
                <Input
                  placeholder={placeholderPrompt || "describe what you want"}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                />
              </div>
            )}

            {phase === "generating" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Generating…
                </div>
                {resultText && (
                  <Textarea
                    value={resultText}
                    readOnly
                    className="min-h-[160px]"
                  />
                )}
              </div>
            )}

            {phase === "result" && (
              <div className="space-y-3">
                <Textarea
                  value={resultText}
                  readOnly
                  className="min-h-[200px]"
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              {phase === "prompt" && (
                <Button
                  onClick={startComposeStreaming}
                  disabled={!promptText.trim() || isLoading}
                >
                  {isLoading ? <Spinner className="mr-2 size-4" /> : null}
                  Generate
                </Button>
              )}
              {phase === "generating" && (
                <Button variant="outline" onClick={handleStop}>
                  Stop
                </Button>
              )}
              {phase === "result" && (
                <>
                  <Button variant="outline" onClick={regen}>
                    Regenerate
                  </Button>
                  {typeof resultText === "string" &&
                    resultText.trim().length > 0 && (
                      <Button onClick={acceptResult}>Accept</Button>
                    )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Fix Grammar Modal */}
        <Dialog
          open={isFeatureOpen && activeFeature === "fix-grammar"}
          onOpenChange={(open: boolean) => {
            if (!open) closeFeature();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Fix grammar</DialogTitle>
            </DialogHeader>

            {aiError && (
              <Alert variant="destructive" className="mb-2">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}

            {detected && detected.length > 0 && (
              <div className="mb-2 text-xs text-muted-foreground">
                Detected: {detected.map((d) => d.detectedLanguage).join(", ")}
              </div>
            )}

            {downloadProgress !== null && downloadProgress < 100 && (
              <div className="text-xs text-muted-foreground">
                Model downloading… {downloadProgress}%
              </div>
            )}

            {phase === "generating" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Fixing grammar…
                </div>
                {resultText && (
                  <Textarea
                    value={resultText}
                    readOnly
                    className="min-h-[160px]"
                  />
                )}
              </div>
            )}

            {phase === "result" && (
              <div className="space-y-3">
                <Textarea
                  value={resultText}
                  readOnly
                  className="min-h-[200px]"
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              {phase === "generating" && (
                <Button variant="outline" onClick={handleStop}>
                  Stop
                </Button>
              )}
              {phase === "result" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiError(null);
                      setPhase("generating");
                      (async () => {
                        try {
                          const text = inputRef.current?.value || "";
                          const top =
                            detected && detected.length > 0
                              ? detected[0].detectedLanguage
                              : "en";
                          const res = await proofreadOnce(text, {
                            expectedInputLanguages: [top],
                            onProgress: (p) => setDownloadProgress(p),
                          });
                          setResultText(res.corrected);
                          setPhase("result");
                        } catch (err) {
                          const msg = (err as Error).message;
                          setAiError(msg);
                          setPhase("result");
                        }
                      })();
                    }}
                  >
                    Regenerate
                  </Button>
                  {typeof resultText === "string" &&
                    resultText.trim().length > 0 && (
                      <Button onClick={acceptResult}>Accept</Button>
                    )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Improve Modal */}
        <Dialog
          open={isFeatureOpen && activeFeature === "improve"}
          onOpenChange={(open: boolean) => {
            if (!open) closeFeature();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Improve writing</DialogTitle>
            </DialogHeader>

            {aiError && (
              <Alert variant="destructive" className="mb-2">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}

            {downloadProgress !== null && downloadProgress < 100 && (
              <div className="text-xs text-muted-foreground">
                Model downloading… {downloadProgress}%
              </div>
            )}

            {phase === "prompt" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="as-is">Tone: As-is</SelectItem>
                      <SelectItem value="more-formal">
                        Tone: More formal
                      </SelectItem>
                      <SelectItem value="more-casual">
                        Tone: More casual
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={lengthPref}
                    onValueChange={(v) => setLengthPref(v as any)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="as-is">Length: As-is</SelectItem>
                      <SelectItem value="shorter">Length: Shorter</SelectItem>
                      <SelectItem value="longer">Length: Longer</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={formatPref}
                    onValueChange={(v) => setFormatPref(v as any)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plain-text">
                        Format: Plain text
                      </SelectItem>
                      <SelectItem value="markdown">Format: Markdown</SelectItem>
                      <SelectItem value="as-is">Format: As-is</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Optional context (e.g., audience or constraints)"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                />
              </div>
            )}

            {phase === "generating" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Improving…
                </div>
                {resultText && (
                  <Textarea
                    value={resultText}
                    readOnly
                    className="min-h-[160px]"
                  />
                )}
              </div>
            )}

            {phase === "result" && (
              <div className="space-y-3">
                <Textarea
                  value={resultText}
                  readOnly
                  className="min-h-[200px]"
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              {phase === "prompt" && (
                <Button onClick={startImprove} disabled={isLoading}>
                  {isLoading ? <Spinner className="mr-2 size-4" /> : null}
                  Generate
                </Button>
              )}
              {phase === "generating" && (
                <Button variant="outline" onClick={handleStop}>
                  Stop
                </Button>
              )}
              {phase === "result" && (
                <>
                  <Button variant="outline" onClick={regen}>
                    Regenerate
                  </Button>
                  {typeof resultText === "string" &&
                    resultText.trim().length > 0 && (
                      <Button onClick={acceptResult}>Accept</Button>
                    )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Translate Modal */}
        <Dialog
          open={isFeatureOpen && activeFeature === "translate"}
          onOpenChange={(open) => {
            if (!open) closeFeature();
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Translate</DialogTitle>
            </DialogHeader>

            {aiError && (
              <Alert variant="destructive" className="mb-2">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}

            {detected && detected.length > 0 && (
              <div className="mb-2 text-xs text-muted-foreground">
                Detected source: {detected[0].detectedLanguage}
              </div>
            )}

            {downloadProgress !== null && downloadProgress < 100 && (
              <div className="text-xs text-muted-foreground">
                Model downloading… {downloadProgress}%
              </div>
            )}

            {phase === "prompt" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Select
                    value={selectedTarget}
                    onValueChange={(v) => setSelectedTarget(v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select target language" />
                    </SelectTrigger>
                    <SelectContent>
                      {translateTargets
                        ?.filter((code: string) => {
                          // Exclude detected source language from target options
                          if (detected && detected.length > 0) {
                            return code !== detected[0].detectedLanguage;
                          }
                          return true;
                        })
                        .map((code: string) => (
                          <SelectItem key={code} value={code}>
                            {translateLanguageMap?.[code] || code}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {phase === "generating" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Translating…
                </div>
                {resultText && (
                  <Textarea
                    value={resultText}
                    readOnly
                    className="min-h-[160px]"
                  />
                )}
              </div>
            )}

            {phase === "result" && (
              <div className="space-y-3">
                <Textarea
                  value={resultText}
                  readOnly
                  className="min-h-[200px]"
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              {phase === "prompt" && (
                <Button
                  onClick={startTranslate}
                  disabled={!selectedTarget || isLoading}
                >
                  {isLoading ? <Spinner className="mr-2 size-4" /> : null}
                  Translate
                </Button>
              )}
              {phase === "generating" && (
                <Button variant="outline" onClick={handleStop}>
                  Stop
                </Button>
              )}
              {phase === "result" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPhase("prompt");
                      setResultText("");
                      setAiError(null);
                    }}
                  >
                    Regenerate
                  </Button>
                  {typeof resultText === "string" &&
                    resultText.trim().length > 0 && (
                      <Button onClick={acceptResult}>Accept</Button>
                    )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

GenUIInput.displayName = "GenUIInput";

// Local state for Improve controls
function useImproveControls() {
  const [tone, setTone] = React.useState<
    "more-formal" | "as-is" | "more-casual"
  >("as-is");
  const [lengthPref, setLengthPref] = React.useState<
    "shorter" | "as-is" | "longer"
  >("as-is");
  const [formatPref, setFormatPref] = React.useState<
    "as-is" | "markdown" | "plain-text"
  >("plain-text");
  const [contextText, setContextText] = React.useState("");
  return {
    tone,
    setTone,
    lengthPref,
    setLengthPref,
    formatPref,
    setFormatPref,
    contextText,
    setContextText,
  };
}

function startImproveFactory(
  rewriterRef: React.MutableRefObject<any>,
  ensureRewriter: () => Promise<any | null>,
  setIsLoading: (b: boolean) => void,
  setAiError: (s: string | null) => void,
  setResultText: (s: string) => void,
  setPhase: (p: "prompt" | "generating" | "result") => void,
  inputRef: React.RefObject<HTMLInputElement>,
  contextText: string,
  onAIError?: (e: Error) => void
) {
  return async function startImprove() {
    setAiError(null);
    setResultText("");
    setPhase("generating");
    setIsLoading(true);
    try {
      const text = inputRef.current?.value || "";
      if (!text.trim()) throw new Error("Please enter some text to improve.");
      const rewriter = rewriterRef.current ?? (await ensureRewriter());
      if (!rewriter) {
        setIsLoading(false);
        setPhase("prompt");
        return;
      }
      let result = "";
      if (typeof rewriter.rewrite === "function") {
        result = await rewriter.rewrite(text, {
          context: contextText || undefined,
        });
      } else if (typeof rewriter.rewriteStreaming === "function") {
        let acc = "";
        for await (const chunk of rewriter.rewriteStreaming(text, {
          context: contextText || undefined,
        })) {
          acc += chunk;
        }
        result = acc;
      }
      setResultText(result);
      setPhase("result");
    } catch (err) {
      const msg = (err as Error).message;
      setAiError(msg);
      onAIError?.(err as Error);
      setPhase("prompt");
    } finally {
      setIsLoading(false);
    }
  };
}
