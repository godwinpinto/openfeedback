'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Camera, Info } from 'lucide-react';

// Type guard for browser environment
const isBrowser = typeof window !== 'undefined';

export interface GenUIHumanVerificationProps {
  /**
   * Custom instruction text for the user (if not provided, will be generated using Prompt API)
   * @default undefined (will be generated)
   */
  instruction?: string;
  
  /**
   * Prompt to generate instruction using Prompt API (LanguageModel)
   * @default "Write a very short, concise instruction for human verification through selfie, ask them to do some gesture in selfie, gesture should be static. Keep it brief, maximum 20 words."
   */
  instructionPrompt?: string;
  
  /**
   * Callback when verification succeeds
   */
  onVerified?: (confidence: number) => void;
  
  /**
   * Callback when verification fails
   */
  onVerificationFailed?: () => void;
  
  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;
  
  /**
   * Additional className for the container
   */
  className?: string;
  
  /**
   * Custom button text
   * @default "Verify you are human"
   */
  buttonText?: string;
}

type VerificationState = 
  | 'idle'               // Initial state, button visible
  | 'generating'         // Generating instruction
  | 'prompting'          // Dialog open, "Start Camera" button visible
  | 'starting-camera'    // "Start Camera" clicked, waiting for stream
  | 'countdown'          // Camera open, 5s timer running
  | 'verifying'          // Image captured, analysis in progress
  | 'failed-attempt'     // Verification failed, "Retry" button visible
  | 'success'            // Final success state, dialog closed
  | 'failed-final';      // Final failed state (max attempts), dialog closed

interface VerificationResult {
  success: boolean;
  confidence?: number;
  reason?: string;
}

const MAX_ATTEMPTS = 3;

