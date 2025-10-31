'use client';

import type { RewriterOptions, RewriteOptions } from '@/lib/genui-types';

export type RewriterAvailability = 'available' | 'downloadable' | 'unavailable' | null;

export function isRewriterSupported(): boolean {
	return 'Rewriter' in self;
}

export async function checkRewriterAvailability(): Promise<RewriterAvailability> {
	if (!isRewriterSupported()) return null;
	try {
		const status = await (self as any).Rewriter.availability();
		return status as RewriterAvailability;
	} catch {
		return null;
	}
}

export async function ensureRewriter(options?: RewriterOptions & { onProgress?: (percent: number) => void }): Promise<any> {
	if (!isRewriterSupported()) {
		throw new Error('Chrome Rewriter API is not supported.');
	}

	const availability = await checkRewriterAvailability();
	if (availability === 'unavailable' || availability === null) {
		throw new Error('Rewriter API is unavailable on this device.');
	}

	const createOptions: any = {
		...options,
		monitor: (monitor: any) => {
			if (options?.monitor) {
				options.monitor(monitor);
			}
			try {
				monitor?.addEventListener?.('downloadprogress', (e: any) => {
					if (typeof e.loaded === 'number') {
						options?.onProgress?.(Math.round(e.loaded * 100));
					}
				});
			} catch {}
		},
	};

	const rewriter = await (self as any).Rewriter.create(createOptions);
	return rewriter;
}

export async function rewriteOnce(
	text: string,
	options?: (RewriterOptions & { onProgress?: (percent: number) => void }) & RewriteOptions
): Promise<string> {
	if (!text.trim()) {
		throw new Error('Please enter some text to improve.');
	}

	const rewriter = await ensureRewriter(options);
	const result = await rewriter.rewrite(text, { context: options?.context, signal: options?.signal });
	return result as string;
}

export async function* rewriteStreaming(
	text: string,
	options?: (RewriterOptions & { signal?: AbortSignal; onProgress?: (percent: number) => void }) & RewriteOptions
): AsyncGenerator<string> {
	if (!text.trim()) {
		throw new Error('Please enter some text to improve.');
	}

	const rewriter = await ensureRewriter(options);
	const stream = rewriter.rewriteStreaming(text, { context: options?.context, signal: options?.signal });
	let acc = '';
	for await (const chunk of stream) {
		acc += chunk;
		yield acc as string;
	}
}


