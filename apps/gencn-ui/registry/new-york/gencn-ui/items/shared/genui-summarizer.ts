'use client';

import type { SummarizerOptions, SummarizeOptions } from '@/registry/new-york/gencn-ui/items/shared/genui-types';

export type SummarizerAvailability = 'available' | 'downloadable' | 'unavailable' | null;

export function isSummarizerSupported(): boolean {
	return 'Summarizer' in self;
}

export async function checkSummarizerAvailability(): Promise<SummarizerAvailability> {
	if (!isSummarizerSupported()) return null;
	try {
		const status = await (self as any).Summarizer.availability();
		return status as SummarizerAvailability;
	} catch {
		return null;
	}
}

export async function ensureSummarizer(options?: SummarizerOptions & { onProgress?: (percent: number) => void }): Promise<any> {
	if (!isSummarizerSupported()) {
		throw new Error('Chrome Summarizer API is not supported.');
	}

	const availability = await checkSummarizerAvailability();
	if (availability === 'unavailable' || availability === null) {
		throw new Error('Summarizer API is unavailable on this device.');
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

	const summarizer = await (self as any).Summarizer.create(createOptions);
	return summarizer;
}

export async function summarizeOnce(
	text: string,
	options?: (SummarizerOptions & { onProgress?: (percent: number) => void }) & SummarizeOptions
): Promise<string> {
	if (!text.trim()) {
		throw new Error('Please enter some text to summarize.');
	}

	const summarizer = await ensureSummarizer(options);
	const result = await summarizer.summarize(text, { context: options?.context });
	return result as string;
}

export async function* summarizeStreaming(
	text: string,
	options?: (SummarizerOptions & { signal?: AbortSignal; onProgress?: (percent: number) => void }) & SummarizeOptions
): AsyncGenerator<string> {
	if (!text.trim()) {
		throw new Error('Please enter some text to summarize.');
	}

	const summarizer = await ensureSummarizer(options);
	const stream = summarizer.summarizeStreaming(text, { context: options?.context, signal: options?.signal });
	let acc = '';
	for await (const chunk of stream) {
		acc += chunk;
		yield acc as string;
	}
}


