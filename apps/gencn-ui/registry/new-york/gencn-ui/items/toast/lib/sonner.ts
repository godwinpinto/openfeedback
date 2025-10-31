'use client';

import * as React from 'react';
import { toast, type ExternalToast } from 'sonner';
import { rewriteOnce } from '@/registry/new-york/gencn-ui/items/shared/lib/rewriter';

export type AITone =
  | 'friendly'
  | 'funny'
  | 'sarcastic'
  | 'rude'
  | 'dramatic'
  | 'professional'
  | 'cheerful'
  | 'empathetic'
  | 'concise'
  | 'motivational';

export const AISONNER_TONES: AITone[] = [
  'friendly',
  'funny',
  'sarcastic',
  'rude',
  'dramatic',
  'professional',
  'cheerful',
  'empathetic',
  'concise',
  'motivational',
];

export type AISONNEROptions = ExternalToast & {
  tone?: AITone;
  maxLength?: number;
  retryOnFail?: boolean;
};

async function rewriteIfString(
  input: React.ReactNode,
  tone?: AITone,
  maxLength?: number,
  retryOnFail: boolean = true
): Promise<React.ReactNode> {
  if (typeof input !== 'string') return input;

  const text = input as string;
  const toneInstruction = tone
    ? `Rephrase the following text in a ${tone} tone while preserving intent.`
    : 'Rephrase the following text to improve clarity while preserving intent.';

  const lengthInstruction = typeof maxLength === 'number' && maxLength > 0
    ? ` Keep it under ${maxLength} characters.`
    : '';

  const context = `${toneInstruction}${lengthInstruction} Respond with only the rewritten text, no quotes.`;

  try {
    const rewritten = await rewriteOnce(text, { context });
    return rewritten || text;
  } catch (err) {
    if (retryOnFail) return text;
    throw err;
  }
}

function isExternalToastOptions(opts?: ExternalToast | AISONNEROptions): opts is AISONNEROptions {
  return !!opts;
}

export async function aiToast(message: React.ReactNode, options?: AISONNEROptions) {
  const rewritten = await rewriteIfString(message, options?.tone, options?.maxLength, options?.retryOnFail !== false);
  return toast(rewritten, options);
}

aiToast.success = async function (message: React.ReactNode, options?: AISONNEROptions) {
  const rewritten = await rewriteIfString(message, options?.tone, options?.maxLength, options?.retryOnFail !== false);
  return toast.success(rewritten, options);
};

aiToast.error = async function (message: React.ReactNode, options?: AISONNEROptions) {
  const rewritten = await rewriteIfString(message, options?.tone, options?.maxLength, options?.retryOnFail !== false);
  return toast.error(rewritten, options);
};

aiToast.info = async function (message: React.ReactNode, options?: AISONNEROptions) {
  const rewritten = await rewriteIfString(message, options?.tone, options?.maxLength, options?.retryOnFail !== false);
  return toast.info(rewritten, options);
};

aiToast.warning = async function (message: React.ReactNode, options?: AISONNEROptions) {
  const rewritten = await rewriteIfString(message, options?.tone, options?.maxLength, options?.retryOnFail !== false);
  return toast.warning(rewritten, options);
};

aiToast.message = async function (message: React.ReactNode, options?: AISONNEROptions) {
  const rewritten = await rewriteIfString(message, options?.tone, options?.maxLength, options?.retryOnFail !== false);
  return toast.message(rewritten as any, options as any);
};

aiToast.loading = function (message: React.ReactNode, options?: AISONNEROptions) {
  // For loading, show immediately; do not wait for rewriting to avoid UX delay.
  return toast.loading(message, options);
};

aiToast.custom = function (renderer: Parameters<typeof toast.custom>[0], options?: ExternalToast) {
  return toast.custom(renderer, options);
};

aiToast.dismiss = function (toastId?: number | string) {
  return toast.dismiss(toastId as any);
};

aiToast.promise = async function <T>(
  promise: Promise<T>,
  cfg: {
    loading: React.ReactNode;
    success: React.ReactNode | ((value: T) => React.ReactNode);
    error: React.ReactNode | ((error: any) => React.ReactNode);
    tone?: AITone;
    maxLength?: number;
    retryOnFail?: boolean;
  },
  options?: AISONNEROptions
) {
  // Show loading immediately (without waiting for rewrite)
  const id = toast.loading(cfg.loading, options);

  try {
    const value = await promise;
    const successContent = typeof cfg.success === 'function' ? cfg.success(value) : cfg.success;
    const rewritten = await rewriteIfString(successContent, cfg.tone ?? options?.tone, cfg.maxLength ?? options?.maxLength, (cfg.retryOnFail ?? options?.retryOnFail) !== false);
    return toast.success(rewritten, { ...options, id });
  } catch (error) {
    const errorContent = typeof cfg.error === 'function' ? cfg.error(error) : cfg.error;
    const rewritten = await rewriteIfString(errorContent, cfg.tone ?? options?.tone, cfg.maxLength ?? options?.maxLength, (cfg.retryOnFail ?? options?.retryOnFail) !== false);
    return toast.error(rewritten, { ...options, id });
  }
};

// Re-export Toaster passthrough for convenience if consumers need to render it.
export { Toaster } from 'sonner';

export type AIToastType = typeof aiToast;


