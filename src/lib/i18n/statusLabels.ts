import type { TranslationKey } from './translations';
import type { FileStatus } from '$lib/types';
import type { IngestionStatus } from '$lib/services/ingestionOverview';

export type IngestionFileStatus = 'pending' | 'uploaded' | 'validated' | 'failed';

export type IngestionItemStatus = 'pending' | 'ready' | 'processing' | 'completed' | 'failed' | 'skipped';

export type StatusResolution<T extends string> = {
	raw: string;
	normalized: string;
	value: T | null;
};

export type StatusEntry = {
	labelKey: TranslationKey;
	tone: FileStatus;
};

export const normalizeStatusToken = (value: string): string =>
	value.trim().toLowerCase().replace(/[_-]+/g, '_');

export const batchStatusEntries: Record<IngestionStatus, StatusEntry> = {
	draft: { labelKey: 'ingestionOverview.statuses.draft', tone: 'queued' },
	uploading: { labelKey: 'ingestionOverview.statuses.uploading', tone: 'processing' },
	queued: { labelKey: 'ingestionOverview.statuses.queued', tone: 'queued' },
	ingesting: { labelKey: 'ingestionOverview.statuses.ingesting', tone: 'processing' },
	completed: { labelKey: 'ingestionOverview.statuses.completed', tone: 'approved' },
	completed_with_errors: {
		labelKey: 'ingestionOverview.statuses.completed_with_errors',
		tone: 'needs-review'
	},
	failed: { labelKey: 'ingestionOverview.statuses.failed', tone: 'failed' },
	canceled: { labelKey: 'ingestionOverview.statuses.canceled', tone: 'blocked' }
};

const BATCH_STATUS_BY_TOKEN: Record<string, IngestionStatus> = {
	draft: 'draft',
	uploading: 'uploading',
	queued: 'queued',
	processing: 'ingesting',
	completed: 'completed',
	completed_with_errors: 'completed_with_errors',
	failed: 'failed',
	canceled: 'canceled'
};

export const fileStatusEntries: Record<IngestionFileStatus, StatusEntry> = {
	pending: { labelKey: 'ingestionStatuses.files.pending', tone: 'queued' },
	uploaded: { labelKey: 'ingestionStatuses.files.uploaded', tone: 'approved' },
	validated: { labelKey: 'ingestionStatuses.files.validated', tone: 'approved' },
	failed: { labelKey: 'ingestionStatuses.files.failed', tone: 'failed' }
};

export const itemStatusEntries: Record<IngestionItemStatus, StatusEntry> = {
	pending: { labelKey: 'ingestionStatuses.items.pending', tone: 'queued' },
	ready: { labelKey: 'ingestionStatuses.items.ready', tone: 'approved' },
	processing: { labelKey: 'ingestionStatuses.items.processing', tone: 'processing' },
	completed: { labelKey: 'ingestionStatuses.items.completed', tone: 'approved' },
	failed: { labelKey: 'ingestionStatuses.items.failed', tone: 'failed' },
	skipped: { labelKey: 'ingestionStatuses.items.skipped', tone: 'skipped' }
};

export const presentationStatusEntries: Record<FileStatus, StatusEntry> = {
	queued: { labelKey: 'statuses.queued', tone: 'queued' },
	processing: { labelKey: 'statuses.processing', tone: 'processing' },
	extracted: { labelKey: 'statuses.extracted', tone: 'extracted' },
	'needs-review': { labelKey: 'statuses.needsReview', tone: 'needs-review' },
	approved: { labelKey: 'statuses.approved', tone: 'approved' },
	blocked: { labelKey: 'statuses.blocked', tone: 'blocked' },
	skipped: { labelKey: 'statuses.skipped', tone: 'skipped' },
	failed: { labelKey: 'statuses.failed', tone: 'failed' }
};

const PRESENTATION_STATUS_BY_TOKEN: Record<string, FileStatus> = Object.fromEntries(
	(Object.keys(presentationStatusEntries) as FileStatus[]).map((status) => [
		normalizeStatusToken(status),
		status
	])
) as Record<string, FileStatus>;

const resolveStatus = <T extends string>(
	entries: Readonly<Record<T, StatusEntry>>,
	rawValue: string | undefined | null
): StatusResolution<T> => {
	const raw = rawValue ?? '';
	if (!raw) {
		return { raw: '', normalized: '', value: null };
	}
	const normalized = normalizeStatusToken(raw);
	const entry = (entries as Readonly<Record<string, StatusEntry>>)[normalized];
	return { raw, normalized, value: entry ? (normalized as T) : null };
};

export const resolveBatchStatus = (
	rawValue: string | undefined | null
): StatusResolution<IngestionStatus> => {
	const raw = rawValue ?? '';
	if (!raw) {
		return { raw: '', normalized: '', value: null };
	}
	const normalized = normalizeStatusToken(raw);
	return { raw, normalized, value: BATCH_STATUS_BY_TOKEN[normalized] ?? null };
};

export const resolveFileStatus = (
	rawValue: string | undefined | null
): StatusResolution<IngestionFileStatus> => resolveStatus(fileStatusEntries, rawValue);

export const resolveItemStatus = (
	rawValue: string | undefined | null
): StatusResolution<IngestionItemStatus> => resolveStatus(itemStatusEntries, rawValue);

export const resolvePresentationStatus = (
	rawValue: string | undefined | null
): StatusResolution<FileStatus> => {
	const raw = rawValue ?? '';
	if (!raw) {
		return { raw: '', normalized: '', value: null };
	}
	const normalized = normalizeStatusToken(raw);
	return { raw, normalized, value: PRESENTATION_STATUS_BY_TOKEN[normalized] ?? null };
};

export const batchStatusKey = (status: IngestionStatus | null): TranslationKey | null =>
	status ? batchStatusEntries[status].labelKey : null;

export const batchStatusTone = (status: IngestionStatus | null): FileStatus =>
	status ? batchStatusEntries[status].tone : 'queued';

export const fileStatusKey = (status: IngestionFileStatus | null): TranslationKey | null =>
	status ? fileStatusEntries[status].labelKey : null;

export const fileStatusTone = (status: IngestionFileStatus | null): FileStatus =>
	status ? fileStatusEntries[status].tone : 'queued';

export const itemStatusKey = (status: IngestionItemStatus | null): TranslationKey | null =>
	status ? itemStatusEntries[status].labelKey : null;

export const itemStatusTone = (status: IngestionItemStatus | null): FileStatus =>
	status ? itemStatusEntries[status].tone : 'queued';

export const presentationStatusKey = (status: FileStatus): TranslationKey =>
	presentationStatusEntries[status].labelKey;

export const knownBatchStatusKey = (status: string | null): TranslationKey | null =>
	batchStatusKey(resolveBatchStatus(status).value);

export const knownFileStatusKey = (status: string | null): TranslationKey | null =>
	fileStatusKey(resolveFileStatus(status).value);
