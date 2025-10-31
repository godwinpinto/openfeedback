'use client';

import type { WriterOptions, WriteOptions } from '@/lib/genui-types';

export type WriterAvailability = 'available' | 'downloadable' | 'unavailable' | null;

export function isWriterSupported(): boolean {
	return 'Writer' in self;
}

export async function checkWriterAvailability(): Promise<WriterAvailability> {
	if (!isWriterSupported()) return null;
	try {
		const status = await (self as any).Writer.availability();
		return status as WriterAvailability;
	} catch {
		return null;
	}
}

export async function ensureWriter(options?: WriterOptions & { onProgress?: (percent: number) => void }): Promise<any> {
	if (!isWriterSupported()) {
		throw new Error('Chrome Writer API is not supported.');
	}

	const availability = await checkWriterAvailability();
	if (availability === 'unavailable' || availability === null) {
		throw new Error('Writer API is unavailable on this device.');
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

	const writer = await (self as any).Writer.create(createOptions);
	return writer;
}

export async function writeOnce(
	prompt: string,
	options?: (WriterOptions & { onProgress?: (percent: number) => void }) & WriteOptions
): Promise<string> {
	if (!prompt.trim()) {
		throw new Error('Please enter a prompt to write content.');
	}

	const writer = await ensureWriter(options);
	const result = await writer.write(prompt, { context: options?.context });
	return result as string;
}

export async function* writeStreaming(
	prompt: string,
	options?: (WriterOptions & { signal?: AbortSignal; onProgress?: (percent: number) => void }) & WriteOptions
): AsyncGenerator<string> {
	if (!prompt.trim()) {
		throw new Error('Please enter a prompt to write content.');
	}

	const writer = await ensureWriter(options);
	const stream = writer.writeStreaming(prompt, { context: options?.context, signal: options?.signal });
	let acc = '';
	for await (const chunk of stream) {
		acc += chunk;
		yield acc as string;
	}
}


