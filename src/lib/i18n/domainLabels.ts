import type { TranslationKey } from './translations';
import type {
	AccessLevel,
	AccessReasonCode,
	AvailabilityState,
	CurationState,
	ObjectViewerMediaType,
	ObjectViewerPrimarySourceStatus,
	ProcessingState
} from '$lib/services/objects';
import type { ArchiveRequestStatus } from '$lib/services/archiveRequests';
import type { ObjectEditMediaType } from '$lib/services/objectEdit';
import type { UpdateIngestionRequest } from '$lib/services/ingestionDetail';
import type {
	DashboardActivityEventCode,
	DashboardRoleCopyCode
} from '$lib/services/dashboard';

export type IngestionPipelinePreset = NonNullable<
	UpdateIngestionRequest['payload']['pipelinePreset']
>;

export const dashboardRoleCopyKeys: Record<
	DashboardRoleCopyCode,
	{ primaryAction: TranslationKey; secondaryAction: TranslationKey; tagline: TranslationKey }
> = {
	admin: {
		primaryAction: 'dashboard.roles.admin.primaryAction',
		secondaryAction: 'dashboard.roles.admin.secondaryAction',
		tagline: 'dashboard.roles.admin.tagline'
	},
	archiver: {
		primaryAction: 'dashboard.roles.archiver.primaryAction',
		secondaryAction: 'dashboard.roles.archiver.secondaryAction',
		tagline: 'dashboard.roles.archiver.tagline'
	},
	viewer: {
		primaryAction: 'dashboard.roles.viewer.primaryAction',
		secondaryAction: 'dashboard.roles.viewer.secondaryAction',
		tagline: 'dashboard.roles.viewer.tagline'
	}
};

export const dashboardActivityEventKeys: Record<DashboardActivityEventCode, TranslationKey> = {
	INGESTION_SUBMITTED: 'dashboard.activity.events.INGESTION_SUBMITTED',
	INGESTION_QUEUED: 'dashboard.activity.events.INGESTION_QUEUED',
	INGESTION_PROCESSING: 'dashboard.activity.events.INGESTION_PROCESSING',
	INGESTION_COMPLETED: 'dashboard.activity.events.INGESTION_COMPLETED',
	INGESTION_FAILED: 'dashboard.activity.events.INGESTION_FAILED',
	INGESTION_CANCELED: 'dashboard.activity.events.INGESTION_CANCELED',
	LEASE_GRANTED: 'dashboard.activity.events.LEASE_GRANTED',
	LEASE_RENEWED: 'dashboard.activity.events.LEASE_RENEWED',
	LEASE_EXPIRED: 'dashboard.activity.events.LEASE_EXPIRED',
	LEASE_RELEASED: 'dashboard.activity.events.LEASE_RELEASED',
	FILE_VALIDATED: 'dashboard.activity.events.FILE_VALIDATED',
	FILE_FAILED: 'dashboard.activity.events.FILE_FAILED',
	PIPELINE_STEP_STARTED: 'dashboard.activity.events.PIPELINE_STEP_STARTED',
	PIPELINE_STEP_COMPLETED: 'dashboard.activity.events.PIPELINE_STEP_COMPLETED',
	PIPELINE_STEP_FAILED: 'dashboard.activity.events.PIPELINE_STEP_FAILED',
	INGESTION_ITEM_CREATED: 'dashboard.activity.events.INGESTION_ITEM_CREATED',
	INGESTION_ITEM_UPDATED: 'dashboard.activity.events.INGESTION_ITEM_UPDATED',
	INGESTION_ITEM_PROCESSING: 'dashboard.activity.events.INGESTION_ITEM_PROCESSING',
	INGESTION_ITEM_COMPLETED: 'dashboard.activity.events.INGESTION_ITEM_COMPLETED',
	INGESTION_ITEM_FAILED: 'dashboard.activity.events.INGESTION_ITEM_FAILED',
	OBJECT_CREATED: 'dashboard.activity.events.OBJECT_CREATED',
	ARTIFACT_CREATED: 'dashboard.activity.events.ARTIFACT_CREATED'
};

