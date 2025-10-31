'use client';

export type ProofreaderAvailability = 'available' | 'downloadable' | 'unavailable' | null;

export interface ProofreaderCreateOptions {
	expectedInputLanguages: string[];
	monitor?: (monitor: any) => void;
}

export interface ProofreadResultCorrection {
	startIndex: number;
	endIndex: number;
	// Additional fields may exist but aren't required for our flow
}

export interface ProofreadResult {
	corrected: string;
	corrections: ProofreadResultCorrection[];
}

export function isProofreaderSupported(): boolean {
	if (typeof self === 'undefined') return false;
	return 'Proofreader' in self;
}

export async function checkProofreaderAvailability(): Promise<ProofreaderAvailability> {
	if (!isProofreaderSupported()) return null;
	if (typeof self === 'undefined') return null;
	try {
		const status = await (self as any).Proofreader.availability();
		return status as ProofreaderAvailability;
	} catch {
		return null;
	}
}

export async function ensureProofreader(options: ProofreaderCreateOptions): Promise<any> {
	if (!isProofreaderSupported()) {
		throw new Error('Chrome Proofreader API is not supported.');
	}

	const availability = await checkProofreaderAvailability();
	if (availability === 'unavailable' || availability === null) {
		throw new Error('Proofreader API is unavailable on this device.');
	}

	const createOptions: any = {
		...options,
		monitor: (monitor: any) => {
			if (options.monitor) {
				options.monitor(monitor);
			}
			try {
				monitor?.addEventListener?.('downloadprogress', (e: any) => {
					// consumer's monitor callback receives raw monitor via options.monitor
				});
			} catch {}
		},
	};

	if (typeof self === 'undefined') {
		throw new Error('Proofreader API is not available in this environment.');
	}
	const proofreader = await (self as any).Proofreader.create(createOptions);
	return proofreader;
}

export async function proofreadOnce(
	text: string,
    options: ProofreaderCreateOptions & { signal?: AbortSignal; onProgress?: (percent: number) => void }
): Promise<ProofreadResult> {
	if (!text.trim()) {
		throw new Error('Please enter some text to fix grammar.');
	}

	const pr = await ensureProofreader({
		expectedInputLanguages: options.expectedInputLanguages,
		monitor: (m: any) => {
			m?.addEventListener?.('downloadprogress', (e: any) => {
				if (typeof e.loaded === 'number') {
					options.onProgress?.(Math.round(e.loaded * 100));
				}
			});
		},
	});

	// The Proofreader API exposes a non-streaming proofread() call (no options)
	// Return shape may differ: playground uses { correctedInput, corrections }
	// Normalize to { corrected, corrections }
	// @ts-ignore - runtime API shape is provided by Chrome
	const raw = await pr.proofread(text);
	const corrected: string = (raw?.corrected ?? raw?.correctedInput) ?? '';
	const corrections: any[] = Array.isArray(raw?.corrections) ? raw.corrections : [];
	return { corrected, corrections } as ProofreadResult;
}


