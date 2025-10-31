'use client';

import * as React from 'react';
import type { UseSummarizerOptions, SummarizeOptions,SummarizerOptions } from '@/registry/new-york/gencn-ui/items/shared/genui-types';
import { ensureSummarizer } from '@/registry/new-york/gencn-ui/items/shared/lib/summarizer';




export interface UseSummarizerReturn {
  isLoading: boolean;
  error: Error | null;
  progress: number | null;
  result: string;
  run: (text: string, options?: SummarizeOptions) => Promise<string>;
  runStreaming: (text: string, options?: SummarizeOptions) => Promise<string>;
  stop: () => void;
  reset: () => void;
}

export function useSummarizer(options?: UseSummarizerOptions): UseSummarizerReturn {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [result, setResult] = React.useState('');
  const abortRef = React.useRef<AbortController | null>(null);
  const summarizerRef = React.useRef<any>(null);

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
    setProgress(null);
    setResult('');
  }, []);

  const getSummarizer = React.useCallback(async () => {
    if (summarizerRef.current) return summarizerRef.current;
    summarizerRef.current = await ensureSummarizer({
      ...options,
      onProgress: (p) => setProgress(p),
    });
    return summarizerRef.current;
  }, [options]);

  const run = React.useCallback(async (text: string, summarizeOptions?: SummarizeOptions) => {
    setIsLoading(true);
    setError(null);
    setResult('');
    try {
      const summarizer = await getSummarizer();
      const res = await summarizer.summarize(text, {
        context: summarizeOptions?.context ?? options?.sharedContext ?? options?.context,
      });
      setResult(res);
      return res as string;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [getSummarizer, options]);

  const runStreaming = React.useCallback(async (text: string, summarizeOptions?: SummarizeOptions) => {
    setIsLoading(true);
    setError(null);
    setResult('');
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const summarizer = await getSummarizer();
      const stream = summarizer.summarizeStreaming(text, {
        context: summarizeOptions?.context ?? options?.sharedContext ?? options?.context,
        signal: abortRef.current.signal,
      });
      let acc = '';
      for await (const chunk of stream) {
        acc += chunk;
        setResult(acc);
      }
      return acc;
    } catch (e) {
      if ((e as any)?.name === 'AbortError') return result;
      setError(e as Error);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [getSummarizer, options, result]);

  React.useEffect(() => () => stop(), [stop]);

  return { isLoading, error, progress, result, run, runStreaming, stop, reset };
}


