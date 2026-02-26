import { z } from 'zod';

export const processingStateSchema = z.enum([
	'queued',
	'ingesting',
	'ingested',
	'derivatives_running',
	'derivatives_done',
	'ocr_running',
	'ocr_done',
	'index_running',
	'index_done',
	'processing_failed',
	'processing_skipped'
]);

export const curationStateSchema = z.enum([
	'needs_review',
	'review_in_progress',
	'reviewed',
	'curation_failed'
]);

export const availabilityStateSchema = z.enum([
	'AVAILABLE',
	'ARCHIVED',
	'RESTORE_PENDING',
	'RESTORING',
	'UNAVAILABLE'
]);

export const accessLevelSchema = z.enum(['private', 'family', 'public']);

export const embargoKindSchema = z.enum(['none', 'timed', 'curation_state']);

export const accessReasonCodeSchema = z.enum([
	'OK',
	'FORBIDDEN_POLICY',
	'EMBARGO_ACTIVE',
	'RESTORE_REQUIRED',
	'RESTORE_IN_PROGRESS',
	'TEMP_UNAVAILABLE'
]);

export const objectListItemSchema = z.object({
	id: z.string().min(1),
	object_id: z.string().min(1),
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
	has_access_pdf: z.union([z.literal(0), z.literal(1)]).optional(),
	has_ocr: z.union([z.literal(0), z.literal(1)]).optional(),
	has_index: z.union([z.literal(0), z.literal(1)]).optional()
});

export const objectsListResponseSchema = z.object({
	objects: z.array(objectListItemSchema),
	next_cursor: z.string().nullable(),
	total_count: z.number().int().nonnegative(),
	filtered_count: z.number().int().nonnegative()
});

export type ObjectsListResponseDto = z.infer<typeof objectsListResponseSchema>;
export type ObjectListItemDto = z.infer<typeof objectListItemSchema>;
