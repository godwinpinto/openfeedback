/**
 * Utility functions for tracking form creation timestamps to prevent spam
 */

const FORM_CREATION_TRACKING_KEY = 'encatch_form_creation_timestamps';

interface FormCreationTimestamp {
  timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Get all form creation timestamps from localStorage
 */
export function getFormCreationTimestamps(): FormCreationTimestamp[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const raw = localStorage.getItem(FORM_CREATION_TRACKING_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Check if a form was created in the last N minutes
 * @param minutes - Number of minutes to check (default: 5)
 */
export function hasCreatedFormRecently(minutes: number = 5): boolean {
  const timestamps = getFormCreationTimestamps();
  const now = Date.now();
  const threshold = minutes * 60 * 1000; // Convert minutes to milliseconds
  
  return timestamps.some(entry => (now - entry.timestamp) < threshold);
}

/**
 * Record a form creation timestamp
 */
export function recordFormCreation(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const timestamps = getFormCreationTimestamps();
    const now = Date.now();
    
    // Add new timestamp
    timestamps.push({ timestamp: now });
    
    // Clean up old timestamps (older than 10 minutes to keep storage clean)
    const tenMinutesAgo = now - (10 * 60 * 1000);
    const recentTimestamps = timestamps.filter(entry => entry.timestamp > tenMinutesAgo);
    
    localStorage.setItem(FORM_CREATION_TRACKING_KEY, JSON.stringify(recentTimestamps));
  } catch {
    // Silently fail
  }
}

/**
 * Clear form creation tracking (after verification)
 */
export function clearFormCreationTracking(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(FORM_CREATION_TRACKING_KEY);
  } catch {
    // Silently fail
  }
}

