import { describe, it, expect } from 'vitest';
import {
	pipelinePresets,
	itemKinds,
	pipelinePresetCapabilities,
	suggestedPipelinePresetByItemKind,
	isPipelinePreset,
	isItemKind,
	getPipelinePresetCapability,
	isPipelinePresetAllowedForItemKind,
	getAllowedPipelinePresets,
	getSuggestedPipelinePreset,
	validatePipelinePresetCompatibility,
	type PipelinePreset,
	type ItemKind
} from './pipelineCapabilities';

describe('pipelineCapabilities', () => {
	it('defines exactly 7 presets and 6 item kinds', () => {
		expect(pipelinePresets).toHaveLength(7);
		expect(itemKinds).toHaveLength(6);
		expect(pipelinePresets).toEqual([
			'auto',
			'none',
			'ocr_text',
			'audio_transcript',
			'video_transcript',
			'ocr_and_audio_transcript',
			'ocr_and_video_transcript'
		]);
		expect(itemKinds).toEqual([
			'photo',
			'audio',
			'video',
			'scanned_document',
			'document',
			'other'
		]);
	});

	it('exhaustively covers all 42 pairs with exactly 21 allowed and 21 rejected', () => {
		const matrix: Record<PipelinePreset, Record<ItemKind, boolean>> = {
			auto: {
				photo: true,
				audio: true,
				video: true,
				scanned_document: true,
				document: true,
				other: true
			},
			none: {
				photo: true,
				audio: true,
				video: true,
				scanned_document: true,
				document: true,
				other: true
			},
			ocr_text: {
				photo: false,
				audio: false,
				video: false,
				scanned_document: true,
				document: false,
				other: true
			},
			audio_transcript: {
				photo: false,
				audio: true,
				video: false,
				scanned_document: false,
				document: false,
				other: true
			},
			video_transcript: {
				photo: false,
				audio: false,
				video: true,
				scanned_document: false,
				document: false,
				other: true
			},
			ocr_and_audio_transcript: {
				photo: false,
				audio: false,
				video: false,
				scanned_document: false,
				document: false,
				other: true
			},
			ocr_and_video_transcript: {
				photo: false,
				audio: false,
				video: true,
				scanned_document: false,
				document: false,
				other: true
			}
		};

		let totalPairs = 0;
		let allowedCount = 0;
		let rejectedCount = 0;

		for (const preset of pipelinePresets) {
			for (const kind of itemKinds) {
				totalPairs += 1;
				const expected = matrix[preset][kind];
				const actual = isPipelinePresetAllowedForItemKind(preset, kind);
				expect(actual).toBe(expected);

				if (actual) {
					allowedCount += 1;
				} else {
					rejectedCount += 1;
				}
			}
		}

		expect(totalPairs).toBe(42);
		expect(allowedCount).toBe(21);
		expect(rejectedCount).toBe(21);
	});

	it('matches exact allowed preset counts per item kind', () => {
		const expectedCounts: Record<ItemKind, number> = {
			photo: 2,
			audio: 3,
			video: 4,
			scanned_document: 3,
			document: 2,
			other: 7
		};

		for (const kind of itemKinds) {
			const allowed = getAllowedPipelinePresets(kind);
			expect(allowed.length).toBe(expectedCounts[kind]);
		}

		expect(getAllowedPipelinePresets('photo')).toEqual(['auto', 'none']);
		expect(getAllowedPipelinePresets('audio')).toEqual(['auto', 'none', 'audio_transcript']);
		expect(getAllowedPipelinePresets('video')).toEqual([
			'auto',
			'none',
			'video_transcript',
			'ocr_and_video_transcript'
		]);
		expect(getAllowedPipelinePresets('scanned_document')).toEqual(['auto', 'none', 'ocr_text']);
		expect(getAllowedPipelinePresets('document')).toEqual(['auto', 'none']);
		expect(getAllowedPipelinePresets('other')).toEqual([...pipelinePresets]);
	});

	it('returns exact suggestions for every item kind', () => {
		const expectedSuggestions: Record<ItemKind, PipelinePreset> = {
			photo: 'none',
			audio: 'audio_transcript',
			video: 'video_transcript',
			scanned_document: 'ocr_text',
			document: 'none',
			other: 'auto'
		};

		for (const kind of itemKinds) {
			expect(getSuggestedPipelinePreset(kind)).toBe(expectedSuggestions[kind]);
			expect(suggestedPipelinePresetByItemKind[kind]).toBe(expectedSuggestions[kind]);
		}
	});

	it('defines correct presentation modes and stages for each preset', () => {
		expect(pipelinePresetCapabilities.auto).toEqual({
			allowedKinds: itemKinds,
			mode: 'detection',
			stages: []
		});
		expect(pipelinePresetCapabilities.none).toEqual({
			allowedKinds: itemKinds,
			mode: 'store_only',
			stages: []
		});
		expect(pipelinePresetCapabilities.ocr_text).toEqual({
			allowedKinds: ['scanned_document', 'other'],
			mode: 'fixed',
			stages: ['ocr', 'index']
		});
		expect(pipelinePresetCapabilities.audio_transcript).toEqual({
			allowedKinds: ['audio', 'other'],
			mode: 'fixed',
			stages: ['transcribe']
		});
		expect(pipelinePresetCapabilities.video_transcript).toEqual({
			allowedKinds: ['video', 'other'],
			mode: 'fixed',
			stages: ['transcribe']
		});
		expect(pipelinePresetCapabilities.ocr_and_audio_transcript).toEqual({
			allowedKinds: ['other'],
			mode: 'fixed',
			stages: ['ocr', 'index', 'transcribe']
		});
		expect(pipelinePresetCapabilities.ocr_and_video_transcript).toEqual({
			allowedKinds: ['video', 'other'],
			mode: 'fixed',
			stages: ['ocr', 'index', 'transcribe']
		});
	});

	it('type predicates and capability lookups correctly validate presets and kinds', () => {
		expect(isPipelinePreset('auto')).toBe(true);
		expect(isPipelinePreset('ocr_text')).toBe(true);
		expect(isPipelinePreset('unknown_preset')).toBe(false);
		expect(isPipelinePreset(null)).toBe(false);
		expect(isPipelinePreset(undefined)).toBe(false);

		expect(isItemKind('photo')).toBe(true);
		expect(isItemKind('scanned_document')).toBe(true);
		expect(isItemKind('invalid_kind')).toBe(false);
		expect(isItemKind(null)).toBe(false);

		expect(getPipelinePresetCapability('ocr_text')).toEqual(
			pipelinePresetCapabilities.ocr_text
		);
		expect(getPipelinePresetCapability('invalid')).toBeNull();
		expect(getPipelinePresetCapability(null)).toBeNull();
	});

	describe('validatePipelinePresetCompatibility', () => {
		it('returns unknown_preset for invalid preset string', () => {
			const result = validatePipelinePresetCompatibility({
				preset: 'custom_preset',
				batchItemKind: 'document'
			});
			expect(result).toEqual({
				valid: false,
				reason: 'unknown_preset',
				rawPreset: 'custom_preset'
			});
		});

		it('returns unknown_item_kind for invalid batchItemKind string', () => {
			const result = validatePipelinePresetCompatibility({
				preset: 'auto',
				batchItemKind: 'invalid_kind'
			});
			expect(result).toEqual({
				valid: false,
				reason: 'unknown_item_kind',
				rawItemKind: 'invalid_kind'
			});
		});

		it('returns unknown_item_kind when an item override is an unknown non-null string', () => {
			const result = validatePipelinePresetCompatibility({
				preset: 'auto',
				batchItemKind: 'photo',
				itemOverrides: ['photo', 'unknown_override_kind']
			});
			expect(result).toEqual({
				valid: false,
				reason: 'unknown_item_kind',
				rawItemKind: 'unknown_override_kind'
			});
		});

		it('resolves batch kind fallback from classificationType when batchItemKind is omitted', () => {
			const resultImage = validatePipelinePresetCompatibility({
				preset: 'none',
				classificationType: 'image'
			});
			expect(resultImage).toEqual({
				valid: true,
				effectiveKinds: ['photo']
			});

			const resultSpeech = validatePipelinePresetCompatibility({
				preset: 'audio_transcript',
				classificationType: 'speech'
			});
			expect(resultSpeech).toEqual({
				valid: true,
				effectiveKinds: ['audio']
			});

			const resultDocument = validatePipelinePresetCompatibility({
				preset: 'ocr_text',
				classificationType: 'document'
			});
			expect(resultDocument).toEqual({
				valid: true,
				effectiveKinds: ['scanned_document']
			});

			const resultOther = validatePipelinePresetCompatibility({
				preset: 'none',
				classificationType: 'other'
			});
			expect(resultOther).toEqual({
				valid: true,
				effectiveKinds: ['photo']
			});

			const resultDefault = validatePipelinePresetCompatibility({
				preset: 'none'
			});
			expect(resultDefault).toEqual({
				valid: true,
				effectiveKinds: ['document']
			});
		});

		it('validates empty item list directly against batch item kind', () => {
			const validResult = validatePipelinePresetCompatibility({
				preset: 'ocr_text',
				batchItemKind: 'scanned_document',
				itemOverrides: []
			});
			expect(validResult).toEqual({
				valid: true,
				effectiveKinds: ['scanned_document']
			});

			const invalidResult = validatePipelinePresetCompatibility({
				preset: 'ocr_text',
				batchItemKind: 'photo',
				itemOverrides: []
			});
			expect(invalidResult).toEqual({
				valid: false,
				reason: 'incompatible',
				preset: 'ocr_text',
				incompatibleKinds: ['photo']
			});
		});

		it('only null and undefined overrides inherit batch item kind', () => {
			const result = validatePipelinePresetCompatibility({
				preset: 'ocr_text',
				batchItemKind: 'scanned_document',
				itemOverrides: [null, undefined]
			});
			expect(result).toEqual({
				valid: true,
				effectiveKinds: ['scanned_document']
			});
		});

		it('treats an empty-string override as an unknown item kind', () => {
			expect(
				validatePipelinePresetCompatibility({
					preset: 'auto',
					batchItemKind: 'scanned_document',
					itemOverrides: ['']
				})
			).toEqual({
				valid: false,
				reason: 'unknown_item_kind',
				rawItemKind: ''
			});
		});

		it('correctly validates mixed item override combinations', () => {
			// Batch scanned_document + ocr_text, null override: allow
			const r1 = validatePipelinePresetCompatibility({
				preset: 'ocr_text',
				batchItemKind: 'scanned_document',
				itemOverrides: [null]
			});
			expect(r1.valid).toBe(true);

			// Batch scanned_document + ocr_text, photo override: reject
			const r2 = validatePipelinePresetCompatibility({
				preset: 'ocr_text',
				batchItemKind: 'scanned_document',
				itemOverrides: ['photo']
			});
			expect(r2).toEqual({
				valid: false,
				reason: 'incompatible',
				preset: 'ocr_text',
				incompatibleKinds: ['photo']
			});

			// Batch scanned_document + auto, photo override: allow
			const r3 = validatePipelinePresetCompatibility({
				preset: 'auto',
				batchItemKind: 'scanned_document',
				itemOverrides: ['photo', null]
			});
			expect(r3.valid).toBe(true);
			if (r3.valid) {
				expect(r3.effectiveKinds).toEqual(['photo', 'scanned_document']);
			}

			// Batch other + audio_transcript, audio override: allow
			const r4 = validatePipelinePresetCompatibility({
				preset: 'audio_transcript',
				batchItemKind: 'other',
				itemOverrides: ['audio']
			});
			expect(r4.valid).toBe(true);

			// Batch other + audio_transcript, video override: reject
			const r5 = validatePipelinePresetCompatibility({
				preset: 'audio_transcript',
				batchItemKind: 'other',
				itemOverrides: ['video']
			});
			expect(r5).toEqual({
				valid: false,
				reason: 'incompatible',
				preset: 'audio_transcript',
				incompatibleKinds: ['video']
			});
		});
	});
});
