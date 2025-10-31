'use client';

import { useEffect, useState } from 'react';
import { Callout } from 'fumadocs-ui/components/callout';

type AvailabilityStatus = 'available' | 'downloadable' | 'downloading' | 'unavailable' | null;

export function ChromeCheck() {
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return;
    }

    // Check if Chrome built-in AI APIs are available
    const checkAvailability = async () => {
      try {
        // Check if LanguageModel API exists (available in Chrome 138+)
        if ('LanguageModel' in window) {
          const status = await (window as any).LanguageModel.availability();
          setAvailabilityStatus(status);
        } else if ('Summarizer' in window) {
          // Fallback to Summarizer API (available in Chrome 137+)
          const status = await (window as any).Summarizer.availability();
          setAvailabilityStatus(status);
        } else {
          // APIs not available (might be older Chrome version or not enabled)
          setAvailabilityStatus('unavailable');
        }
      } catch (error) {
        // If availability check fails, assume unavailable
        setAvailabilityStatus('unavailable');
      } finally {
        setIsChecking(false);
      }
    };

    checkAvailability();
  }, []);

  // Don't render anything during SSR or while checking
  if (isChecking || availabilityStatus === null) {
    return null;
  }

  // Always show hybrid AI info message
  const hybridAIMessage = (
    <Callout type="info" title="Hybrid AI Support">
      These components support hybrid AI, meaning they can fallback to server-side AI calls if needed. The documentation site, however, has server LLM switched off for demonstration purposes.
    </Callout>
  );

  // Show success message if available
  if (availabilityStatus === 'available') {
    return (
      <>
        <Callout type="success" title="Chrome Built-in AI Available">
          Your browser supports Chrome built-in AI APIs. You can use all AI-powered features with on-device processing.
        </Callout>
        {hybridAIMessage}
      </>
    );
  }

  // Show appropriate message based on availability status
  if (availabilityStatus === 'unavailable') {
    return (
      <>
        <Callout type="error" title="Chrome Built-in AI Not Available">
          Chrome AI APIs require Google Chrome (version 137+ or later) with supported hardware. 
          <p className="mt-2">
            Learn more prerequisites here: <a href="https://developer.chrome.com/docs/ai/get-started" target="_blank" rel="noopener noreferrer" className="underline">Chrome built-in AI requirements</a>.
          </p>
        </Callout>
        {hybridAIMessage}
      </>
    );
  }

  if (availabilityStatus === 'downloadable') {
    return (
      <>
        <Callout type="info" title="Model Download Required">
          Chrome built-in AI requires downloading the model. The model will be downloaded automatically when you interact with AI features. This requires user activation and sufficient storage space (22 GB).
        </Callout>
        {hybridAIMessage}
      </>
    );
  }

  if (availabilityStatus === 'downloading') {
    return (
      <>
        <Callout type="info" title="Model Downloading">
          The Chrome built-in AI model is currently downloading. You can use the APIs once the download completes.
        </Callout>
        {hybridAIMessage}
      </>
    );
  }

  return null;
}

