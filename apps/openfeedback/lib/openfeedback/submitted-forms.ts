/**
 * Utility functions for managing submitted feedback form IDs in localStorage
 */

const SUBMITTED_FORMS_STORAGE_KEY = 'encatch_submitted_feedback_forms';

/**
 * Get all submitted form IDs from localStorage
 */
export function getSubmittedFormIds(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const raw = localStorage.getItem(SUBMITTED_FORMS_STORAGE_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Check if a form ID has been submitted
 */
export function isFormSubmitted(formId: string): boolean {
  const submittedIds = getSubmittedFormIds();
  return submittedIds.includes(formId);
}

/**
 * Add a form ID to the submitted list
 */
export function markFormAsSubmitted(formId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const submittedIds = getSubmittedFormIds();
    if (!submittedIds.includes(formId)) {
      submittedIds.push(formId);
      localStorage.setItem(SUBMITTED_FORMS_STORAGE_KEY, JSON.stringify(submittedIds));
    }
  } catch {
    // Silently fail
  }
}

/**
 * Remove a form ID from the submitted list (after verification)
 */
export function unmarkFormAsSubmitted(formId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const submittedIds = getSubmittedFormIds();
    const filtered = submittedIds.filter(id => id !== formId);
    localStorage.setItem(SUBMITTED_FORMS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Silently fail
  }
}