export const GenUIHumanVerification: React.FC<GenUIHumanVerificationProps> = ({
  instruction: propInstruction,
  instructionPrompt = 'Write a very short, concise instruction for human verification through selfie, ask them to do some gesture in selfie, gesture should be static. Keep it brief, maximum 20 words.',
  onVerified,
  onVerificationFailed,
  onError,
  className,
  buttonText = 'Verify you are human',
}) => {
  const [state, setState] = React.useState<VerificationState>('idle');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [lastFailureReason, setLastFailureReason] = React.useState<string | null>(null);
  const [attemptCount, setAttemptCount] = React.useState(1);
  const [countdownValue, setCountdownValue] = React.useState<number | null>(null);
  
  const [isStreamReady, setIsStreamReady] = React.useState(false);
  const [generatedInstruction, setGeneratedInstruction] = React.useState<string | null>(null);
  const [isGeneratingInstruction, setIsGeneratingInstruction] = React.useState(false);
  
  // Use prop instruction if provided, otherwise use generated instruction
  const instruction = propInstruction || generatedInstruction || 'Take your selfie following the instructions below';
  
  // Keep instruction ref up to date
  React.useEffect(() => {
    instructionRef.current = instruction;
  }, [instruction]);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const sessionRef = React.useRef<any>(null);
  const instructionRef = React.useRef<string>('');
  const countdownTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const fullCleanup = React.useCallback(() => {
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreamReady(false);
    
    // Destroy language model session
    if (sessionRef.current) {
      try {
        const destroyResult = sessionRef.current.destroy();
        if (destroyResult && typeof destroyResult.catch === 'function') {
          destroyResult.catch(() => {});
        }
      } catch (err) {
        // Ignore destroy errors
      }
      sessionRef.current = null;
    }
    
    // Clear any pending timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownValue(null);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      fullCleanup();
    };
  }, [fullCleanup]);
  
  // Handle dialog open/close
  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      fullCleanup();
      setIsDialogOpen(false);
      // Only reset to idle if not in a final success/fail state
      if (state !== 'success' && state !== 'failed-final') {
        setState('idle');
      }
    }
  }, [fullCleanup, state]);
  
  const closeDialogWithDelay = React.useCallback(() => {
     setTimeout(() => {
       setIsDialogOpen(false);
       // The onOpenChange handler will do the full cleanup
     }, 100);
  }, []);

  const startCamera = React.useCallback(async () => {
    if (streamRef.current) {
      // Camera is already running
      startCountdown();
      return;
    }
    
    try {
      setStatusMessage('Starting camera...');
      setState('starting-camera');
      
      if (!isBrowser || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not available in this browser.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      streamRef.current = stream;
      setIsStreamReady(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject(new Error('Video ref lost'));
          const onLoadedMetadata = () => {
            videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };
          videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
          setTimeout(() => {
             videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
             reject(new Error('Camera metadata timeout'));
          }, 3000);
        });
        
        await videoRef.current.play();
        setIsStreamReady(true);
        startCountdown();
      }
    } catch (err) {
      const error = err as Error;
      setStatusMessage(`Failed to access camera: ${error.message}`);
      setState('prompting'); // Go back to "Start Camera"
      setIsStreamReady(false);
      onError?.(error);
    }
  }, [onError]); // Removed startCountdown from deps, it's called internally

  const startCountdown = React.useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    setState('countdown');
    setCountdownValue(5);
    setStatusMessage('Capturing in 5s...');

    countdownTimerRef.current = setInterval(() => {
      setCountdownValue(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          setStatusMessage('Capturing...');
          captureAndVerify();
          return null;
        }
        setStatusMessage(`Capturing in ${prev - 1}s...`);
        return prev - 1;
      });
    }, 1000);
  }, []); // captureAndVerify is stable as it uses refs/setters

  const captureAndVerify = React.useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setStatusMessage('Capture failed: Missing video reference.');
      setState('failed-attempt');
      return;
    }

    try {
      setState('verifying');
      setStatusMessage('Verifying...');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Camera stream STAYS running
      
      await verifyImage(canvas);
    } catch (err) {
      const error = err as Error;
      setStatusMessage(`Capture error: ${error.message}`);
      setLastFailureReason(error.message);
      
      // Use updater function to get latest count
      setAttemptCount(prevAttemptCount => {
        if (prevAttemptCount >= MAX_ATTEMPTS) {
          setState('failed-final');
          closeDialogWithDelay();
          onVerificationFailed?.();
        } else {
          setState('failed-attempt');
        }
        return prevAttemptCount + 1;
      });
      onError?.(error);
    }
  }, [onError, onVerificationFailed, closeDialogWithDelay]); // Removed attemptCount, verifyImage

  const verifyImage = React.useCallback(async (imageCanvas: HTMLCanvasElement) => {
    try {
      if (!isBrowser) throw new Error('LanguageModel API is only available in browser.');

      const globalSelf = (typeof self !== 'undefined' ? self : window) as any;
      if (typeof globalSelf.LanguageModel === 'undefined') {
        throw new Error('Chrome LanguageModel API is not available.');
      }

      const availability = await globalSelf.LanguageModel.availability({
        expectedInputs: [{ type: 'image' }],
      });
      if (availability === 'unavailable') {
        throw new Error('LanguageModel is not available on this device.');
      }

      const session = await globalSelf.LanguageModel.create({
        expectedInputs: [{ type: 'image' }],
      });
      sessionRef.current = session;

      const currentInstruction = instructionRef.current;
      const promptText = `Does this photo show a person following this instruction: "${currentInstruction}"? Analyze the image carefully and respond with a JSON object containing:
- "verified" (true if the person is following the instruction correctly, false otherwise)
- "confidence" (a number between 0 and 1)
- "reason" (if verified is false, provide a brief reason why)`;

      const responseSchema = {
        type: 'object',
        properties: {
          verified: { type: 'boolean' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          reason: { type: 'string' },
        },
        required: ['verified', 'confidence'],
      };

      const response = await session.prompt(
        [
          {
            role: 'user',
            content: [
              { type: 'text', value: promptText },
              { type: 'image', value: imageCanvas },
            ],
          },
        ],
        { responseConstraint: responseSchema }
      );

      let result: VerificationResult;
      try {
        const parsed = JSON.parse(response);
        result = {
          success: parsed.verified === true,
          confidence: parsed.confidence,
          reason: parsed.reason,
        };
      } catch (parseError) {
        // **FIX:** Don't re-throw. Handle parse failure as a verification failure.
        console.warn('[AIHumanVerification] Failed to parse JSON, treating as failure.');
        result = {
          success: false,
          confidence: 0,
          reason: 'Failed to parse verification response. Please try again.',
        };
      }
      
      // Cleanup session
      try {
        const destroyResult = session.destroy();
        if (destroyResult && typeof destroyResult.catch === 'function') {
          destroyResult.catch(() => {});
        }
      } catch (err) { /* Ignore */ }
      sessionRef.current = null;
      
      // --- Handle Result ---
      if (result.success) {
        console.log(`[AIHumanVerification] Success, Confidence: ${result.confidence}`);
        setState('success');
        onVerified?.(result.confidence || 0);
        closeDialogWithDelay();
      } else {
        const reason = result.reason || 'Verification failed. Please try again.';
        setLastFailureReason(reason);
        setStatusMessage(reason);
        
        // Use updater function to get latest count
        setAttemptCount(prevAttemptCount => {
          if (prevAttemptCount >= MAX_ATTEMPTS) {
            setState('failed-final');
            onVerificationFailed?.();
            closeDialogWithDelay();
          } else {
            setState('failed-attempt');
          }
          return prevAttemptCount + 1;
        });
      }

    } catch (err) {
      const error = err as Error;
      const reason = `Verification error: ${error.message}`;
      setLastFailureReason(reason);
      setStatusMessage(reason);
      
      // Use updater function to get latest count
      setAttemptCount(prevAttemptCount => {
        if (prevAttemptCount >= MAX_ATTEMPTS) {
          setState('failed-final');
          onVerificationFailed?.();
          closeDialogWithDelay();
        } else {
          setState('failed-attempt');
        }
        return prevAttemptCount + 1;
      });
      onError?.(error);
    }
  }, [onVerified, onVerificationFailed, onError, closeDialogWithDelay]); // Removed attemptCount

  // Generate instruction
  const generateInstruction = React.useCallback(async () => {
    if (propInstruction) return;

    try {
      setIsGeneratingInstruction(true);
      if (!isBrowser) throw new Error('LanguageModel API only available in browser.');
      
      const globalSelf = (typeof self !== 'undefined' ? self : window) as any;
      if (typeof globalSelf.LanguageModel === 'undefined') {
        throw new Error('Chrome LanguageModel API is not available.');
      }
      
      const availability = await globalSelf.LanguageModel.availability();
      if (availability === 'unavailable') {
        throw new Error('LanguageModel is not available on this device.');
      }

      const session = await globalSelf.LanguageModel.create();
      const fullPrompt = `${instructionPrompt}\n\nRespond with only the instruction text. Maximum 15 words.`;
      
      const generated = await session.prompt(fullPrompt);
      
      // **FIX:** Replaced simple cleanup with robust logic
      console.log('[AIHumanVerification] Raw generated instruction:', generated);
          
      // Remove markdown formatting
      let cleaned = generated.trim();
      cleaned = cleaned.replace(/\*\*/g, ''); // Remove bold
      cleaned = cleaned.replace(/^#+\s*/gm, ''); // Remove headings
      cleaned = cleaned.replace(/^\d+\.\s*/gm, ''); // Remove numbered lists
      cleaned = cleaned.replace(/^[-*]\s*/gm, ''); // Remove bullet points
      
      // Remove quotes if present at the start/end
      cleaned = cleaned.replace(/^["']|["']$/g, '');
      
      // Split into sentences
      const sentences = cleaned.split(/([.!?]+)/).filter((s: string) => s.trim().length > 0);
      
      // Reconstruct sentences with their punctuation
      let reconstructed: string[] = [];
      for (let i = 0; i < sentences.length; i += 2) {
        if (sentences[i]) {
          const sentence = sentences[i].trim();
          const punctuation = sentences[i + 1] || '';
          if (sentence.length > 0) {
            reconstructed.push(sentence + punctuation);
          }
        }
      }
      
      // Take up to 20 words total across sentences, but prefer keeping complete sentences
      let result = '';
      let wordCount = 0;
      const maxWords = 20;
      
      for (const sentence of reconstructed) {
        const sentenceWords = sentence.split(/\s+/).length;
        if (wordCount + sentenceWords <= maxWords) {
          result += (result ? ' ' : '') + sentence;
          wordCount += sentenceWords;
        } else {
          // If we can't fit the full sentence, truncate at word boundary
          const remainingWords = maxWords - wordCount;
          if (remainingWords > 0) {
            const words = sentence.split(/\s+/).slice(0, remainingWords);
            result += (result ? ' ' : '') + words.join(' ');
          }
          break;
        }
      }
      
      cleaned = result.trim();
      
      // If we got nothing, fall back to first 20 words of original
      if (!cleaned) {
        const words = generated.trim().split(/\s+/).slice(0, 20);
        cleaned = words.join(' ');
      }
      
      // Ensure it ends with proper punctuation or add period
      if (!cleaned.match(/[.!?]$/)) {
        cleaned = cleaned + '.';
      }
      
      console.log('[AIHumanVerification] Cleaned instruction:', cleaned);
      // **END FIX**

      setGeneratedInstruction(cleaned);
      
      try {
        const destroyResult = session.destroy();
        if (destroyResult && typeof destroyResult.catch === 'function') {
          destroyResult.catch(() => {});
        }
      } catch (err) { /* Ignore */ }
      
    } catch (err) {
      const error = err as Error;
      console.error('[AIHumanVerification] Failed to generate instruction:', error);
      setGeneratedInstruction('take your selfie with your hand covering your mouth.');
      onError?.(error);
    } finally {
      setIsGeneratingInstruction(false);
    }
  }, [propInstruction, instructionPrompt, onError]);

  // Main button click handler
  const handleStart = React.useCallback(async () => {
    setState('generating');
    setLastFailureReason(null);
    setStatusMessage(null);
    
    if (!propInstruction) {
      await generateInstruction();
    }
    
    setAttemptCount(1); // Reset attempt count
    setState('prompting');
    setIsDialogOpen(true);
  }, [propInstruction, generateInstruction]);

  // Retry button click handler
  const handleRetry = React.useCallback(() => {
    // Note: The logic in verifyImage/captureAndVerify already increments the count
    // We just need to start the countdown for the *next* attempt.
    startCountdown();
  }, [startCountdown]);

  // Create hidden canvas on mount
  React.useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'none';
      canvasRef.current = canvas;
    }
  }, []);
  
  // **FIX:** Simplified `useCallback` dependencies
  // By using `setAttemptCount(prev => ...)` inside the fail handlers,
  // we no longer need to pass `attemptCount` as a dependency to
  // `verifyImage` or `captureAndVerify`. This breaks the stale closure chain
  // and makes the callbacks more stable.
  React.useEffect(() => {
    startCountdown.current = () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      
      setState('countdown');
      setCountdownValue(5);
      setStatusMessage('Capturing in 5s...');
  
      countdownTimerRef.current = setInterval(() => {
        setCountdownValue(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            countdownTimerRef.current = null;
            setStatusMessage('Capturing...');
            captureAndVerifyRef.current(); // Use ref
            return null;
          }
          setStatusMessage(`Capturing in ${prev - 1}s...`);
          return prev - 1;
        });
      }, 1000);
    };
  }, []); // Empty dep array

  const captureAndVerifyRef = React.useRef(captureAndVerify);
  const startCountdownRef = React.useRef(startCountdown);

  React.useEffect(() => {
    captureAndVerifyRef.current = captureAndVerify;
    startCountdownRef.current = startCountdown;
  });


  // --- Render Status Bar ---
  const renderStatus = () => {
    switch (state) {
      case 'starting-camera':
        return <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {statusMessage}</>;
      case 'countdown':
        return <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {statusMessage}</>;
      case 'verifying':
        return <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {statusMessage}</>;
      case 'failed-attempt':
        return <><XCircle className="w-4 h-4 mr-2 text-destructive" /> {statusMessage}</>;
      case 'prompting':
        return <><Info className="w-4 h-4 mr-2 text-blue-500" /> Ready to start verification.</>;
      default:
        return null;
    }
  };

  // --- Render Buttons ---
  const renderButtons = () => {
    switch (state) {
      case 'prompting':
        return (
          <>
            <Button onClick={() => setIsDialogOpen(false)} variant="outline">Cancel</Button>
            <Button onClick={startCamera} size="lg">
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          </>
        );
      case 'starting-camera':
        return (
          <>
            <Button onClick={() => setIsDialogOpen(false)} variant="outline">Cancel</Button>
            <Button disabled size="lg">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting...
            </Button>
          </>
        );
      case 'failed-attempt':
        return (
          <>
            <Button onClick={() => setIsDialogOpen(false)} variant="outline">Cancel</Button>
            {/* Displaying the "next" attempt number.
              After attempt 1 fails, attemptCount is set to 2.
              Button shows "Retry Attempt (2/3)". This is correct.
            */}
            <Button onClick={handleRetry} size="lg">
              Retry
            </Button>
          </>
        );
      case 'countdown':
      case 'verifying':
        return (
          <p className="text-sm text-muted-foreground text-center w-full">
            Verification in progress...
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {(state === 'idle' || state === 'generating') && (
        <div className="text-center space-y-4">
          <Button
            onClick={handleStart}
            disabled={state === 'generating'}
            size="lg"
            className="min-w-[200px]"
          >
            {state === 'generating' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Please wait...
              </>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      )}

      {state === 'success' && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200 font-semibold text-lg">
            Verification Successful!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300 mt-2">
            You have been successfully verified as human.
          </AlertDescription>
        </Alert>
      )}

      {state === 'failed-final' && (
        <Alert variant="destructive">
          <XCircle className="w-5 h-5" />
          <AlertTitle className="font-semibold text-lg">Verification Failed</AlertTitle>
          <AlertDescription className="mt-2">
            <p>We could not verify you</p>
            {lastFailureReason && (
              <p className="text-sm mt-2">
                <strong>Reason:</strong> {lastFailureReason}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0" showCloseButton={true}>
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Human Verification</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 px-6">
            {/* Status Bar */}
            <div className="text-sm font-medium h-6 flex items-center text-muted-foreground">
              {renderStatus()}
            </div>
          
            {/* Instruction */}
            <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="font-semibold text-blue-800 dark:text-blue-200">
                Follow this instruction:
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                {instruction}
              </AlertDescription>
            </Alert>
          
            {/* Camera Viewport */}
            <div 
              className="relative w-full bg-black rounded-lg overflow-hidden"
              style={{ 
                minHeight: '320px',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover block"
                style={{ display: isStreamReady ? 'block' : 'none' }}
              />
              {(!isStreamReady && state !== 'prompting') && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-white">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-base">Loading camera...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer / Buttons */}
          <div className="flex gap-3 justify-end p-6 bg-muted/50 rounded-b-lg">
            {renderButtons()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};