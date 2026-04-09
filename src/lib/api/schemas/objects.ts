import { z } from "zod";

export const processingStateSchema = z.enum([
    "queued",
    "ingesting",
    "ingested",
    "derivatives_running",
    "derivatives_done",
    "ocr_running",
    "ocr_done",
    "index_running",
    "index_done",
    "processing_failed",
    "processing_skipped",
]);

export const curationStateSchema = z.enum([
    "needs_review",
    "review_in_progress",
    "reviewed",
    "curation_failed",
]);

export const availabilityStateSchema = z.enum([
    "AVAILABLE",
    "ARCHIVED",
    "RESTORE_PENDING",
    "RESTORING",
    "UNAVAILABLE",
]);

export const accessLevelSchema = z.enum(["private", "family", "public"]);

export const embargoKindSchema = z.enum(["none", "timed", "curation_state"]);

export const accessReasonCodeSchema = z.enum([
    "OK",
    "FORBIDDEN_POLICY",
    "EMBARGO_ACTIVE",
    "RESTORE_REQUIRED",
    "RESTORE_IN_PROGRESS",
    "TEMP_UNAVAILABLE",
]);

export const objectListItemSchema = z.object({
    id: z.string().min(1),
    object_id: z.string().min(1),
    thumbnail_artifact_id: z.string().min(1).nullable(),
    title: z.string().nullable(),
    processing_state: processingStateSchema,
    curation_state: curationStateSchema,
    availability_state: availabilityStateSchema,
    access_level: accessLevelSchema,
    type: z.string().min(1),
    tenant_id: z.string().min(1),
    source_ingestion_id: z.string().min(1).nullable(),
    source_batch_label: z.string().min(1).nullable(),
    metadata: z.record(z.string(), z.unknown()),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
    embargo_until: z.string().min(1).nullable(),
    embargo_kind: embargoKindSchema,
    embargo_curation_state: curationStateSchema.nullable(),
    rights_note: z.string().nullable(),
    sensitivity_note: z.string().nullable(),
    can_download: z.boolean(),
    access_reason_code: accessReasonCodeSchema,
    language: z.string().nullable().optional(),
    tags: z.array(z.string()).optional().default([]),
    has_access_pdf: z.union([z.literal(0), z.literal(1)]).optional(),
    has_ocr: z.union([z.literal(0), z.literal(1)]).optional(),
    has_index: z.union([z.literal(0), z.literal(1)]).optional(),
});

export const objectsListResponseSchema = z.object({
    objects: z.array(objectListItemSchema),
    next_cursor: z.string().nullable(),
    total_count: z.number().int().nonnegative(),
    filtered_count: z.number().int().nonnegative(),
});

export const objectDetailItemSchema = objectListItemSchema.extend({
    ingest_manifest: z.record(z.string(), z.unknown()).nullable().optional(),
    is_authorized: z.boolean().optional(),
    is_deliverable: z.boolean().optional(),
});

const objectViewerMediaTypeSchema = z.enum(['document', 'image', 'audio', 'video']);

const objectViewerSourceTypeSchema = z.enum(['original', 'access_copy', 'stream', 'preview', 'other']);

const objectViewerPrimarySourceStatusSchema = z.enum([
    'available',
    'request_required',
    'request_pending',
    'restricted',
    'temporarily_unavailable',
]);

const objectViewerActiveRequestSchema = z.object({
    id: z.string().min(1),
    action_type: z.literal('artifact_fetch'),
    status: z.enum(['PENDING', 'PROCESSING']),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
});

const objectViewerArtifactRefSchema = z.object({
    available: z.literal(true),
    artifact_id: z.string().min(1),
    content_type: z.string().nullable(),
    display_name: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()).default({}),
});

const objectViewerPreviewArtifactsSchema = z.object({
    thumbnail: objectViewerArtifactRefSchema.nullable(),
    poster: objectViewerArtifactRefSchema.nullable(),
    ocr_text: objectViewerArtifactRefSchema.nullable(),
    transcript: objectViewerArtifactRefSchema.nullable(),
    captions: objectViewerArtifactRefSchema.nullable(),
});

const objectViewerPrimarySourceSchema = z.object({
    source_type: objectViewerSourceTypeSchema,
    artifact_kind: z.enum(['original', 'preview', 'pdf', 'ocr_text', 'thumbnail', 'web_version', 'transcript', 'other']),
    variant: z.string().nullable(),
    status: objectViewerPrimarySourceStatusSchema,
    available_file_id: z.string().nullable(),
    artifact_id: z.string().nullable(),
    display_name: z.string().nullable(),
    content_type: z.string().nullable(),
    size_bytes: z.number().int().nonnegative().nullable(),
    access_reason_code: accessReasonCodeSchema,
});

const documentViewerPageSchema = z.object({
    page_number: z.number().int().positive(),
    label: z.string().nullable().optional(),
    image_artifact_id: z.string().nullable(),
    ocr_text_artifact_id: z.string().nullable(),
});

const documentViewerPayloadSchema = z.object({
    kind: z.literal('document'),
    artifact_id: z.string().nullable(),
    content_type: z.string().nullable(),
    ocr_text_artifact_id: z.string().nullable(),
    page_count: z.number().int().positive().nullable(),
    pages: z.array(documentViewerPageSchema).optional(),
});