export const processingStateKeys: Record<ProcessingState, TranslationKey> = {
	queued: 'objects.detail.values.processing.queued',
	ingesting: 'objects.detail.values.processing.ingesting',
	ingested: 'objects.detail.values.processing.ingested',
	derivatives_running: 'objects.detail.values.processing.derivatives_running',
	derivatives_done: 'objects.detail.values.processing.derivatives_done',
	ocr_running: 'objects.detail.values.processing.ocr_running',
	ocr_done: 'objects.detail.values.processing.ocr_done',
	index_running: 'objects.detail.values.processing.index_running',
	index_done: 'objects.detail.values.processing.index_done',
	processing_failed: 'objects.detail.values.processing.processing_failed',
	processing_skipped: 'objects.detail.values.processing.processing_skipped'
};

export const curationStateKeys: Record<CurationState, TranslationKey> = {
	needs_review: 'objects.detail.values.curation.needs_review',
	review_in_progress: 'objects.detail.values.curation.review_in_progress',
	reviewed: 'objects.detail.values.curation.reviewed',
	curation_failed: 'objects.detail.values.curation.curation_failed'
};

export const availabilityStateKeys: Record<AvailabilityState, TranslationKey> = {
	AVAILABLE: 'objects.detail.values.availability.AVAILABLE',
	ARCHIVED: 'objects.detail.values.availability.ARCHIVED',
	RESTORE_PENDING: 'objects.detail.values.availability.RESTORE_PENDING',
	RESTORING: 'objects.detail.values.availability.RESTORING',
	UNAVAILABLE: 'objects.detail.values.availability.UNAVAILABLE'
};

export const accessReasonKeys: Record<AccessReasonCode, TranslationKey> = {
	OK: 'objects.detail.values.accessReasons.OK',
	FORBIDDEN_POLICY: 'objects.detail.values.accessReasons.FORBIDDEN_POLICY',
	EMBARGO_ACTIVE: 'objects.detail.values.accessReasons.EMBARGO_ACTIVE',
	RESTORE_REQUIRED: 'objects.detail.values.accessReasons.RESTORE_REQUIRED',
	RESTORE_IN_PROGRESS: 'objects.detail.values.accessReasons.RESTORE_IN_PROGRESS',
	TEMP_UNAVAILABLE: 'objects.detail.values.accessReasons.TEMP_UNAVAILABLE'
};

export const mediaTypeKeys: Record<ObjectViewerMediaType, TranslationKey> = {
	document: 'objects.detail.values.mediaTypes.document',
	image: 'objects.detail.values.mediaTypes.image',
	audio: 'objects.detail.values.mediaTypes.audio',
	video: 'objects.detail.values.mediaTypes.video'
};

export const objectEditMediaTypeKeys: Record<ObjectEditMediaType, TranslationKey> = {
	document: 'objects.detail.values.mediaTypes.document',
	image: 'objects.detail.values.mediaTypes.image',
	audio: 'objects.detail.values.mediaTypes.audio',
	video: 'objects.detail.values.mediaTypes.video',
	other: 'objects.detail.values.mediaTypes.other'
};

export const primarySourceStatusKeys: Record<ObjectViewerPrimarySourceStatus, TranslationKey> = {
	available: 'objects.detail.values.primarySourceStatus.available',
	request_required: 'objects.detail.values.primarySourceStatus.request_required',
	request_pending: 'objects.detail.values.primarySourceStatus.request_pending',
	restricted: 'objects.detail.values.primarySourceStatus.restricted',
	temporarily_unavailable: 'objects.detail.values.primarySourceStatus.temporarily_unavailable'
};

export const requestStatusKeys: Record<ArchiveRequestStatus, TranslationKey> = {
	PENDING: 'objects.detail.values.requestStatus.PENDING',
	PROCESSING: 'objects.detail.values.requestStatus.PROCESSING',
	COMPLETED: 'objects.detail.values.requestStatus.COMPLETED',
	FAILED: 'objects.detail.values.requestStatus.FAILED',
	CANCELED: 'objects.detail.values.requestStatus.CANCELED'
};

export const requestActionKeys: Record<string, TranslationKey> = {
	artifact_fetch: 'objects.detail.values.requestAction.artifact_fetch',
	curation_apply: 'objects.detail.values.requestAction.curation_apply',
	object_resync: 'objects.detail.values.requestAction.object_resync'
};

const KNOWN_LANGUAGE_LABEL_KEYS: Record<string, TranslationKey> = {
	en: 'objects.detail.values.languages.en',
	english: 'objects.detail.values.languages.en',
	ru: 'objects.detail.values.languages.ru',
	russian: 'objects.detail.values.languages.ru',
	mixed: 'objects.detail.values.languages.mixed',
	unknown: 'objects.detail.values.languages.unknown'
};

