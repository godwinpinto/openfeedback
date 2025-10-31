'use client';

import * as React from 'react';
import { Sparkles, Wand2, Languages, Repeat2, SpellCheck } from 'lucide-react';
import {
  Textarea,
} from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { type SummarizerOptions, type DetectedLanguage, type RewriterOptions } from '@/registry/new-york/gencn-ui/items/shared/genui-types';
import { proofreadOnce } from '@/registry/new-york/gencn-ui/items/shared/lib/proofreader';
import { isSummarizerSupported, checkSummarizerAvailability, ensureSummarizer } from '@/registry/new-york/gencn-ui/items/shared/lib/summarizer';
import { isWriterSupported as svcIsWriterSupported, checkWriterAvailability as svcCheckWriterAvailability, ensureWriter as svcEnsureWriter } from '@/registry/new-york/gencn-ui/items/shared/lib/writer';
import { isRewriterSupported as svcIsRewriterSupported, checkRewriterAvailability as svcCheckRewriterAvailability, ensureRewriter as svcEnsureRewriter } from '@/registry/new-york/gencn-ui/items/shared/lib/rewriter';
import { detectLanguages } from '@/registry/new-york/gencn-ui/items/shared/lib/language-detector';
import { ensureTranslator } from '@/registry/new-york/gencn-ui/items/shared/lib/translator';
import { Input } from '@/components/ui/input';

export type ButtonVisibility = 'ALWAYS' | 'ON_FOCUS';

export interface GenUITextareaProps extends React.ComponentProps<'textarea'> {
  /**
   * Controls when the summarize button is visible
   * - ALWAYS: Button is always visible
   * - ON_FOCUS: Button only appears when the textarea is focused
   */
  buttonVisibility?: ButtonVisibility;
  
  /**
   * Custom content for the summarize button (JSX)
   * If not provided, defaults to a Sparkles icon
   */
  buttonContent?: React.ReactNode;
  
  /**
   * Callback function when the summarize button is clicked
   * Called after summarization completes with both the original text and summary
   */
  onSummarize?: (text: string, summary?: string) => void;
  
  /**
   * Summary type for Chrome AI
   */
  summaryType?: 'key-points' | 'tldr' | 'teaser' | 'headline';
  
  /**
   * Summary length for Chrome AI
   */
  summaryLength?: 'short' | 'medium' | 'long';
  
  /**
   * Summary format for Chrome AI
   */
  summaryFormat?: 'markdown' | 'plain-text';
  
  /**
   * Enable streaming for Chrome AI summarization
   */
  enableStreaming?: boolean;
  
  /**
   * Shared context for Chrome AI summarization
   */
  sharedContext?: string;
  
  /**
   * Callback when summary is generated
   */
  onSummaryGenerated?: (summary: string) => void;
  
  /**
   * Callback when summarization error occurs
   */
  onSummaryError?: (error: string) => void;
  
  /**
   * Additional className for the wrapper container
   */
  containerClassName?: string;
  
  /**
   * Additional className for the button
   */
  buttonClassName?: string;

  /**
  * AI Features to enable (marketing-friendly names)
   * - compose (Writer API)
   * - improve (Rewriter API - future)
   * - fix-grammar (Proofreader API - future)
   * - translate (Translator API - future)
  * - inline-suggest (Rewriter API inline suggestions)
   */
  features?: Array<'compose' | 'improve' | 'fix-grammar' | 'translate' | 'inline-suggest'>;

  /**
   * List of target languages (BCP 47 codes) offered for translation
   * Example: ['en', 'fr', 'es', 'de']
   */
  translateTargets?: string[];

  /**
   * Optional map from BCP 47 code to human-readable label for dropdown
   * Example: { en: 'English', fr: 'French' }
   */
  translateLanguageMap?: Record<string, string>;

  /**
   * Placeholder for the prompt input in the compose modal
   */
  placeholderPrompt?: string;

  /**
   * Writer options passed to Writer.create
   */
  writerOptions?: {
    tone?: 'formal' | 'neutral' | 'casual';
    format?: 'markdown' | 'plain-text';
    length?: 'short' | 'medium' | 'long';
    sharedContext?: string;
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
  };

  /**
   * Called when AI result is accepted and applied to textarea
   */
  onAccept?: (text: string) => void;

  /**
   * Called when any AI flow errors
   */
  onAIError?: (error: Error) => void;

  /**
   * Inline auto-suggestion (Rewriter) configuration
   */
  autoSuggestEnabled?: boolean;
  autoSuggestDebounceMs?: number;
  autoSuggestMaxChars?: number;
  autoSuggestPrompt?: string;
}

