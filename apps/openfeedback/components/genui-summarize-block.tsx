'use client';

import * as React from 'react';
import type { UseSummarizerOptions, SummarizerOptions, SummarizeOptions } from '@/lib/genui-types';
import { useSummarizer } from '@/hooks/use-genui-summarizer';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Minimize, Repeat2, Sparkles } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export type GenUISummarizerDisplayMode = 'ondemand' | 'static';

export interface GenUISummarizerProviderProps extends UseSummarizerOptions {
  displayMode?: GenUISummarizerDisplayMode;
  children: React.ReactNode;
  joinSeparator?: string;
  summarizeOptions?: SummarizeOptions;
}

interface AISummarizerContextValue {
  displayMode: GenUISummarizerDisplayMode;
  register: (id: string, text: string) => void;
  update: (id: string, text: string) => void;
  unregister: (id: string) => void;
  summarize: () => Promise<void>;
  show: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  progress: number | null;
  result: string;
  hasContent: boolean;
  contentVisible: boolean;
  setContentVisible: (visible: boolean) => void;
  hasFreshResult: boolean;
}

const AISummarizerContext = React.createContext<AISummarizerContextValue | null>(null);

export function useGenUISummarizer() {
  const ctx = React.useContext(AISummarizerContext);
  if (!ctx) throw new Error('AISummarizer components must be used within <GenUISummarizerProvider>');
  return ctx;
}

export function GenUISummarizerProvider({
  children,
  displayMode = 'ondemand',
  joinSeparator = '\n\n',
  summarizeOptions,
  ...summarizerOptions
}: GenUISummarizerProviderProps) {
  const registryRef = React.useRef<Map<string, string>>(new Map());
  const [version, setVersion] = React.useState(0);
  const [contentVisible, setContentVisible] = React.useState<boolean>(() => (displayMode === 'static'));
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSummarizedTextRef = React.useRef<string>('');

  const { isLoading, error, progress, result, run, reset } = useSummarizer(summarizerOptions);

  const register = React.useCallback((id: string, text: string) => {
    registryRef.current.set(id, text);
    setVersion((v) => v + 1);
  }, []);

  const update = React.useCallback((id: string, text: string) => {
    if (registryRef.current.has(id)) {
      registryRef.current.set(id, text);
      setVersion((v) => v + 1);
    }
  }, []);

  const unregister = React.useCallback((id: string) => {
    if (registryRef.current.delete(id)) {
      setVersion((v) => v + 1);
    }
  }, []);

  const joinedText = React.useMemo(() => {
    return Array.from(registryRef.current.values())
      .map((t) => (t ?? '').toString())
      .filter((t) => t.trim().length > 0)
      .join(joinSeparator);
  }, [version, joinSeparator]);

  const hasContent = joinedText.trim().length > 0;
  const hasFreshResult = React.useMemo(() => {
    return (
      hasContent &&
      result.trim().length > 0 &&
      lastSummarizedTextRef.current.trim() === joinedText.trim()
    );
  }, [hasContent, result, joinedText]);

  const summarize = React.useCallback(async () => {
    if (!hasContent) {
      return;
    }
    await run(joinedText, summarizeOptions);
    setContentVisible(true);
    lastSummarizedTextRef.current = joinedText;
  }, [hasContent, run, joinedText, summarizeOptions]);

  const show = React.useCallback(async () => {
    if (!hasContent) return;
    if (!hasFreshResult) {
      await run(joinedText, summarizeOptions);
      lastSummarizedTextRef.current = joinedText;
    }
    setContentVisible(true);
  }, [hasContent, hasFreshResult, run, joinedText, summarizeOptions]);

  // In static mode: auto-display and debounce summarization by 5s after text changes
  React.useEffect(() => {
    if (displayMode !== 'static') return;
    setContentVisible(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!hasContent) {
      reset();
      return;
    }
    // Only summarize if the input text changed since the last successful summarize
    if (joinedText.trim() === lastSummarizedTextRef.current.trim()) {
      return;
    }
    const textForThisRun = joinedText;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void (async () => {
        await run(textForThisRun, summarizeOptions);
        setContentVisible(true);
        lastSummarizedTextRef.current = textForThisRun;
      })();
    }, 5000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [displayMode, joinedText, hasContent, run, summarizeOptions, reset]);

  const value: AISummarizerContextValue = React.useMemo(
    () => ({
      displayMode,
      register,
      update,
      unregister,
      summarize,
      show,
      isLoading,
      error,
      progress,
      result,
      hasContent,
      contentVisible,
      setContentVisible,
      hasFreshResult,
    }),
    [displayMode, register, update, unregister, summarize, show, isLoading, error, progress, result, hasContent, contentVisible, hasFreshResult]
  );

  return <AISummarizerContext.Provider value={value}>{children}</AISummarizerContext.Provider>;
}


export interface GenUISummarizerTextProps {
    text: string;
    as?: React.ElementType;
    className?: string;
  }
  
  export function GenUISummarizerText({ text, as: Component = 'span', className }: GenUISummarizerTextProps) {
    const { register, update, unregister } = useGenUISummarizer();
    const idRef = React.useRef<string>('');
  
    if (!idRef.current) {
      idRef.current = Math.random().toString(36).slice(2);
    }
  
    React.useEffect(() => {
      const id = idRef.current;
      register(id, text);
      return () => unregister(id);
    }, [register, unregister]);
  
    React.useEffect(() => {
      update(idRef.current, text);
    }, [text, update]);
  
    return <Component className={className}>{text}</Component>;
  }
  
  

  export interface GenUISummarizerContentProps {
    className?: string;
    buttonText?: string;
    summarizingText?: string;
    emptyText?: string;
    showProgress?: boolean; // deprecated: no progress bar in UI
    enableContentToggle?: boolean;
    title?: string;
  }
  
  export function GenUISummarizerContent({
    className,
    emptyText = 'Summary will appear here',
    title = 'Summary',
  }: GenUISummarizerContentProps) {
    const { displayMode, summarize, show, isLoading, error, progress, result, hasContent, contentVisible, setContentVisible } = useGenUISummarizer();
  
    const handleToggleOndemand = async () => {
      if (!contentVisible) {
        await show();
      } else {
        setContentVisible(false);
      }
    };
  
    const showButton = displayMode === 'ondemand' || displayMode === 'static';
    const showContentBox = contentVisible;
  
    return (
      <div className={cn('space-y-3 relative', className)}>
        {displayMode === 'ondemand' && (
          <div className="flex justify-end -mt-2 mb-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  aria-label={contentVisible ? 'Close' : 'Summarize and open'}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-md p-0"
                  onClick={() => void handleToggleOndemand()}
                  disabled={isLoading && !contentVisible}
                >
                 {contentVisible ? <Minimize className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{contentVisible ? 'Close' : 'Summarize and open'}</TooltipContent>
            </Tooltip>
          </div>
        )}
  
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
  
        {/* Inline content */}
        {showContentBox && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg font-bold">{title}</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void summarize()}
                      disabled={isLoading || !hasContent}
                      className="inline-flex items-center gap-2"
                    >
                      <Repeat2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Re-summarize</TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : result ? (
                <div className="whitespace-pre-wrap">{result}</div>
              ) : (
                <div className="text-muted-foreground italic min-h-16">{emptyText}</div>
              )}
            </CardContent>
          </Card>
        )}
  
      
      </div>
    );
  }
  
  
    