const KNOWN_REVIEW_LANGUAGE_LABEL_KEYS: Record<string, TranslationKey> = {
	en: 'objects.languages.en',
	fa: 'objects.languages.fa',
	tg: 'objects.languages.tg',
	ru: 'objects.languages.ru',
	mixed: 'objects.languages.mixed',
	unknown: 'objects.languages.unknown'
};

const KNOWN_SETUP_LANGUAGE_LABEL_KEYS: Record<string, TranslationKey> = {
	en: 'ingestionSetup.languages.en',
	ru: 'ingestionSetup.languages.ru',
	fa: 'ingestionSetup.languages.fa',
	tg: 'ingestionSetup.languages.tg',
	mixed: 'ingestionSetup.languages.mixed',
	english: 'ingestionSetup.languages.english',
	persian: 'ingestionSetup.languages.persian',
	tajik: 'ingestionSetup.languages.tajik'
};

export const reviewPipelinePresetKeys: Record<IngestionPipelinePreset, TranslationKey> = {
	auto: 'ingestionReview.preset.auto',
	none: 'ingestionReview.preset.none',
	ocr_text: 'ingestionReview.preset.ocr_text',
	audio_transcript: 'ingestionReview.preset.audio_transcript',
	video_transcript: 'ingestionReview.preset.video_transcript',
	ocr_and_audio_transcript: 'ingestionReview.preset.ocr_and_audio_transcript',
	ocr_and_video_transcript: 'ingestionReview.preset.ocr_and_video_transcript'
};

export const setupPipelinePresetKeys: Record<IngestionPipelinePreset, TranslationKey> = {
	auto: 'ingestionSetup.pipelinePresets.auto',
	none: 'ingestionSetup.pipelinePresets.none',
	ocr_text: 'ingestionSetup.pipelinePresets.ocr_text',
	audio_transcript: 'ingestionSetup.pipelinePresets.audio_transcript',
	video_transcript: 'ingestionSetup.pipelinePresets.video_transcript',
	ocr_and_audio_transcript: 'ingestionSetup.pipelinePresets.ocr_and_audio_transcript',
	ocr_and_video_transcript: 'ingestionSetup.pipelinePresets.ocr_and_video_transcript'
};

export const knownRequestActionKey = (actionType: string): TranslationKey | null =>
	requestActionKeys[actionType] ?? null;

export const accessLevelKeys: Record<AccessLevel, TranslationKey> = {
	private: 'ingestionSetup.batchIntent.accessLevels.private',
	family: 'ingestionSetup.batchIntent.accessLevels.family',
	public: 'ingestionSetup.batchIntent.accessLevels.public'
};

export const objectTypeKeys: Record<string, TranslationKey> = {
	GENERIC: 'objects.types.GENERIC',
	IMAGE: 'objects.types.IMAGE',
	AUDIO: 'objects.types.AUDIO',
	VIDEO: 'objects.types.VIDEO',
	DOCUMENT: 'objects.types.DOCUMENT'
};

export const knownObjectTypeKey = (type: string): TranslationKey | null =>
	objectTypeKeys[type.toUpperCase()] ?? null;

export const knownLanguageKey = (language: string): TranslationKey | null =>
	KNOWN_LANGUAGE_LABEL_KEYS[language.toLowerCase()] ?? null;

export const knownReviewLanguageKey = (language: string): TranslationKey | null =>
	KNOWN_REVIEW_LANGUAGE_LABEL_KEYS[language.trim().toLowerCase()] ?? null;

export const knownSetupLanguageKey = (language: string): TranslationKey | null =>
	KNOWN_SETUP_LANGUAGE_LABEL_KEYS[language.trim().toLowerCase()] ?? null;

export const knownReviewPipelinePresetKey = (preset: string): TranslationKey | null =>
	(reviewPipelinePresetKeys as Record<string, TranslationKey>)[preset] ?? null;

export const knownSetupPipelinePresetKey = (preset: string): TranslationKey | null =>
	(setupPipelinePresetKeys as Record<string, TranslationKey>)[preset] ?? null;

export const knownMediaTypeKey = (mediaType: string): TranslationKey | null =>
	mediaType.toLowerCase() in mediaTypeKeys
		? mediaTypeKeys[mediaType.toLowerCase() as ObjectViewerMediaType]
		: null;
