/**
 * Pipeline Preset & Item-Kind Capabilities Contract
 * See docs/ingestion-capability-matrix.md for the authoritative specification.
 */

import {
	classificationTypes,
	defaultItemKindForClassification,
	type ClassificationType
} from '$lib/ingestion/kindMappings';

export const pipelinePresets = [
	'auto',
	'none',
	'ocr_text',
	'audio_transcript',
	'video_transcript',
	'ocr_and_audio_transcript',
	'ocr_and_video_transcript'
] as const;

export type PipelinePreset = (typeof pipelinePresets)[number];

export const itemKinds = [
	'photo',
	'audio',
	'video',
	'scanned_document',
	'document',
	'other'
] as const;

export type ItemKind = (typeof itemKinds)[number];

export type PipelinePresentationStage = 'ocr' | 'index' | 'transcribe';

export type PipelinePresentationMode = 'detection' | 'store_only' | 'fixed';

export type PipelinePresetCapability = {
	readonly allowedKinds: readonly ItemKind[];
	readonly mode: PipelinePresentationMode;
	readonly stages: readonly PipelinePresentationStage[];
};

export const pipelinePresetCapabilities: Record<PipelinePreset, PipelinePresetCapability> = {
	auto: {
		allowedKinds: itemKinds,
		mode: 'detection',
		stages: []
	},
	none: {
		allowedKinds: itemKinds,
		mode: 'store_only',
		stages: []
	},
	ocr_text: {
		allowedKinds: ['scanned_document', 'other'],
		mode: 'fixed',
		stages: ['ocr', 'index']
	},
	audio_transcript: {
		allowedKinds: ['audio', 'other'],
		mode: 'fixed',
		stages: ['transcribe']
	},
	video_transcript: {
		allowedKinds: ['video', 'other'],
		mode: 'fixed',
		stages: ['transcribe']
	},
	ocr_and_audio_transcript: {
		allowedKinds: ['other'],
		mode: 'fixed',
		stages: ['ocr', 'index', 'transcribe']
	},
	ocr_and_video_transcript: {
		allowedKinds: ['video', 'other'],
		mode: 'fixed',
		stages: ['ocr', 'index', 'transcribe']
	}
};

export const suggestedPipelinePresetByItemKind: Record<ItemKind, PipelinePreset> = {
	photo: 'none',
	audio: 'audio_transcript',
	video: 'video_transcript',
	scanned_document: 'ocr_text',
	document: 'none',
	other: 'auto'
};

export const isPipelinePreset = (value: unknown): value is PipelinePreset =>
	typeof value === 'string' && (pipelinePresets as readonly string[]).includes(value);

export const isItemKind = (value: unknown): value is ItemKind =>
	typeof value === 'string' && (itemKinds as readonly string[]).includes(value);

const isClassificationType = (value: unknown): value is ClassificationType =>
	typeof value === 'string' && (classificationTypes as readonly string[]).includes(value);

export const getPipelinePresetCapability = (
	preset: string | undefined | null
): PipelinePresetCapability | null => {
	if (!preset || !isPipelinePreset(preset)) return null;
	return pipelinePresetCapabilities[preset];
};

export type PipelinePresentation = {
	readonly mode: PipelinePresentationMode | 'unknown';
	readonly stages: readonly PipelinePresentationStage[];
};

export const getPipelinePresentation = (
	preset: string | undefined | null
): PipelinePresentation => {
	const capability = getPipelinePresetCapability(preset);
	if (!capability) {
		return {
			mode: 'unknown',
			stages: []
		};
	}
	return {
		mode: capability.mode,
		stages: capability.stages
	};
};

export const isPipelinePresetAllowedForItemKind = (
	preset: PipelinePreset,
	itemKind: ItemKind
): boolean => pipelinePresetCapabilities[preset].allowedKinds.includes(itemKind);

export const getAllowedPipelinePresets = (itemKind: ItemKind): readonly PipelinePreset[] =>
	pipelinePresets.filter((preset) => isPipelinePresetAllowedForItemKind(preset, itemKind));

export const getSuggestedPipelinePreset = (itemKind: ItemKind): PipelinePreset =>
	suggestedPipelinePresetByItemKind[itemKind];

export type PipelineValidationInput = {
	preset: string | undefined | null;
	batchItemKind?: string | undefined | null;
	classificationType?: string | undefined | null;
	itemOverrides?: ReadonlyArray<string | null | undefined>;
};

export type PipelineValidationResult =
	| {
			readonly valid: true;
			readonly effectiveKinds: readonly ItemKind[];
	  }
	| {
			readonly valid: false;
			readonly reason: 'unknown_preset';
			readonly rawPreset: string | undefined | null;
	  }
	| {
			readonly valid: false;
			readonly reason: 'unknown_item_kind';
			readonly rawItemKind: string;
	  }
	| {
			readonly valid: false;
			readonly reason: 'incompatible';
			readonly preset: PipelinePreset;
			readonly incompatibleKinds: readonly ItemKind[];
	  };

export const validatePipelinePresetCompatibility = ({
	preset,
	batchItemKind,
	classificationType,
	itemOverrides
}: PipelineValidationInput): PipelineValidationResult => {
	if (!preset || !isPipelinePreset(preset)) {
		return {
			valid: false,
			reason: 'unknown_preset',
			rawPreset: preset
		};
	}

	// Resolve default batch kind if not provided
	let resolvedBatchKind: ItemKind;
	if (batchItemKind && isItemKind(batchItemKind)) {
		resolvedBatchKind = batchItemKind;
	} else if (batchItemKind && !isItemKind(batchItemKind)) {
		return {
			valid: false,
			reason: 'unknown_item_kind',
			rawItemKind: batchItemKind
		};
	} else if (isClassificationType(classificationType)) {
		resolvedBatchKind = defaultItemKindForClassification(classificationType);
	} else {
		resolvedBatchKind = 'document';
	}

	const overrides = itemOverrides ?? [];
	const effectiveKinds: ItemKind[] = [];

	if (overrides.length === 0) {
		effectiveKinds.push(resolvedBatchKind);
	} else {
		for (const override of overrides) {
			if (override === null || override === undefined) {
				effectiveKinds.push(resolvedBatchKind);
			} else if (isItemKind(override)) {
				effectiveKinds.push(override);
			} else {
				return {
					valid: false,
					reason: 'unknown_item_kind',
					rawItemKind: override
				};
			}
		}
	}

	const allowedKinds = pipelinePresetCapabilities[preset].allowedKinds;
	const incompatibleKinds = effectiveKinds.filter((kind) => !allowedKinds.includes(kind));

	if (incompatibleKinds.length > 0) {
		return {
			valid: false,
			reason: 'incompatible',
			preset,
			incompatibleKinds: Array.from(new Set(incompatibleKinds))
		};
	}

	return {
		valid: true,
		effectiveKinds: Array.from(new Set(effectiveKinds))
	};
};
