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
import { CheckCircle2, XCircle, Loader2, Camera } from 'lucide-react';

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
  | 'idle' 
  | 'camera-open' 
  | 'capturing' 
  | 'verifying' 
  | 'verified' 
  | 'failed';

interface VerificationResult {
  success: boolean;
  confidence?: number;
  reason?: string;
}

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
  const [error, setError] = React.useState<string | null>(null);
  const [verificationResult, setVerificationResult] = React.useState<VerificationResult | null>(null);
  const [isStreamReady, setIsStreamReady] = React.useState(false);
  const [generatedInstruction, setGeneratedInstruction] = React.useState<string | null>(null);
  const [isGeneratingInstruction, setIsGeneratingInstruction] = React.useState(false);
  
  // Use prop instruction if provided, otherwise use generated instruction
  const instruction = propInstruction || generatedInstruction || 'Take your selfie following the instructions below';
  
  // Keep instruction ref up to date (always has the latest instruction value)
  React.useEffect(() => {
    instructionRef.current = instruction;
    console.log('[AIHumanVerification] Instruction updated in ref:', instruction);
  }, [instruction]);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const sessionRef = React.useRef<any>(null);
  const instructionRef = React.useRef<string>('');

  // Cleanup function
  const cleanup = React.useCallback(() => {
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
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
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startCamera = React.useCallback(async () => {
    try {
      setError(null);
      
      // Check if we're in browser environment
      if (!isBrowser || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is only available in browser environment.');
      }
      
      setState('camera-open'); // Set state first to show UI
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', // Front-facing camera for selfie
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      streamRef.current = stream;
      setIsStreamReady(false);
      
      // Set video stream and wait for it to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load
        await new Promise((resolve) => {
          if (videoRef.current) {
            const handleLoadedMetadata = () => {
              if (videoRef.current) {
                videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
              }
              resolve(void 0);
            };
            videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
            
            // Fallback timeout
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
                resolve(void 0);
              }
            }, 2000);
          }
        });
        
        await videoRef.current.play();
        setIsStreamReady(true);
      }
    } catch (err) {
      const error = err as Error;
      setError(`Failed to access camera: ${error.message}`);
      setState('idle');
      setIsStreamReady(false);
      cleanup();
      onError?.(error);
    }
  }, [onError, cleanup]);

  const captureImage = React.useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      setState('capturing');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsStreamReady(false);
      
      // Start verification
      await verifyImage(canvas);
    } catch (err) {
      const error = err as Error;
      setError(`Failed to capture image: ${error.message}`);
      setState('idle');
      cleanup();
      onError?.(error);
    }
  }, [onError, cleanup]);

  const verifyImage = React.useCallback(async (imageCanvas: HTMLCanvasElement) => {
    try {
      setState('verifying');
      setError(null);

      // Check if we're in browser environment
      if (!isBrowser) {
        throw new Error('LanguageModel API is only available in browser environment.');
      }

      // Access global self (which is window in browser)
      const globalSelf = (typeof self !== 'undefined' ? self : window) as any;

      // Check if LanguageModel is available
      if (typeof globalSelf.LanguageModel === 'undefined') {
        throw new Error('Chrome LanguageModel API is not available. Please use Chrome 138+ with required hardware.');
      }

      // Check availability
      const availability = await globalSelf.LanguageModel.availability({
        expectedInputs: [{ type: 'image' }],
      });

      if (availability === 'unavailable') {
        throw new Error('LanguageModel is not available on this device. Please check hardware requirements.');
      }

      // Create session with expectedInputs for image
      const session = await globalSelf.LanguageModel.create({
        expectedInputs: [{ type: 'image' }],
      });
      
      sessionRef.current = session;

      // Get the current instruction value from ref (always has the latest value)
      const currentInstruction = instructionRef.current;
      
      console.log('[AIHumanVerification] Using instruction for verification:', currentInstruction);
      console.log('[AIHumanVerification] Current instruction from ref:', instructionRef.current);
      console.log('[AIHumanVerification] propInstruction:', propInstruction);
      console.log('[AIHumanVerification] generatedInstruction:', generatedInstruction);
      console.log('[AIHumanVerification] computed instruction:', instruction);
      
      // Create the prompt with image using the current instruction
      const promptText = `Does this photo show a person following this instruction: "${currentInstruction}"? Analyze the image carefully and respond with a JSON object containing:
- "verified" (true if the person is following the instruction correctly, false otherwise)
- "confidence" (a number between 0 and 1 representing how confident you are in your answer)
- "reason" (if verified is false, provide a brief reason why the verification failed, e.g., "person is not covering mouth", "wrong gesture detected", etc.)`;

      // Response constraint JSON schema
      const responseSchema = {
        type: 'object',
        properties: {
          verified: { type: 'boolean' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          reason: { type: 'string' }, // Optional reason for verification result
        },
        required: ['verified', 'confidence'],
      };

      // Prompt with image using content array format
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
        {
          responseConstraint: responseSchema,
        }
      );

      // Log the raw response for debugging
      console.log('[AIHumanVerification] Human verification response:', response);
      
      // Parse JSON response
      let result: VerificationResult;
      try {
        const parsed = JSON.parse(response);
        console.log('[AIHumanVerification] Parsed verification result:', parsed);
        result = {
          success: parsed.verified === true,
          confidence: parsed.confidence,
          reason: parsed.reason,
        };
        
        // Log reason if verification failed
        if (!result.success && result.reason) {
          console.log('[AIHumanVerification] Verification failed reason:', result.reason);
        }
      } catch (parseError) {
        // If parsing fails, try to extract from text response
        console.warn('[AIHumanVerification] Failed to parse JSON, attempting text extraction');
        const lowerResponse = response.toLowerCase();
        const hasYes = lowerResponse.includes('yes') || lowerResponse.includes('true');
        const hasConfidence = /confidence[\s:]*([\d.]+)/i.exec(response);
        
        // Try to extract reason from text
        const reasonMatch = /reason[:\s]+([^.]+)/i.exec(response);
        const extractedReason = reasonMatch ? reasonMatch[1].trim() : undefined;
        
        result = {
          success: hasYes,
          confidence: hasConfidence ? parseFloat(hasConfidence[1]) : 0.5,
          reason: extractedReason,
        };
        console.log('[AIHumanVerification] Extracted result from text:', result);
        
        // Log reason if verification failed
        if (!result.success && result.reason) {
          console.log('[AIHumanVerification] Verification failed reason:', result.reason);
        }
      }

      setVerificationResult(result);
      
      if (result.success) {
        setState('verified');
        onVerified?.(result.confidence || 0);
      } else {
        setState('failed');
        onVerificationFailed?.();
      }

      // Cleanup session
      try {
        const destroyResult = session.destroy();
        if (destroyResult && typeof destroyResult.catch === 'function') {
          destroyResult.catch(() => {});
        }
      } catch (err) {
        // Ignore destroy errors
      }
      sessionRef.current = null;
    } catch (err) {
      const error = err as Error;
      setError(`Verification failed: ${error.message}`);
      setState('failed');
      cleanup();
      onError?.(error);
    }
  }, [onVerified, onVerificationFailed, onError, cleanup]); // No need for instruction in deps since we use ref

  // Generate instruction using Prompt API (LanguageModel)
  const generateInstruction = React.useCallback(async () => {
    // If prop instruction is provided, skip generation
    if (propInstruction) {
      return;
    }

    try {
      setIsGeneratingInstruction(true);
      setError(null);
      
      // Check if we're in browser environment
      if (!isBrowser) {
        throw new Error('LanguageModel API is only available in browser environment.');
      }

      // Access global self (which is window in browser)
      const globalSelf = (typeof self !== 'undefined' ? self : window) as any;

      // Check if LanguageModel is available
      if (typeof globalSelf.LanguageModel === 'undefined') {
        throw new Error('Chrome LanguageModel API is not available. Please use Chrome 138+ with required hardware.');
      }

      // Check availability
      const availability = await globalSelf.LanguageModel.availability();
      if (availability === 'unavailable') {
        throw new Error('LanguageModel is not available on this device. Please check hardware requirements.');
      }

      console.log('[AIHumanVerification] Generating instruction with prompt:', instructionPrompt);
      
      // Create session for instruction generation
      const session = await globalSelf.LanguageModel.create();
      
      // Create prompt with constraint to keep it short
      const fullPrompt = `${instructionPrompt}

Respond with only the instruction text, no extra explanations or formatting. Maximum 15 words.`;
      
      const generated = await session.prompt(fullPrompt);
      
      console.log('[AIHumanVerification] Prompt API response:', generated);
      
      // Clean up the response - extract just the essential instruction
      let cleaned = generated.trim();
      
      console.log('[AIHumanVerification] Raw generated instruction:', cleaned);
      
      // Remove markdown formatting
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
      
      // Destroy session
      try {
        const destroyResult = session.destroy();
        if (destroyResult && typeof destroyResult.catch === 'function') {
          destroyResult.catch(() => {});
        }
      } catch (err) {
        // Ignore destroy errors
      }
      
      setGeneratedInstruction(cleaned);
    } catch (err) {
      const error = err as Error;
      console.error('[AIHumanVerification] Failed to generate instruction:', error);
      // Fallback to default instruction if generation fails
      setGeneratedInstruction('take your selfie with your hand covering your mouth');
      setError(`Failed to generate instruction: ${error.message}`);
      onError?.(error);
    } finally {
      setIsGeneratingInstruction(false);
    }
  }, [propInstruction, instructionPrompt, onError]);

  const handleStart = React.useCallback(async () => {
    setState('idle');
    setError(null);
    setVerificationResult(null);
    setIsStreamReady(false);
    
    // Generate instruction first if not provided
    if (!propInstruction) {
      await generateInstruction();
    }
    
    startCamera();
  }, [startCamera, propInstruction, generateInstruction]);

  const handleRetry = React.useCallback(() => {
    cleanup();
    setState('idle');
    setError(null);
    setVerificationResult(null);
    setIsStreamReady(false);
  }, [cleanup]);

  // Create hidden canvas for image capture
  React.useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'none';
      canvasRef.current = canvas;
    }
  }, []);

  return (
    <div className={className} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {state === 'idle' && (
        <div className="text-center space-y-4">
          <Button
            onClick={handleStart}
            disabled={isGeneratingInstruction}
            size="lg"
            className="min-w-[200px]"
          >
            {isGeneratingInstruction ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating instruction...
              </>
            ) : (
              buttonText
            )}
          </Button>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Dialog open={state === 'camera-open'} onOpenChange={(open) => {
        if (!open) {
          cleanup();
          setState('idle');
        }
      }}>
        <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Take Your Selfie</DialogTitle>
            <DialogDescription>
              Follow the instruction below to verify you are human
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div 
              className="relative w-full bg-black rounded-lg overflow-hidden"
              style={{ 
                minHeight: '400px',
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
              />
              {!isStreamReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-white">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-base">Loading camera...</span>
                  </div>
                </div>
              )}
              <div
                className="absolute bottom-4 left-4 right-4 bg-black/75 text-white p-3 rounded-lg text-sm text-center font-medium"
              >
                {instruction}
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={captureImage}
                disabled={!isStreamReady || !streamRef.current}
                size="lg"
                className="min-w-[140px]"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Selfie
              </Button>
              <Button
                onClick={() => {
                  cleanup();
                  setState('idle');
                }}
                variant="outline"
                size="lg"
                className="min-w-[140px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {state === 'verifying' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="text-lg font-semibold">Verifying...</div>
          <div className="text-sm text-muted-foreground">Analyzing your selfie</div>
        </div>
      )}

      {state === 'verified' && verificationResult && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200 font-semibold text-lg">
            Verification Successful!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300 mt-2">
            <div className="space-y-2">
              <p>You have been successfully verified as human.</p>
              {verificationResult.confidence !== undefined && (
                <p className="text-sm font-medium">
                  Confidence: {(verificationResult.confidence * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {state === 'failed' && (
        <Alert variant="destructive">
          <XCircle className="w-5 h-5" />
          <AlertTitle className="font-semibold text-lg">Verification Failed</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-4">
              {error && (
                <p className="text-sm">{error}</p>
              )}
              {!error && (
                <p>Please make sure you follow the instruction correctly and try again.</p>
              )}
              <Button onClick={handleRetry} className="mt-2">
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