export const GenUITextarea = React.forwardRef<HTMLTextAreaElement, GenUITextareaProps>(
  (
    {
      buttonVisibility = 'ALWAYS',
      buttonContent,
      onSummarize,
      summaryType = 'key-points',
      summaryLength = 'medium',
      summaryFormat = 'markdown',
      enableStreaming = false,
      sharedContext = '',
      onSummaryGenerated,
      onSummaryError,
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
      onAccept,
      onAIError,
      autoSuggestEnabled,
      autoSuggestDebounceMs = 500,
      autoSuggestMaxChars = 48,
      autoSuggestPrompt,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // AI Feature UI state
    const [isFeatureOpen, setIsFeatureOpen] = React.useState(false);
    const [activeFeature, setActiveFeature] = React.useState<
      'compose' | 'improve' | 'fix-grammar' | 'translate' | null
    >(null);
    const [phase, setPhase] = React.useState<'prompt' | 'generating' | 'result'>('prompt');
    const [promptText, setPromptText] = React.useState('');
    const [resultText, setResultText] = React.useState('');
    const [aiError, setAiError] = React.useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = React.useState<number | null>(null);
    const [detected, setDetected] = React.useState<DetectedLanguage[] | null>(null);
    const [selectedTarget, setSelectedTarget] = React.useState<string>('');
    const abortRef = React.useRef<AbortController | null>(null);
    const writerRef = React.useRef<any>(null);
    const rewriterRef = React.useRef<any>(null);
    const suggestAbortRef = React.useRef<AbortController | null>(null);
    const suggestTimeoutRef = React.useRef<any>(null);

    // Auto-suggest UI state
    const [suggestedText, setSuggestedText] = React.useState('');
    const [isSuggesting, setIsSuggesting] = React.useState(false);
    const mirrorRef = React.useRef<HTMLDivElement | null>(null);
    const markerRef = React.useRef<HTMLSpanElement | null>(null);
    const [caretPos, setCaretPos] = React.useState<{
      top: number;
      left: number;
      lineHeight: number;
      containerWidth: number;
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      letterSpacing: string;
      lineHeightCss: string;
    }>({ top: 0, left: 0, lineHeight: 0, containerWidth: 0, fontFamily: '', fontSize: '', fontWeight: '', letterSpacing: '', lineHeightCss: '' });
    
    // Support flags via services
    const isSupported = isSummarizerSupported();
    const isWriterSupported = svcIsWriterSupported();
    const isRewriterSupported = svcIsRewriterSupported();
    
    // Merge refs: internal ref and forwarded ref
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement, []);

    // Report errors to parent component when Chrome AI is not supported
    React.useEffect(() => {
      if (isSupported === false) {
        onSummaryError?.('Chrome Summarizer API is not supported in this browser. Please use Chrome 138+ with the required hardware specifications.');
      }
    }, [isSupported, onSummaryError]);

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    // ============ Writer API (Compose) ============
    const ensureWriter = React.useCallback(async () => {
      try {
        if (!isWriterSupported) {
          throw new Error('Chrome Writer API is not supported.');
        }

        const avail = await svcCheckWriterAvailability();
        if (avail === 'unavailable' || avail === null) {
          throw new Error('Writer API is unavailable on this device.');
        }

        const options = {
          ...(writerOptions ?? {}),
          monitor: (m: any) => {
            m?.addEventListener?.('downloadprogress', (e: any) => {
              if (typeof e.loaded === 'number') {
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
      setResultText('');
      setPhase('generating');
      setIsLoading(true);

      try {
        const writer = writerRef.current ?? (await ensureWriter());
        if (!writer) {
          setIsLoading(false);
          setPhase('prompt');
          return;
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const stream = writer.writeStreaming(promptText, {
          signal: abortRef.current.signal,
          context: writerOptions?.sharedContext,
        });

        let acc = '';
        for await (const chunk of stream) {
          acc += chunk;
          setResultText(acc);
        }
        setPhase('result');
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          // silently ignore aborts
        } else {
          const msg = (err as Error).message;
          setAiError(msg);
          onAIError?.(err as Error);
          setPhase('prompt');
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
      setPhase('prompt');
      setPromptText('');
      setResultText('');
      setAiError(null);
      setDownloadProgress(null);
      setDetected(null);
    }, []);

    React.useEffect(() => {
      return () => {
        abortRef.current?.abort();
        try { writerRef.current?.destroy?.(); } catch {}
        suggestAbortRef.current?.abort();
        if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
      };
    }, []);

    const openCompose = React.useCallback(() => {
      setActiveFeature('compose');
      setIsFeatureOpen(true);
      setPhase('prompt');
      setPromptText('');
      setResultText('');
      setAiError(null);
    }, []);

    const openImprove = React.useCallback(() => {
      setActiveFeature('improve');
      setIsFeatureOpen(true);
      setPhase('prompt');
      setResultText('');
      setAiError(null);
      setDownloadProgress(null);
    }, []);

    const openFixGrammar = React.useCallback(() => {
      setActiveFeature('fix-grammar');
      setIsFeatureOpen(true);
      setPhase('generating');
      setResultText('');
      setAiError(null);
      setDownloadProgress(null);
      setDetected(null);
    }, []);

    const openTranslate = React.useCallback(() => {
      setActiveFeature('translate');
      setIsFeatureOpen(true);
      setPhase('prompt');
      setResultText('');
      setAiError(null);
      setDownloadProgress(null);
      setDetected(null);
      // Preselect first provided target if any
      setSelectedTarget(translateTargets?.[0] || '');
    }, [translateTargets]);

    const startTranslate = React.useCallback(async () => {
      setAiError(null);
      setResultText('');
      setPhase('generating');
      setIsLoading(true);

      try {
        const text = textareaRef.current?.value || '';
        if (!text.trim()) {
          throw new Error('Please enter some text to translate.');
        }
        if (!selectedTarget) {
          throw new Error('Please select a target language.');
        }

        // Detect source language and take the first
        const detectedLangs = await detectLanguages(text);
        setDetected(detectedLangs);
        const sourceLanguage = (detectedLangs && detectedLangs.length > 0)
          ? detectedLangs[0].detectedLanguage
          : 'en';

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        // Create Translator with monitor for download progress
        const translator = await ensureTranslator({
          sourceLanguage,
          targetLanguage: selectedTarget,
          monitor(m: any) {
            try {
              m.addEventListener('downloadprogress', (e: any) => {
                if (typeof e.loaded === 'number') {
                  setDownloadProgress(Math.round(e.loaded * 100));
                }
              });
            } catch {}
          },
        } as any);

        // Prefer non-streaming; if streaming exists, we could support
        if (typeof translator.translateStreaming === 'function') {
          const stream = translator.translateStreaming(text, { signal: abortRef.current.signal });
          let acc = '';
          for await (const chunk of stream) {
            acc += chunk;
            setResultText(acc);
          }
          setPhase('result');
        } else {
          const result = await translator.translate(text);
          setResultText(result);
          setPhase('result');
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          // ignore aborts
        } else {
          const msg = (err as Error).message;
          setAiError(msg);
          setPhase('result');
        }
      } finally {
        setIsLoading(false);
      }
    }, [selectedTarget]);

    const startFixGrammar = React.useCallback(async () => {
      setAiError(null);
      setIsLoading(true);
      try {
        const text = textareaRef.current?.value || '';
        if (!text.trim()) {
          throw new Error('Please enter some text to fix grammar.');
        }

        // Detect languages first
        const detectedLangs = await detectLanguages(text);
        setDetected(detectedLangs);
        const topLanguage = (detectedLangs && detectedLangs.length > 0)
          ? detectedLangs[0].detectedLanguage
          : 'en';

        // Proofread with only the top detected language
        const res = await proofreadOnce(text, {
          expectedInputLanguages: [topLanguage],
          onProgress: (p) => setDownloadProgress(p),
        });
        setResultText(res.corrected);
        setPhase('result');
      } catch (err) {
        const msg = (err as Error).message;
        setAiError(msg);
        setPhase('result');
      } finally {
        setIsLoading(false);
      }
    }, []);

    React.useEffect(() => {
      if (isFeatureOpen && activeFeature === 'fix-grammar' && phase === 'generating' && !resultText) {
        // kick off the flow once when dialog opens
        startFixGrammar();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFeatureOpen, activeFeature, phase]);

    const acceptResult = React.useCallback(() => {
      if (textareaRef.current) {
        textareaRef.current.value = resultText;
        // trigger input event for React forms
        const event = new Event('input', { bubbles: true });
        textareaRef.current.dispatchEvent(event);
      }
      onAccept?.(resultText);
      closeFeature();
    }, [resultText, onAccept, closeFeature]);

    const regen = React.useCallback(() => {
      setPhase('prompt');
      setResultText('');
      setAiError(null);
    }, []);

    const handleStop = React.useCallback(() => {
      abortRef.current?.abort();
      setIsLoading(false);
      // Move to result phase to show Regenerate button immediately
      setPhase('result');
    }, []);

    const featureIcon = React.useMemo(() => {
      if (!activeFeature && (features?.length ?? 0) === 1) {
        const f = features![0];
        if (f === 'compose') return <Wand2 className="size-4" />;
        if (f === 'translate') return <Languages className="size-4" />;
        if (f === 'improve') return <Repeat2 className="size-4" />;
        if (f === 'fix-grammar') return <SpellCheck className="size-4" />;
      }
      return <Wand2 className="size-4" />;
    }, [activeFeature, features]);


    const handleSummarizeClick = React.useCallback(async () => {
      const text = textareaRef.current?.value || '';
      
      if (!text.trim()) {
        onSummaryError?.('Please enter some text to summarize.');
        return;
      }

      // Check if Chrome AI is supported
      if (!isSupported) {
        onSummaryError?.('Chrome Summarizer API is not supported.');
        return;
      }

      // Check availability
      const availability = await checkSummarizerAvailability();
      if (availability === 'unavailable') {
        onSummaryError?.('Summarizer API is not available on this device. Please check hardware requirements.');
        return;
      }
      if (availability === null) {
        onSummaryError?.('Checking availability... Please try again in a moment.');
        return;
      }

      setIsLoading(true);

      try {
        // Create summarizer with component-specific options
        const summarizerOptions: SummarizerOptions = {
          type: summaryType,
          format: summaryFormat,
          length: summaryLength,
          sharedContext: sharedContext,
        };

        const summarizer = await ensureSummarizer(summarizerOptions);
        if (!summarizer) {
          setIsLoading(false);
          return;
        }

        // Perform summarization
        const context = sharedContext || 'This text is being summarized for better understanding.';
        
        if (enableStreaming) {
          const stream = summarizer.summarizeStreaming(text, { context });
          let result = '';
          
          for await (const chunk of stream) {
            result += chunk;
            onSummaryGenerated?.(result);
          }
          
          onSummarize?.(text, result);
          console.log(result);
        } else {
          const result = await summarizer.summarize(text, { context });
          console.log(result);
          onSummaryGenerated?.(result);
          onSummarize?.(text, result);
        }
      } catch (err) {
        const errorMsg = (err as Error).message;
        onSummaryError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    }, [
      isSupported,
      summaryType,
      summaryFormat,
      summaryLength,
      sharedContext,
      enableStreaming,
      onSummarize,
      onSummaryGenerated,
      onSummaryError,
    ]);

    // ============ Rewriter API (Improve) ============
    const [tone, setTone] = React.useState<'more-formal' | 'as-is' | 'more-casual'>('as-is');
    const [lengthPref, setLengthPref] = React.useState<'shorter' | 'as-is' | 'longer'>('as-is');
    const [formatPref, setFormatPref] = React.useState<'as-is' | 'markdown' | 'plain-text'>('plain-text');
    const [contextText, setContextText] = React.useState('');

    const ensureRewriter = React.useCallback(async () => {
      try {
        if (!isRewriterSupported) {
          throw new Error('Chrome Rewriter API is not supported.');
        }

        const avail = await svcCheckRewriterAvailability();
        if (avail === 'unavailable' || avail === null) {
          throw new Error('Rewriter API is unavailable on this device.');
        }

        const options: RewriterOptions = {
          tone,
          length: lengthPref,
          format: formatPref,
          monitor: (m: any) => {
            m?.addEventListener?.('downloadprogress', (e: any) => {
              if (typeof e.loaded === 'number') {
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
      setResultText('');
      setPhase('generating');
      setIsLoading(true);

      try {
        const text = textareaRef.current?.value || '';
        if (!text.trim()) {
          throw new Error('Please enter some text to improve.');
        }

        const rewriter = rewriterRef.current ?? (await ensureRewriter());
        if (!rewriter) {
          setIsLoading(false);
          setPhase('prompt');
          return;
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        if (typeof rewriter.rewriteStreaming === 'function') {
          const stream = rewriter.rewriteStreaming(text, {
            signal: abortRef.current.signal,
            context: contextText || undefined,
          });
          let acc = '';
          for await (const chunk of stream) {
            acc += chunk;
            setResultText(acc);
          }
          setPhase('result');
        } else {
          const result = await rewriter.rewrite(text, {
            signal: abortRef.current.signal,
            context: contextText || undefined,
          });
          setResultText(result);
          setPhase('result');
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          // ignore aborts
        } else {
          const msg = (err as Error).message;
          setAiError(msg);
          onAIError?.(err as Error);
          setPhase('prompt');
        }
      } finally {
        setIsLoading(false);
      }
    }, [ensureRewriter, contextText, onAIError]);

    // ============ Auto-suggest (Rewriter) ============
    const defaultSuggestPrompt = 'Continue from the caret as an autocomplete. Do not change or repeat any existing user text before the caret. If you must return the full text, ensure it begins with the original text exactly and then adds only the natural continuation. No quotes or prefaces. Keep it coherent and concise (about 8–12 words).';

    const autoSuggestActive = React.useMemo(() => {
      return (typeof autoSuggestEnabled === 'boolean')
        ? autoSuggestEnabled
        : !!(features && features.includes('inline-suggest'));
    }, [autoSuggestEnabled, features]);

    const computeCaretPosition = React.useCallback(() => {
      const ta = textareaRef.current;
      const mirror = mirrorRef.current;
      const marker = markerRef.current;
      if (!ta || !mirror || !marker) return;

      const cs = getComputedStyle(ta);
      const mirrorStyle: Partial<CSSStyleDeclaration> = {
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      } as any;

      // Mirror key typography and box metrics
      mirror.style.position = 'absolute';
      mirror.style.visibility = 'hidden';
      mirror.style.zIndex = '-1';
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.wordWrap = 'break-word';
      mirror.style.top = '0px';
      mirror.style.left = '0px';
      mirror.style.width = ta.clientWidth + 'px';
      mirror.style.fontFamily = cs.fontFamily;
      mirror.style.fontSize = cs.fontSize;
      mirror.style.fontWeight = cs.fontWeight as any;
      mirror.style.letterSpacing = cs.letterSpacing;
      mirror.style.lineHeight = cs.lineHeight;
      mirror.style.padding = cs.padding;
      mirror.style.border = cs.border;

      const value = ta.value;
      const caret = ta.selectionStart ?? value.length;
      const before = value.substring(0, caret);
      const after = value.substring(caret);

      // Set mirror content with a marker at caret
      const safeBefore = before.replace(/\n/g, '\n');
      const safeAfter = after.replace(/\n/g, '\n');
      mirror.innerText = '';
      const beforeNode = document.createTextNode(safeBefore);
      const afterNode = document.createTextNode(safeAfter);
      mirror.appendChild(beforeNode);
      mirror.appendChild(marker);
      mirror.appendChild(afterNode);

      const markerRect = marker.getBoundingClientRect();
      const mirrorRect = mirror.getBoundingClientRect();
      const top = markerRect.top - mirrorRect.top - ta.scrollTop;
      const left = markerRect.left - mirrorRect.left - ta.scrollLeft;
      const lineHeightNum = parseFloat(cs.lineHeight || '16') || ta.clientHeight / (ta.rows || 1) || 16;
      setCaretPos({
        top,
        left,
        lineHeight: lineHeightNum,
        containerWidth: ta.clientWidth,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        lineHeightCss: cs.lineHeight,
      });
    }, []);

    const clearSuggestion = React.useCallback(() => {
      setSuggestedText('');
      setIsSuggesting(false);
      suggestAbortRef.current?.abort();
      suggestAbortRef.current = null;
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    }, []);

    const maybeSuggest = React.useCallback(async () => {
      if (!autoSuggestActive) return;
      const ta = textareaRef.current;
      if (!ta) return;

      const value = ta.value;
      const caret = ta.selectionStart ?? value.length;
      const hasSelection = (ta.selectionEnd ?? caret) !== caret;
      if (hasSelection) { clearSuggestion(); return; }

      const prefix = value.substring(0, caret);
      if (prefix.trim().length < 3) { clearSuggestion(); return; }

      // Debounce: cancel prior
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
      suggestTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSuggesting(true);
          suggestAbortRef.current?.abort();
          suggestAbortRef.current = new AbortController();

          // Ensure rewriter
          const rewriter = rewriterRef.current ?? (await ensureRewriter());
          if (!rewriter) { clearSuggestion(); return; }

          // Compute caret position before request so overlay feels snappy
          computeCaretPosition();

          const context = (autoSuggestPrompt || defaultSuggestPrompt);
          let completion: string = '';
          if (typeof rewriter.rewrite === 'function') {
            completion = await rewriter.rewrite(prefix, { signal: suggestAbortRef.current!.signal, context });
          } else if (typeof rewriter.rewriteStreaming === 'function') {
            let acc = '';
            const stream = rewriter.rewriteStreaming(prefix, { signal: suggestAbortRef.current!.signal, context });
            for await (const chunk of stream) { acc += chunk; if (acc.length >= autoSuggestMaxChars * 2) break; }
            completion = acc;
          }

          // If model returned full text, extract continuation suffix.
          let suggestion: string = '';
          const input = prefix;
          const out = (completion || '');
          if (out.startsWith(input)) {
            suggestion = out.slice(input.length);
          } else {
            // Fallback: find longest common prefix length and take the remainder
            let i = 0;
            const max = Math.min(input.length, out.length);
            while (i < max && input.charCodeAt(i) === out.charCodeAt(i)) i++;
            suggestion = out.slice(i);
          }

          // Post-process continuation: trim leading whitespace, enforce max chars and word boundary
          suggestion = suggestion.replace(/^\s+/, '');
          if (suggestion.length > autoSuggestMaxChars) {
            suggestion = suggestion.slice(0, autoSuggestMaxChars);
            const lastSpace = suggestion.lastIndexOf(' ');
            if (lastSpace > 8) suggestion = suggestion.slice(0, lastSpace);
          }
          // Avoid echoing punctuation-only or empty
          if (!suggestion || /^(\.|,|;|:|!|\?|\)|\]|\})+$/.test(suggestion)) {
            clearSuggestion();
            return;
          }

          setSuggestedText(suggestion);
          setIsSuggesting(false);
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            // silent fail
          }
          clearSuggestion();
        }
      }, autoSuggestDebounceMs);
    }, [autoSuggestActive, autoSuggestDebounceMs, autoSuggestMaxChars, autoSuggestPrompt, ensureRewriter, computeCaretPosition, clearSuggestion]);

    const acceptSuggestion = React.useCallback(() => {
      const ta = textareaRef.current;
      if (!ta || !suggestedText) return;
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? start;
      if (start !== end) return;
      const before = ta.value.substring(0, start);
      const after = ta.value.substring(end);
      const next = before + suggestedText + after;
      ta.value = next;
      const newCaret = start + suggestedText.length;
      ta.setSelectionRange(newCaret, newCaret);
      // fire input event for React forms
      const event = new Event('input', { bubbles: true });
      ta.dispatchEvent(event);
      setSuggestedText('');
    }, [suggestedText]);

    const onKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'ArrowRight' && suggestedText) {
        e.preventDefault();
        acceptSuggestion();
        return;
      }
      if (e.key === 'Escape' && suggestedText) {
        e.preventDefault();
        clearSuggestion();
        return;
      }
      // let outer handler run too
      props.onKeyDown?.(e);
    }, [suggestedText, acceptSuggestion, clearSuggestion, props]);

    const onInput = React.useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
      clearSuggestion();
      maybeSuggest();
      // also forward original onInput
      props.onInput?.(e);
    }, [maybeSuggest, clearSuggestion, props]);

    const shouldShowButton =
      buttonVisibility === 'ALWAYS' || (buttonVisibility === 'ON_FOCUS' && isFocused);

    const defaultButtonContent = buttonContent ?? (
      <Sparkles className="size-4" />
    );

    const buttonContentWithLoading = isLoading ? (
      <Spinner className="size-4" />
    ) : (
      defaultButtonContent
    );

    const hasFeatureUI = Array.isArray(features) && features.length > 0;

    return (
      <div className={cn('relative', containerClassName)}>
        <Textarea
          ref={textareaRef}
          className={className}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          onInput={onInput}
          {...props}
        />

        {/* Hidden mirror to compute caret position */}
        {autoSuggestActive && (
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className="pointer-events-none select-none"
            style={{
              position: 'absolute',
              visibility: 'hidden',
              inset: 0,
              overflow: 'hidden',
            }}
          >
            <span ref={markerRef} />
          </div>
        )}

        {/* Ghost suggestion overlay */}
        {autoSuggestActive && suggestedText && (() => {
          const baseLeft = Math.max(0, caretPos.left) + 2;
          const baseTop = Math.max(0, caretPos.top);
          let effLeft = baseLeft;
          let effTop = baseTop;
          let maxWidth = Math.max(0, (caretPos.containerWidth || 0) - baseLeft - 4);
          if (maxWidth < 40) {
            effLeft = 2;
            effTop = baseTop + (caretPos.lineHeight || 0);
            maxWidth = Math.max(0, (caretPos.containerWidth || 0) - 4);
          }
          return (
            <div
              className="pointer-events-none absolute"
              style={{
                left: effLeft,
                top: effTop,
                maxWidth,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflow: 'hidden',
                fontFamily: caretPos.fontFamily,
                fontSize: caretPos.fontSize,
                fontWeight: caretPos.fontWeight as any,
                letterSpacing: caretPos.letterSpacing,
                lineHeight: caretPos.lineHeightCss,
              }}
            >
              <span className="text-muted-foreground/60">{suggestedText}</span>
            </div>
          );
        })()}

        {shouldShowButton && !hasFeatureUI && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleSummarizeClick}
            disabled={isLoading}
            className={cn(
              'absolute right-2.5 top-2.5 h-7 w-7 rounded-md shadow-sm hover:bg-accent/80 transition-opacity z-10',
              isLoading && 'cursor-wait',
              buttonClassName
            )}
            aria-label={isLoading ? 'Summarizing...' : 'Summarize content'}
          >
            {buttonContentWithLoading}
          </Button>
        )}

        {shouldShowButton && hasFeatureUI && (
          features!.length === 1 ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (features![0] === 'compose') {
                  openCompose();
                } else if (features![0] === 'improve') {
                  openImprove();
                } else if (features![0] === 'fix-grammar') {
                  openFixGrammar();
                }
              }}
              disabled={isLoading}
              className={cn(
                'absolute right-2.5 top-2.5 h-7 w-7 rounded-md shadow-sm hover:bg-accent/80 transition-opacity z-10',
                isLoading && 'cursor-wait',
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
                    'absolute right-2.5 top-2.5 h-7 w-7 rounded-md shadow-sm hover:bg-accent/80 transition-opacity z-10',
                    isLoading && 'cursor-wait',
                    buttonClassName
                  )}
                  aria-label="Choose AI action"
                >
                  {isLoading ? <Spinner className="size-4" /> : <Wand2 className="size-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                {features!.includes('compose') && (
                  <DropdownMenuItem onClick={openCompose}>
                    <Wand2 className="mr-2 h-4 w-4" /> Compose
                  </DropdownMenuItem>
                )}
                {features!.includes('improve') && (
                  <DropdownMenuItem onClick={openImprove}>
                    <Repeat2 className="mr-2 h-4 w-4" /> Improve
                  </DropdownMenuItem>
                )}
                {features!.includes('fix-grammar') && (
                  <DropdownMenuItem onClick={openFixGrammar}>
                    <SpellCheck className="mr-2 h-4 w-4" /> Fix grammar
                  </DropdownMenuItem>
                )}
                {features!.includes('translate') && (
                  <DropdownMenuItem onClick={openTranslate}>
                    <Languages className="mr-2 h-4 w-4" /> Translate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}

        {/* Compose Modal */}
        <Dialog open={isFeatureOpen && activeFeature === 'compose'} onOpenChange={(open) => { if (!open) closeFeature(); }}>
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
              <div className="text-xs text-muted-foreground">Model downloading… {downloadProgress}%</div>
            )}

            {phase === 'prompt' && (
              <div className="space-y-3">
                <Input
                  placeholder={placeholderPrompt || 'describe what you want'}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                />
              </div>
            )}

              {phase === 'generating' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Generating…
                </div>
                {resultText && (
                  <Textarea value={resultText} readOnly className="min-h-[160px]" />
                )}
              </div>
            )}

            {phase === 'result' && (
              <div className="space-y-3">
                <Textarea value={resultText} readOnly className="min-h-[200px]" />
              </div>
            )}

            <DialogFooter className="gap-2">
              {phase === 'prompt' && (
                <Button onClick={startComposeStreaming} disabled={!promptText.trim() || isLoading}>
                  {isLoading ? <Spinner className="mr-2 size-4" /> : null}
                  Generate
                </Button>
              )}
              {phase === 'generating' && (
                <Button variant="outline" onClick={handleStop}>Stop</Button>
              )}
              {phase === 'result' && (
                <>
                  <Button variant="outline" onClick={regen}>Regenerate</Button>
                  {typeof resultText === 'string' && resultText.trim().length > 0 && (
                    <Button onClick={acceptResult}>Accept</Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Fix Grammar Modal */}
        <Dialog open={isFeatureOpen && activeFeature === 'fix-grammar'} onOpenChange={(open) => { if (!open) closeFeature(); }}>
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
                Detected: {detected.map((d) => d.detectedLanguage).join(', ')}
              </div>
            )}

            {downloadProgress !== null && downloadProgress < 100 && (
              <div className="text-xs text-muted-foreground">Model downloading… {downloadProgress}%</div>
            )}

            {phase === 'generating' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Fixing grammar…
                </div>
                {resultText && (
                  <Textarea value={resultText} readOnly className="min-h-[160px]" />
                )}
              </div>
            )}

            {phase === 'result' && (
              <div className="space-y-3">
                <Textarea value={resultText} readOnly className="min-h-[200px]" />
              </div>
            )}

            <DialogFooter className="gap-2">
              {phase === 'generating' && (
                <Button variant="outline" onClick={handleStop}>Stop</Button>
              )}
              {phase === 'result' && (
                <>
                  <Button variant="outline" onClick={() => {
                    // regenerate with same detected languages
                    setAiError(null);
                    setPhase('generating');
                    (async () => {
                      try {
                        const text = textareaRef.current?.value || '';
                        const top = (detected && detected.length > 0) ? detected[0].detectedLanguage : 'en';
                        const res = await proofreadOnce(text, {
                          expectedInputLanguages: [top],
                          onProgress: (p) => setDownloadProgress(p),
                        });
                        setResultText(res.corrected);
                        setPhase('result');
                      } catch (err) {
                        const msg = (err as Error).message;
                        setAiError(msg);
                        setPhase('result');
                      }
                    })();
                  }}>Regenerate</Button>
                  {typeof resultText === 'string' && resultText.trim().length > 0 && (
                    <Button onClick={acceptResult}>Accept</Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Improve Modal */}
        <Dialog open={isFeatureOpen && activeFeature === 'improve'} onOpenChange={(open) => { if (!open) closeFeature(); }}>
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
              <div className="text-xs text-muted-foreground">Model downloading… {downloadProgress}%</div>
            )}

            {phase === 'prompt' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="as-is">Tone: As-is</SelectItem>
                      <SelectItem value="more-formal">Tone: More formal</SelectItem>
                      <SelectItem value="more-casual">Tone: More casual</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={lengthPref} onValueChange={(v) => setLengthPref(v as any)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="as-is">Length: As-is</SelectItem>
                      <SelectItem value="shorter">Length: Shorter</SelectItem>
                      <SelectItem value="longer">Length: Longer</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={formatPref} onValueChange={(v) => setFormatPref(v as any)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plain-text">Format: Plain text</SelectItem>
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

            {phase === 'generating' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Improving…
                </div>
                {resultText && (
                  <Textarea value={resultText} readOnly className="min-h-[160px]" />
                )}
              </div>
            )}

            {phase === 'result' && (
              <div className="space-y-3">
                <Textarea value={resultText} readOnly className="min-h-[200px]" />
              </div>
            )}

            <DialogFooter className="gap-2">
              {phase === 'prompt' && (
                <Button onClick={startImprove} disabled={isLoading}>
                  {isLoading ? <Spinner className="mr-2 size-4" /> : null}
                  Generate
                </Button>
              )}
              {phase === 'generating' && (
                <Button variant="outline" onClick={handleStop}>Stop</Button>
              )}
              {phase === 'result' && (
                <>
                  <Button variant="outline" onClick={regen}>Regenerate</Button>
                  {typeof resultText === 'string' && resultText.trim().length > 0 && (
                    <Button onClick={acceptResult}>Accept</Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Translate Modal */}
        <Dialog open={isFeatureOpen && activeFeature === 'translate'} onOpenChange={(open) => { if (!open) closeFeature(); }}>
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
              <div className="text-xs text-muted-foreground">Model downloading… {downloadProgress}%</div>
            )}

            {phase === 'prompt' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Select value={selectedTarget} onValueChange={(v) => setSelectedTarget(v)}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select target language" />
                    </SelectTrigger>
                    <SelectContent>
                      {translateTargets?.map((code: string) => (
                        <SelectItem key={code} value={code}>
                          {translateLanguageMap?.[code] || code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {phase === 'generating' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" /> Translating…
                </div>
                {resultText && (
                  <Textarea value={resultText} readOnly className="min-h-[160px]" />
                )}
              </div>
            )}

            {phase === 'result' && (
              <div className="space-y-3">
                <Textarea value={resultText} readOnly className="min-h-[200px]" />
              </div>
            )}

            <DialogFooter className="gap-2">
              {phase === 'prompt' && (
                <Button onClick={startTranslate} disabled={!selectedTarget || isLoading}>
                  {isLoading ? <Spinner className="mr-2 size-4" /> : null}
                  Translate
                </Button>
              )}
              {phase === 'generating' && (
                <Button variant="outline" onClick={handleStop}>Stop</Button>
              )}
              {phase === 'result' && (
                <>
                  <Button variant="outline" onClick={() => { setPhase('prompt'); setResultText(''); setAiError(null); }}>Regenerate</Button>
                  {typeof resultText === 'string' && resultText.trim().length > 0 && (
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

GenUITextarea.displayName = 'GenUITextarea';

