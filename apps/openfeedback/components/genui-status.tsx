'use client';

import * as React from 'react';
import { CheckCircle2, XCircle, Download, Loader2, AlertCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGenUI } from '@/components/genui-provider';

export interface GenUIStatusProps {
  /**
   * Custom className for the container
   */
  className?: string;
  
  /**
   * Show detailed error messages
   */
  showErrors?: boolean;
  
  /**
   * Show download progress
   */
  showProgress?: boolean;
  
  /**
   * Display variant
   * - "card": Full card display (default)
   * - "popover": Icon button with popover
   * - "compact": Compact inline display
   */
  variant?: 'card' | 'popover' | 'compact';
}

export function GenUIStatus({
  className,
  showErrors = true,
  showProgress = true,
  variant = 'card',
}: GenUIStatusProps) {
  const {
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
    resetError,
  } = useGenUI();

  const [isChecking, setIsChecking] = React.useState(false);
  const [isCheckingWriter, setIsCheckingWriter] = React.useState(false);
  const [isCheckingRewriter, setIsCheckingRewriter] = React.useState(false);
  const [isCheckingLanguageDetector, setIsCheckingLanguageDetector] = React.useState(false);

  const handleCheckAvailability = React.useCallback(async () => {
    setIsChecking(true);
    try {
      await checkAvailability();
    } finally {
      setIsChecking(false);
    }
  }, [checkAvailability]);

  const handleCheckWriterAvailability = React.useCallback(async () => {
    setIsCheckingWriter(true);
    try {
      await checkWriterAvailability();
    } finally {
      setIsCheckingWriter(false);
    }
  }, [checkWriterAvailability]);

  const handleCheckRewriterAvailability = React.useCallback(async () => {
    setIsCheckingRewriter(true);
    try {
      await checkRewriterAvailability();
    } finally {
      setIsCheckingRewriter(false);
    }
  }, [checkRewriterAvailability]);

  const handleCheckLanguageDetectorAvailability = React.useCallback(async () => {
    setIsCheckingLanguageDetector(true);
    try {
      await checkLanguageDetectorAvailability();
    } finally {
      setIsCheckingLanguageDetector(false);
    }
  }, [checkLanguageDetectorAvailability]);

  // Determine status display for Summarizer
  const getSummarizerStatusDisplay = () => {
    if (isSupported === null) {
      return {
        icon: Loader2,
        label: 'Checking Support',
        variant: 'secondary' as const,
        color: 'text-muted-foreground',
      };
    }

    if (!isSupported) {
      return {
        icon: XCircle,
        label: 'Not Supported',
        variant: 'destructive' as const,
        color: 'text-destructive',
      };
    }

    if (availability === null) {
      return {
        icon: AlertCircle,
        label: 'Unknown',
        variant: 'secondary' as const,
        color: 'text-muted-foreground',
      };
    }

    if (availability === 'unavailable') {
      return {
        icon: XCircle,
        label: 'Unavailable',
        variant: 'destructive' as const,
        color: 'text-destructive',
      };
    }

    if (availability === 'downloadable') {
      return {
        icon: Download,
        label: 'Downloading',
        variant: 'default' as const,
        color: 'text-primary',
      };
    }

    if (availability === 'available') {
      return {
        icon: CheckCircle2,
        label: 'Available',
        variant: 'default' as const,
        color: 'text-green-600 dark:text-green-400',
      };
    }

    return {
      icon: AlertCircle,
      label: 'Unknown',
      variant: 'secondary' as const,
      color: 'text-muted-foreground',
    };
  };

  // Determine status display for Writer
  const getWriterStatusDisplay = () => {
    if (isWriterSupported === null) {
      return {
        icon: Loader2,
        label: 'Checking Support',
        variant: 'secondary' as const,
        color: 'text-muted-foreground',
      };
    }

    if (!isWriterSupported) {
      return {
        icon: XCircle,
        label: 'Not Supported',
        variant: 'destructive' as const,
        color: 'text-destructive',
      };
    }

    if (writerAvailability === null) {
      return {
        icon: AlertCircle,
        label: 'Unknown',
        variant: 'secondary' as const,
        color: 'text-muted-foreground',
      };
    }

    if (writerAvailability === 'unavailable') {
      return {
        icon: XCircle,
        label: 'Unavailable',
        variant: 'destructive' as const,
        color: 'text-destructive',
      };
    }

    if (writerAvailability === 'downloadable') {
      return {
        icon: Download,
        label: 'Downloading',
        variant: 'default' as const,
        color: 'text-primary',
      };
    }

    if (writerAvailability === 'available') {
      return {
        icon: CheckCircle2,
        label: 'Available',
        variant: 'default' as const,
        color: 'text-green-600 dark:text-green-400',
      };
    }

    return {
      icon: AlertCircle,
      label: 'Unknown',
      variant: 'secondary' as const,
      color: 'text-muted-foreground',
    };
  };

  // Determine status display for Language Detector
  const getLanguageDetectorStatusDisplay = () => {
    if (isLanguageDetectorSupported === null) {
      return {
        icon: Loader2,
        label: 'Checking Support',
        variant: 'secondary' as const,
        color: 'text-muted-foreground',
      };
    }

    if (!isLanguageDetectorSupported) {
      return {
        icon: XCircle,
        label: 'Not Supported',
        variant: 'destructive' as const,
        color: 'text-destructive',
      };
    }

    if (languageDetectorAvailability === null) {
      return {
        icon: AlertCircle,
        label: 'Unknown',
        variant: 'secondary' as const,
        color: 'text-muted-foreground',
      };
    }

    if (languageDetectorAvailability === 'unavailable') {
      return {
        icon: XCircle,
        label: 'Unavailable',
        variant: 'destructive' as const,
        color: 'text-destructive',
      };
    }

    if (languageDetectorAvailability === 'downloadable') {
      return {
        icon: Download,
        label: 'Downloading',
        variant: 'default' as const,
        color: 'text-primary',
      };
    }

    if (languageDetectorAvailability === 'available') {
      return {
        icon: CheckCircle2,
        label: 'Available',
        variant: 'default' as const,
        color: 'text-green-600 dark:text-green-400',
      };
    }

    return {
      icon: AlertCircle,
      label: 'Unknown',
      variant: 'secondary' as const,
      color: 'text-muted-foreground',
    };
  };

  const summarizerStatus = getSummarizerStatusDisplay();
  const writerStatus = getWriterStatusDisplay();
  
  const getRewriterStatusDisplay = () => {
    if (isRewriterSupported === null) {
      return {
        icon: Loader2,
        label: 'Checking Support',
        variant: 'secondary' as const,
        color: 'text-muted-foreground',
      };
    }

    if (!isRewriterSupported) {
      return {
        icon: XCircle,
        label: 'Not Supported',
        variant: 'destructive' as const,
        color: 'text-destructive',
      };
    }

    if (rewriterAvailability === null) {
      return {
        icon: AlertCircle,
        label: 'Unknown',
        variant: 'secondary' as const,
        color: 'text-muted-foreground',
      };
    }

    if (rewriterAvailability === 'unavailable') {
      return {
        icon: XCircle,
        label: 'Unavailable',
        variant: 'destructive' as const,
        color: 'text-destructive',
      };
    }

    if (rewriterAvailability === 'downloadable') {
      return {
        icon: Download,
        label: 'Downloading',
        variant: 'default' as const,
        color: 'text-primary',
      };
    }

    if (rewriterAvailability === 'available') {
      return {
        icon: CheckCircle2,
        label: 'Available',
        variant: 'default' as const,
        color: 'text-green-600 dark:text-green-400',
      };
    }

    return {
      icon: AlertCircle,
      label: 'Unknown',
      variant: 'secondary' as const,
      color: 'text-muted-foreground',
    };
  };

  const rewriterStatus = getRewriterStatusDisplay();
  const RewriterIcon = rewriterStatus.icon;
  const languageDetectorStatus = getLanguageDetectorStatusDisplay();
  const SummarizerIcon = summarizerStatus.icon;
  const WriterIcon = writerStatus.icon;
  const LanguageDetectorIcon = languageDetectorStatus.icon;
  
  // Overall status (at least one is supported/available)
  const overallSupported = isSupported === true || isWriterSupported === true || isRewriterSupported === true || isLanguageDetectorSupported === true;
  const overallAvailable = availability === 'available' || writerAvailability === 'available' || rewriterAvailability === 'available' || languageDetectorAvailability === 'available';
  const overallDownloading = isDownloading || isWriterDownloading || isRewriterDownloading || isLanguageDetectorDownloading;
  
  const overallStatus = overallAvailable
    ? { icon: CheckCircle2, label: 'Available', variant: 'default' as const, color: 'text-green-600 dark:text-green-400' }
    : overallDownloading
    ? { icon: Download, label: 'Downloading', variant: 'default' as const, color: 'text-primary' }
    : overallSupported
    ? { icon: AlertCircle, label: 'Checking', variant: 'secondary' as const, color: 'text-muted-foreground' }
    : { icon: XCircle, label: 'Not Supported', variant: 'destructive' as const, color: 'text-destructive' };
  
  const OverallStatusIcon = overallStatus.icon;

  // Popover variant - Icon button with popover content
  if (variant === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('relative gap-2', className)}
            aria-label="Chrome AI Status"
          >
            <OverallStatusIcon
              className={cn(
                'size-4 shrink-0',
                overallStatus.color,
                (isSupported === null || isWriterSupported === null || isLanguageDetectorSupported === null) && 'animate-spin'
              )}
            />
            <span className="whitespace-nowrap">AI Status</span>
            {overallDownloading && (
              <span className="absolute -top-1 -right-1 size-2 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Chrome AI Status</h3>
            </div>

            {/* Status Summary */}
            <div className="space-y-3">
              {/* Summarizer Status */}
              <div className="space-y-2 border-b pb-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Summarizer Model</span>
                  <Badge variant={summarizerStatus.variant} className="gap-1.5">
                    <SummarizerIcon
                      className={cn(
                        'size-3',
                        summarizerStatus.color,
                        isSupported === null && 'animate-spin'
                      )}
                    />
                    {summarizerStatus.label}
                  </Badge>
                </div>
                {isSupported && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground ml-1">
                    <span>Support</span>
                    <div className="flex items-center gap-1.5">
                      {isSupported === null ? (
                        <>
                          <Spinner className="size-3" />
                          <span>Checking...</span>
                        </>
                      ) : isSupported ? (
                        <>
                          <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />
                          <span>Supported</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-destructive" />
                          <span>Not Supported</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {isDownloading && showProgress && (
                  <div className="space-y-1.5 ml-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Download</span>
                      <span className="font-medium">{Math.round(downloadProgress)}%</span>
                    </div>
                    <Progress value={downloadProgress} className="h-1.5" />
                  </div>
                )}
                {isSupported && availability === null && (
                  <Button
                    onClick={handleCheckAvailability}
                    disabled={isChecking}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full mt-1"
                  >
                    {isChecking ? (
                      <>
                        <Spinner className="size-3 mr-1.5" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-3 mr-1.5" />
                        Check Availability
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Rewriter Status */}
              <div className="space-y-2 border-b pb-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Rewriter Model</span>
                  <Badge variant={rewriterStatus.variant} className="gap-1.5">
                    <RewriterIcon
                      className={cn(
                        'size-3',
                        rewriterStatus.color,
                        isRewriterSupported === null && 'animate-spin'
                      )}
                    />
                    {rewriterStatus.label}
                  </Badge>
                </div>
                {isRewriterSupported !== null && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground ml-1">
                    <span>Support</span>
                    <div className="flex items-center gap-1.5">
                      {isRewriterSupported === null ? (
                        <>
                          <Spinner className="size-3" />
                          <span>Checking...</span>
                        </>
                      ) : isRewriterSupported ? (
                        <>
                          <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />
                          <span>Supported</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-destructive" />
                          <span>Not Supported</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {isRewriterDownloading && showProgress && (
                  <div className="space-y-1.5 ml-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Download</span>
                      <span className="font-medium">{Math.round(rewriterDownloadProgress)}%</span>
                    </div>
                    <Progress value={rewriterDownloadProgress} className="h-1.5" />
                  </div>
                )}
                {isRewriterSupported && rewriterAvailability === null && (
                  <Button
                    onClick={handleCheckRewriterAvailability}
                    disabled={isCheckingRewriter}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full mt-1"
                  >
                    {isCheckingRewriter ? (
                      <>
                        <Spinner className="size-3 mr-1.5" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-3 mr-1.5" />
                        Check Availability
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Writer Status */}
              <div className="space-y-2 border-b pb-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Writer Model</span>
                  <Badge variant={writerStatus.variant} className="gap-1.5">
                    <WriterIcon
                      className={cn(
                        'size-3',
                        writerStatus.color,
                        isWriterSupported === null && 'animate-spin'
                      )}
                    />
                    {writerStatus.label}
                  </Badge>
                </div>
                {isWriterSupported !== null && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground ml-1">
                    <span>Support</span>
                    <div className="flex items-center gap-1.5">
                      {isWriterSupported === null ? (
                        <>
                          <Spinner className="size-3" />
                          <span>Checking...</span>
                        </>
                      ) : isWriterSupported ? (
                        <>
                          <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />
                          <span>Supported</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-destructive" />
                          <span>Not Supported</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {isWriterDownloading && showProgress && (
                  <div className="space-y-1.5 ml-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Download</span>
                      <span className="font-medium">{Math.round(writerDownloadProgress)}%</span>
                    </div>
                    <Progress value={writerDownloadProgress} className="h-1.5" />
                  </div>
                )}
                {isWriterSupported && writerAvailability === null && (
                  <Button
                    onClick={handleCheckWriterAvailability}
                    disabled={isCheckingWriter}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full mt-1"
                  >
                    {isCheckingWriter ? (
                      <>
                        <Spinner className="size-3 mr-1.5" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-3 mr-1.5" />
                        Check Availability
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Language Detector Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Language Detector</span>
                  <Badge variant={languageDetectorStatus.variant} className="gap-1.5">
                    <LanguageDetectorIcon
                      className={cn(
                        'size-3',
                        languageDetectorStatus.color,
                        isLanguageDetectorSupported === null && 'animate-spin'
                      )}
                    />
                    {languageDetectorStatus.label}
                  </Badge>
                </div>
                {isLanguageDetectorSupported !== null && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground ml-1">
                    <span>Support</span>
                    <div className="flex items-center gap-1.5">
                      {isLanguageDetectorSupported === null ? (
                        <>
                          <Spinner className="size-3" />
                          <span>Checking...</span>
                        </>
                      ) : isLanguageDetectorSupported ? (
                        <>
                          <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />
                          <span>Supported</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-destructive" />
                          <span>Not Supported</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {isLanguageDetectorDownloading && showProgress && (
                  <div className="space-y-1.5 ml-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Download</span>
                      <span className="font-medium">{Math.round(languageDetectorDownloadProgress)}%</span>
                    </div>
                    <Progress value={languageDetectorDownloadProgress} className="h-1.5" />
                  </div>
                )}
                {isLanguageDetectorSupported && languageDetectorAvailability === null && (
                  <Button
                    onClick={handleCheckLanguageDetectorAvailability}
                    disabled={isCheckingLanguageDetector}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full mt-1"
                  >
                    {isCheckingLanguageDetector ? (
                      <>
                        <Spinner className="size-3 mr-1.5" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-3 mr-1.5" />
                        Check Availability
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && showErrors && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="size-4" />
                <AlertTitle className="text-xs">Error</AlertTitle>
                <AlertDescription className="text-xs flex items-center justify-between">
                  <span className="line-clamp-2">{error}</span>
                  <button
                    onClick={resetError}
                    className="text-xs underline hover:no-underline ml-2 shrink-0"
                  >
                    Dismiss
                  </button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-2">
          <SummarizerIcon
            className={cn('size-4', summarizerStatus.color, isSupported === null && 'animate-spin')}
          />
          <span className="text-sm font-medium">Summarizer: {summarizerStatus.label}</span>
          {isDownloading && showProgress && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">{Math.round(downloadProgress)}%</span>
              <Progress value={downloadProgress} className="w-20 h-1.5" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <WriterIcon
            className={cn('size-4', writerStatus.color, isWriterSupported === null && 'animate-spin')}
          />
          <span className="text-sm font-medium">Writer: {writerStatus.label}</span>
          {isWriterDownloading && showProgress && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">{Math.round(writerDownloadProgress)}%</span>
              <Progress value={writerDownloadProgress} className="w-20 h-1.5" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RewriterIcon
            className={cn('size-4', rewriterStatus.color, isRewriterSupported === null && 'animate-spin')}
          />
          <span className="text-sm font-medium">Rewriter: {rewriterStatus.label}</span>
          {isRewriterDownloading && showProgress && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">{Math.round(rewriterDownloadProgress)}%</span>
              <Progress value={rewriterDownloadProgress} className="w-20 h-1.5" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LanguageDetectorIcon
            className={cn('size-4', languageDetectorStatus.color, isLanguageDetectorSupported === null && 'animate-spin')}
          />
          <span className="text-sm font-medium">Language Detector: {languageDetectorStatus.label}</span>
          {isLanguageDetectorDownloading && showProgress && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">{Math.round(languageDetectorDownloadProgress)}%</span>
              <Progress value={languageDetectorDownloadProgress} className="w-20 h-1.5" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            <CardTitle>Chrome AI Status</CardTitle>
          </div>
          <Badge variant={overallStatus.variant} className="gap-1.5">
            <OverallStatusIcon
              className={cn(
                'size-3',
                overallStatus.color,
                (isSupported === null || isWriterSupported === null || isLanguageDetectorSupported === null) && 'animate-spin'
              )}
            />
            {overallStatus.label}
          </Badge>
        </div>
        <CardDescription>
          Status of Chrome AI APIs (Summarizer, Writer & Language Detector) availability and model downloads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summarizer Status */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Summarizer Model</h4>
            <Badge variant={summarizerStatus.variant} className="gap-1.5">
              <SummarizerIcon
                className={cn(
                  'size-3',
                  summarizerStatus.color,
                  isSupported === null && 'animate-spin'
                )}
              />
              {summarizerStatus.label}
            </Badge>
          </div>
          
          {/* Summarizer Browser Support */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Browser Support</span>
            <div className="flex items-center gap-2">
              {isSupported === null ? (
                <>
                  <Spinner className="size-3" />
                  <span className="text-muted-foreground">Checking...</span>
                </>
              ) : isSupported ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Supported</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-destructive" />
                  <span className="text-destructive">Not Supported</span>
                </>
              )}
            </div>
          </div>

          {/* Summarizer Model Availability */}
          {isSupported && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Model Availability</span>
              <div className="flex items-center gap-2">
                {availability === null ? (
                  <>
                    <Spinner className="size-3" />
                    <span className="text-muted-foreground">Unknown</span>
                  </>
                ) : availability === 'available' ? (
                  <>
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Available</span>
                  </>
                ) : availability === 'downloadable' ? (
                  <>
                    <Download className="size-4 text-primary animate-pulse" />
                    <span className="text-primary">Downloadable</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-destructive" />
                    <span className="text-destructive">Unavailable</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Summarizer Download Progress */}
          {isDownloading && showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Download Progress</span>
                <span className="font-medium">{Math.round(downloadProgress)}%</span>
              </div>
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}

          {/* Summarizer Actions */}
          {isSupported && availability === null && (
            <div className="pt-1">
              <Button
                onClick={handleCheckAvailability}
                disabled={isChecking}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <Spinner className="size-3 mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3 mr-2" />
                    Check Summarizer Availability
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Writer Status */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Writer Model</h4>
            <Badge variant={writerStatus.variant} className="gap-1.5">
              <WriterIcon
                className={cn(
                  'size-3',
                  writerStatus.color,
                  isWriterSupported === null && 'animate-spin'
                )}
              />
              {writerStatus.label}
            </Badge>
          </div>
          
          {/* Writer Browser Support */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Browser Support</span>
            <div className="flex items-center gap-2">
              {isWriterSupported === null ? (
                <>
                  <Spinner className="size-3" />
                  <span className="text-muted-foreground">Checking...</span>
                </>
              ) : isWriterSupported ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Supported</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-destructive" />
                  <span className="text-destructive">Not Supported</span>
                </>
              )}
            </div>
          </div>

          {/* Writer Model Availability */}
          {isWriterSupported && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Model Availability</span>
              <div className="flex items-center gap-2">
                {writerAvailability === null ? (
                  <>
                    <Spinner className="size-3" />
                    <span className="text-muted-foreground">Unknown</span>
                  </>
                ) : writerAvailability === 'available' ? (
                  <>
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Available</span>
                  </>
                ) : writerAvailability === 'downloadable' ? (
                  <>
                    <Download className="size-4 text-primary animate-pulse" />
                    <span className="text-primary">Downloadable</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-destructive" />
                    <span className="text-destructive">Unavailable</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Writer Download Progress */}
          {isWriterDownloading && showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Download Progress</span>
                <span className="font-medium">{Math.round(writerDownloadProgress)}%</span>
              </div>
              <Progress value={writerDownloadProgress} className="h-2" />
            </div>
          )}

          {/* Writer Actions */}
          {isWriterSupported && writerAvailability === null && (
            <div className="pt-1">
              <Button
                onClick={handleCheckWriterAvailability}
                disabled={isCheckingWriter}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isCheckingWriter ? (
                  <>
                    <Spinner className="size-3 mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3 mr-2" />
                    Check Writer Availability
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Rewriter Status */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Rewriter Model</h4>
            <Badge variant={rewriterStatus.variant} className="gap-1.5">
              <RewriterIcon
                className={cn(
                  'size-3',
                  rewriterStatus.color,
                  isRewriterSupported === null && 'animate-spin'
                )}
              />
              {rewriterStatus.label}
            </Badge>
          </div>

          {/* Rewriter Browser Support */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Browser Support</span>
            <div className="flex items-center gap-2">
              {isRewriterSupported === null ? (
                <>
                  <Spinner className="size-3" />
                  <span className="text-muted-foreground">Checking...</span>
                </>
              ) : isRewriterSupported ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Supported</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-destructive" />
                  <span className="text-destructive">Not Supported</span>
                </>
              )}
            </div>
          </div>

          {/* Rewriter Model Availability */}
          {isRewriterSupported && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Model Availability</span>
              <div className="flex items-center gap-2">
                {rewriterAvailability === null ? (
                  <>
                    <Spinner className="size-3" />
                    <span className="text-muted-foreground">Unknown</span>
                  </>
                ) : rewriterAvailability === 'available' ? (
                  <>
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Available</span>
                  </>
                ) : rewriterAvailability === 'downloadable' ? (
                  <>
                    <Download className="size-4 text-primary animate-pulse" />
                    <span className="text-primary">Downloadable</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-destructive" />
                    <span className="text-destructive">Unavailable</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Rewriter Download Progress */}
          {isRewriterDownloading && showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Download Progress</span>
                <span className="font-medium">{Math.round(rewriterDownloadProgress)}%</span>
              </div>
              <Progress value={rewriterDownloadProgress} className="h-2" />
            </div>
          )}

          {/* Rewriter Actions */}
          {isRewriterSupported && rewriterAvailability === null && (
            <div className="pt-1">
              <Button
                onClick={handleCheckRewriterAvailability}
                disabled={isCheckingRewriter}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isCheckingRewriter ? (
                  <>
                    <Spinner className="size-3 mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3 mr-2" />
                    Check Rewriter Availability
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Language Detector Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Language Detector</h4>
            <Badge variant={languageDetectorStatus.variant} className="gap-1.5">
              <LanguageDetectorIcon
                className={cn(
                  'size-3',
                  languageDetectorStatus.color,
                  isLanguageDetectorSupported === null && 'animate-spin'
                )}
              />
              {languageDetectorStatus.label}
            </Badge>
          </div>
          
          {/* Language Detector Browser Support */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Browser Support</span>
            <div className="flex items-center gap-2">
              {isLanguageDetectorSupported === null ? (
                <>
                  <Spinner className="size-3" />
                  <span className="text-muted-foreground">Checking...</span>
                </>
              ) : isLanguageDetectorSupported ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Supported</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-destructive" />
                  <span className="text-destructive">Not Supported</span>
                </>
              )}
            </div>
          </div>

          {/* Language Detector Model Availability */}
          {isLanguageDetectorSupported && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Model Availability</span>
              <div className="flex items-center gap-2">
                {languageDetectorAvailability === null ? (
                  <>
                    <Spinner className="size-3" />
                    <span className="text-muted-foreground">Unknown</span>
                  </>
                ) : languageDetectorAvailability === 'available' ? (
                  <>
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Available</span>
                  </>
                ) : languageDetectorAvailability === 'downloadable' ? (
                  <>
                    <Download className="size-4 text-primary animate-pulse" />
                    <span className="text-primary">Downloadable</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-destructive" />
                    <span className="text-destructive">Unavailable</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Language Detector Download Progress */}
          {isLanguageDetectorDownloading && showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Download Progress</span>
                <span className="font-medium">{Math.round(languageDetectorDownloadProgress)}%</span>
              </div>
              <Progress value={languageDetectorDownloadProgress} className="h-2" />
            </div>
          )}

          {/* Language Detector Actions */}
          {isLanguageDetectorSupported && languageDetectorAvailability === null && (
            <div className="pt-1">
              <Button
                onClick={handleCheckLanguageDetectorAvailability}
                disabled={isCheckingLanguageDetector}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isCheckingLanguageDetector ? (
                  <>
                    <Spinner className="size-3 mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3 mr-2" />
                    Check Language Detector Availability
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && showErrors && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={resetError}
                className="text-xs underline hover:no-underline ml-2"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

