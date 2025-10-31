'use client';

import * as React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Sparkles, Repeat2 } from 'lucide-react';
import { type UseSummarizerOptions, ButtonPosition, SummarizeSelectionProps } from '@/lib/genui-types';
import { useSummarizer } from '@/hooks/use-genui-summarizer';



export function SummarizeSelection({ className, defaultOptions, dialogTitle = 'Summary' }: SummarizeSelectionProps) {
  const [selectionText, setSelectionText] = React.useState<string>('');
  const [position, setPosition] = React.useState<ButtonPosition>({ top: 0, left: 0, visible: false });
  const [open, setOpen] = React.useState(false);
  const debounceRef = React.useRef<number | null>(null);
  const rangeRef = React.useRef<Range | null>(null);
  const isSelectionReversedRef = React.useRef<boolean>(false);

  const { isLoading, error, result, runStreaming, run, reset } = useSummarizer({
    ...defaultOptions,
  } as UseSummarizerOptions);

  const clearPosition = React.useCallback(() => {
    setPosition((p) => ({ ...p, visible: false }));
  }, []);

  const getTargetRect = React.useCallback((range: Range): DOMRect | null => {
    const rects = range.getClientRects();
    if (!rects || rects.length === 0) return range.getBoundingClientRect();
    // For reversed selections (bottom to top), use the first rect
    // For normal selections (top to bottom), use the last rect
    if (isSelectionReversedRef.current) {
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r && r.width > 0 && r.height > 0) return r as DOMRect;
      }
    } else {
      // Prefer the last non-empty rect for multi-line selections
      for (let i = rects.length - 1; i >= 0; i--) {
        const r = rects[i];
        if (r && r.width > 0 && r.height > 0) return r as DOMRect;
      }
    }
    return range.getBoundingClientRect();
  }, []);

  const updateFromSelection = React.useCallback(() => {
    if (open) {
      clearPosition();
      return;
    }
    const sel = window.getSelection?.();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionText('');
      clearPosition();
      rangeRef.current = null;
      return;
    }
    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text) {
      setSelectionText('');
      clearPosition();
      rangeRef.current = null;
      return;
    }

    // Detect selection direction: if anchor comes after focus, selection was made bottom to top
    const anchorNode = sel.anchorNode;
    const focusNode = sel.focusNode;
    let isReversed = false;
    
    if (anchorNode && focusNode) {
      if (anchorNode === focusNode) {
        // Same node, compare offsets
        isReversed = sel.anchorOffset > sel.focusOffset;
      } else {
        // Different nodes: create ranges at anchor and focus points and compare them
        const anchorRange = document.createRange();
        anchorRange.setStart(anchorNode, sel.anchorOffset);
        anchorRange.collapse(true);
        
        const focusRange = document.createRange();
        focusRange.setStart(focusNode, sel.focusOffset);
        focusRange.collapse(true);
        
        // Compare which range comes first in document order
        // If anchor range comes after focus range, selection was reversed (bottom to top)
        const comparison = anchorRange.compareBoundaryPoints(Range.START_TO_START, focusRange);
        isReversed = comparison > 0;
      }
    }
    
    isSelectionReversedRef.current = isReversed;

    rangeRef.current = range.cloneRange();
    const rect = getTargetRect(rangeRef.current);
    
    // If selection is reversed (bottom to top), show button above the selection
    // If selection is normal (top to bottom), show button below the selection
    const BUTTON_HEIGHT = 32; // Approximate button height (h-8 = 32px)
    const SPACING = 6;
    const top = isReversed 
      ? (rect?.top ?? 0) - BUTTON_HEIGHT - SPACING
      : (rect?.bottom ?? 0) + SPACING;
    const left = (rect?.right ?? 0) + 6;
    setSelectionText(text);
    setPosition({ top, left, visible: true });
  }, [clearPosition, getTargetRect, open]);

  const debouncedUpdate = React.useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(updateFromSelection, 100);
  }, [updateFromSelection]);

  React.useEffect(() => {
    const onSelectionChange = () => debouncedUpdate();
    document.addEventListener('selectionchange', onSelectionChange);
    const onScrollOrResize = () => {
      if (open) return;
      if (rangeRef.current) {
        const rect = getTargetRect(rangeRef.current);
        const BUTTON_HEIGHT = 32; // Approximate button height (h-8 = 32px)
        const SPACING = 6;
        const isReversed = isSelectionReversedRef.current;
        const top = isReversed 
          ? (rect?.top ?? 0) - BUTTON_HEIGHT - SPACING
          : (rect?.bottom ?? 0) + SPACING;
        const left = (rect?.right ?? 0) + 6;
        setPosition((p) => ({ ...p, top, left }));
      }
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, true);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize, true);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [debouncedUpdate, getTargetRect]);

  const handleOpen = React.useCallback(async () => {
    if (!selectionText) return;
    setOpen(true);
    reset();
    try {
      // Prefer streaming
      await runStreaming(selectionText, {});
    } catch {
      // Fallback to non-streaming
      try {
        await run(selectionText, {});
      } catch {}
    }
  }, [selectionText, runStreaming, run, reset]);

  // Hide the button when dialog opens to avoid overlap
  React.useEffect(() => {
    if (open) clearPosition();
  }, [open, clearPosition]);

  return (
    <>
      {!open && position.visible && (
        <div
          className={cn('fixed z-50', className)}
          style={{ top: position.top, left: position.left }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-lg shadow"
                onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
                onClick={() => void handleOpen()}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Summarize selection</TooltipContent>
          </Tooltip>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                {result || 'No summary yet.'}
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleOpen()}
                  disabled={isLoading || !selectionText}
                >
                  <Repeat2 className="h-4 w-4" />
                  Re-Summarize
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resummarize</TooltipContent>
            </Tooltip>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