const imageViewerPayloadSchema = z.object({
    kind: z.literal('image'),
    artifact_id: z.string().nullable(),
    content_type: z.string().nullable(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
});

const audioViewerPayloadSchema = z.object({
    kind: z.literal('audio'),
    artifact_id: z.string().nullable(),
    content_type: z.string().nullable(),
    transcript_artifact_id: z.string().nullable(),
    duration_seconds: z.number().nonnegative().nullable(),
});

const videoViewerPayloadSchema = z.object({
    kind: z.literal('video'),
    artifact_id: z.string().nullable(),
    content_type: z.string().nullable(),
    poster_artifact_id: z.string().nullable(),
    transcript_artifact_id: z.string().nullable(),
    captions_artifact_id: z.string().nullable(),
    duration_seconds: z.number().nonnegative().nullable(),
});

const objectViewerPayloadSchema = z.discriminatedUnion('kind', [
    documentViewerPayloadSchema,
    imageViewerPayloadSchema,
    audioViewerPayloadSchema,
    videoViewerPayloadSchema,
]);

const objectViewerSchema = z.object({
    media_type: objectViewerMediaTypeSchema,
    primary_source: objectViewerPrimarySourceSchema,
    active_request: objectViewerActiveRequestSchema.nullable(),
    preview_artifacts: objectViewerPreviewArtifactsSchema,
    viewer_payload: objectViewerPayloadSchema,
});

export const objectDetailResponseSchema = z.object({
    object: objectDetailItemSchema,
    viewer: objectViewerSchema.nullable(),
});

export const objectArtifactSchema = z.object({
    id: z.string().min(1),
    kind: z.string().min(1),
    variant: z.string().nullable().optional(),
    storage_key: z.string().min(1),
    content_type: z.string().min(1),
    size_bytes: z.number().int().nonnegative(),
    created_at: z.string().min(1),
});

export const objectArtifactsResponseSchema = z.object({
    object_id: z.string().min(1),
    artifacts: z.array(objectArtifactSchema),
});

export const objectAvailableFileSchema = z.object({
    id: z.uuid(),
    archive_file_key: z.string().min(1),
    artifact_kind: z.string().min(1),
    variant: z.string().nullable(),
    display_name: z.string().min(1),
    content_type: z.string().nullable(),
    size_bytes: z.number().int().nonnegative().nullable(),
    checksum_sha256: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()).default({}),
    is_available: z.boolean(),
    synced_at: z.iso.datetime(),
});

export const objectAvailableFilesResponseSchema = z.object({
    object_id: z.string().min(1),
    available_files: z.array(objectAvailableFileSchema),
});

export const objectDownloadRequestSchema = z.object({
    id: z.uuid(),
    available_file_id: z.uuid(),
    requested_by: z.string().min(1),
    artifact_kind: z.string().min(1),
    variant: z.string().nullable(),
    status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELED"]),
    failure_reason: z.string().nullable(),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
    completed_at: z.string().nullable(),
});

export const createObjectDownloadRequestResponseSchema = z.object({
    status: z.enum(["available", "queued"]),
    object_id: z.string().min(1),
    artifact: objectArtifactSchema.optional(),
    request: objectDownloadRequestSchema.optional(),
});

export type ObjectsListResponseDto = z.infer<typeof objectsListResponseSchema>;
export type ObjectListItemDto = z.infer<typeof objectListItemSchema>;
export type ObjectDetailResponseDto = z.infer<
    typeof objectDetailResponseSchema
>;
export type ObjectDetailItemDto = z.infer<typeof objectDetailItemSchema>;
export type ObjectViewerDto = z.infer<typeof objectViewerSchema>;
export type ObjectArtifactsResponseDto = z.infer<
    typeof objectArtifactsResponseSchema
>;
export type ObjectArtifactDto = z.infer<typeof objectArtifactSchema>;
export type ObjectAvailableFileDto = z.infer<typeof objectAvailableFileSchema>;
export type ObjectAvailableFilesResponseDto = z.infer<
    typeof objectAvailableFilesResponseSchema
>;
export type ObjectDownloadRequestDto = z.infer<
    typeof objectDownloadRequestSchema
>;
export type CreateObjectDownloadRequestResponseDto = z.infer<
    typeof createObjectDownloadRequestResponseSchema
>;

export const objectResyncRequestSchema = z.object({
    id: z.string().min(1),
    tenant_id: z.string().min(1),
    target_type: z.string().min(1),
    target_id: z.string().min(1),
    action_type: z.string().min(1),
    action_payload: z.record(z.string(), z.unknown()).default({}),
    requested_by: z.string().min(1),
    dedupe_key: z.string().min(1),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED']),
    failure_reason: z.string().nullable(),
    failure_details: z.unknown().nullable().optional(),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
    completed_at: z.string().nullable(),
});

export const createObjectResyncResponseSchema = z.object({
    status: z.literal('queued'),
    object_id: z.string().min(1),
    request: objectResyncRequestSchema,
});

export type ObjectResyncRequestDto = z.infer<typeof objectResyncRequestSchema>;
export type CreateObjectResyncResponseDto = z.infer<typeof createObjectResyncResponseSchema>;
