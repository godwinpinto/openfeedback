'use client';

export type TranslatorAvailability = 'available' | 'downloadable' | 'unavailable' | null;

export interface TranslatorOptions {
	sourceLanguage?: string;
	targetLanguage: string;
	monitor?: (monitor: any) => void;
}

export interface TranslateOptions {
	signal?: AbortSignal;
}

export function isTranslatorSupported(): boolean {
	if (typeof self === 'undefined') return false;
	return 'Translator' in self;
}

export async function checkTranslatorAvailability(): Promise<TranslatorAvailability> {
	if (!isTranslatorSupported()) return null;
	if (typeof self === 'undefined') return null;
	try {
		const status = await (self as any).Translator.availability();
		return status as TranslatorAvailability;
	} catch {
		return null;
	}
}

export async function ensureTranslator(options: TranslatorOptions & { onProgress?: (percent: number) => void }): Promise<any> {
    if (!isTranslatorSupported()) {
		console.error('Chrome Translator API is not supported.');
        // throw new Error('Chrome Translator API is not supported.');
        return null;
    }

    const availability = await checkTranslatorAvailability();
    // Only hard-fail if explicitly unavailable. If null (unknown), try creating anyway.
    if (availability === 'unavailable') {
        throw new Error('Translator API is unavailable on this device.');
    }

    const createOptions: any = {
        ...options,
        monitor(m: any) {
            if (options.monitor) options.monitor(m);
            try {
                m?.addEventListener?.('downloadprogress', (e: any) => {
                    if (typeof e.loaded === 'number') {
                        options.onProgress?.(Math.round(e.loaded * 100));
                    }
                });
            } catch {}
        },
    };

    if (typeof self === 'undefined') {
        throw new Error('Translator API is not available in this environment.');
    }
    try {
        const translator = await (self as any).Translator.create(createOptions);
        return translator;
    } catch (e) {
		console.error(`Failed to create Translator: ${(e as Error).message}`);
        // throw new Error(`Failed to create Translator: ${(e as Error).message}`);
        return null;
    }
}

export async function translateOnce(
	text: string,
	options: TranslatorOptions & TranslateOptions
): Promise<string> {
	if (!text.trim()) {
		console.error('Please enter some text to translate.');
		// throw new Error('Please enter some text to translate.');
		return '';
	}

	const translator = await ensureTranslator(options);
	const result = await translator.translate(text, { signal: options.signal });
	return result as string;
}

export async function* translateStreaming(
	text: string,
	options: TranslatorOptions & TranslateOptions
): AsyncGenerator<string> {
	if (!text.trim()) {
		console.error('Please enter some text to translate.');
		// throw new Error('Please enter some text to translate.');
		return;
	}

	const translator = await ensureTranslator(options);
	if (typeof translator.translateStreaming !== 'function') {
		// Fallback to non-streaming
		yield await translator.translate(text, { signal: options.signal });
		return;
	}
	const stream = translator.translateStreaming(text, { signal: options.signal });
	let acc = '';
	for await (const chunk of stream) {
		acc += chunk;
		yield acc as string;
	}
}


