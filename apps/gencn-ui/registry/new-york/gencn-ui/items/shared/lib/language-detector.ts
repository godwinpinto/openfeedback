'use client';

import type { LanguageDetectorOptions, DetectedLanguage } from '@/registry/new-york/gencn-ui/items/shared/genui-types';

export type LanguageDetectorAvailability = 'available' | 'downloadable' | 'unavailable' | null;

export function isLanguageDetectorSupported(): boolean {
	return 'LanguageDetector' in self;
}

export async function checkLanguageDetectorAvailability(): Promise<LanguageDetectorAvailability> {
	if (!isLanguageDetectorSupported()) return null;
	try {
		const status = await (self as any).LanguageDetector.availability();
		return status as LanguageDetectorAvailability;
	} catch {
		return null;
	}
}

export async function ensureLanguageDetector(options?: LanguageDetectorOptions & { onProgress?: (percent: number) => void }): Promise<any> {
	if (!isLanguageDetectorSupported()) {
		throw new Error('Chrome Language Detector API is not supported.');
	}

	const availability = await checkLanguageDetectorAvailability();
	if (availability === 'unavailable' || availability === null) {
		throw new Error('Language Detector API is unavailable on this device.');
	}

	const createOptions: any = {
		...options,
		monitor(m: any) {
			if (options?.monitor) options.monitor(m);
			try {
				m?.addEventListener?.('downloadprogress', (e: any) => {
					if (typeof e.loaded === 'number') {
						options?.onProgress?.(Math.round(e.loaded * 100));
					}
				});
			} catch {}
		},
	};

	const detector = await (self as any).LanguageDetector.create(createOptions);
	return detector;
}

export async function detectLanguages(text: string, _options?: LanguageDetectorOptions): Promise<DetectedLanguage[]> {
	if (!text.trim()) {
		throw new Error('Please enter some text to detect language.');
	}

	const detector = await ensureLanguageDetector(_options);
	const results = await detector.detect(text);
	return results as DetectedLanguage[];
}


