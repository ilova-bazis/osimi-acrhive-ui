import type {
	Batch,
	BatchItem,
	CatalogAccessLevel,
	CatalogLanguageCode,
	FileState,
	Language,
	Visibility
} from '$lib/models';
import type { FileItem, FileStatus, StatusBadgeTone } from '$lib/types';

export const fileStatusOrder: FileStatus[] = [
	'queued',
	'processing',
	'extracted',
	'needs-review',
	'approved',
	'blocked',
	'skipped',
	'failed'
];

export const mapStatusList = (labels: Record<FileStatus, string>) =>
	fileStatusOrder.map((status) => ({ key: status, label: labels[status] }));

export const mapBatchItemsToFiles = (items: BatchItem[]): FileItem[] =>
	items.map((item, index) => ({
		id: index + 1,
		name: item.originalFilename,
		type: mapMimeTypeLabel(item.mimeType),
		size: '—',
		status: (item.status ?? 'queued') as FileStatus
	}));

export const mapIntentFields = (
	batch: Batch,
	labels: { language: string; category: string; preset: string; visibility: string },
	unknownValue = '—'
) => [
	{ label: labels.language, value: batch.defaults.language ?? unknownValue },
	{ label: labels.category, value: batch.defaults.contentCategory ?? unknownValue },
	{ label: labels.preset, value: batch.defaults.pipelinePreset ?? unknownValue },
	{ label: labels.visibility, value: batch.defaults.visibility ?? unknownValue }
];

export const mapOverrideFields = (
	item: BatchItem | undefined,
	labels: { language: string; documentType: string },
	unknownValue = '—'
) => [
	{ label: labels.language, value: item?.overrides?.language ?? unknownValue },
	{ label: labels.documentType, value: item?.overrides?.documentType ?? unknownValue }
];

export const mapOverrideBadges = (
	item: BatchItem | undefined,
	labels: {
		pipelines: { ocr: string; layoutOcr: string; speechToText: string; imageTagging: string };
		attention: string;
	}
): { label: string; tone: StatusBadgeTone }[] => {
	if (!item?.overrides?.pipelines) {
		return [];
	}

	const { pipelines } = item.overrides;
	const badges: { label: string; tone: StatusBadgeTone }[] = [];

	if (pipelines.ocr) {
		badges.push({ label: labels.pipelines.ocr, tone: 'system' });
	}
	if (pipelines.layoutOcr) {
		badges.push({ label: labels.pipelines.layoutOcr, tone: 'system' });
	}
	if (pipelines.speechToText) {
		badges.push({ label: labels.pipelines.speechToText, tone: 'system' });
	}
	if (pipelines.imageTagging) {
		badges.push({ label: labels.pipelines.imageTagging, tone: 'system' });
	}

	if (item.status === 'needs-review' || item.status === 'blocked') {
		badges.push({ label: labels.attention, tone: 'attention' });
	}

	return badges;
};

export const mapLanguageToCatalogCode = (
	language: Language,
	fallback: CatalogLanguageCode = 'fa'
): CatalogLanguageCode => {
	switch (language) {
		case 'Persian':
			return 'fa';
		case 'Tajik':
			return 'tg';
		case 'English':
			return 'en';
		case 'Mixed / Unknown':
		default:
			return fallback;
	}
};

export const mapVisibilityToAccessLevel = (visibility: Visibility): CatalogAccessLevel => {
	switch (visibility) {
		case 'Public':
			return 'public';
		case 'Team':
			return 'family';
		case 'Private':
		default:
			return 'private';
	}
};

const mapMimeTypeLabel = (mimeType: string) => {
	if (mimeType.startsWith('image/')) {
		return mimeType.includes('jpeg') || mimeType.includes('png') ? 'Photo' : 'Image';
	}
	if (mimeType === 'application/pdf') {
		return 'PDF';
	}
	if (mimeType.startsWith('audio/')) {
		return 'Audio';
	}
	if (mimeType.startsWith('video/')) {
		return 'Video';
	}
	if (mimeType.includes('zip') || mimeType.includes('archive')) {
		return 'Archive';
	}
	return 'Document';
};

export const mapFileState = (state: FileState | undefined): FileStatus =>
	(state ?? 'queued') as FileStatus;
