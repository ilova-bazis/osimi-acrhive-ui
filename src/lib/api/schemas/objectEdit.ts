import { z } from 'zod';
import { curationStateSchema } from '$lib/api/schemas/objects';

export const documentPageStatusSchema = z.enum(['machine', 'edited']);

export const objectEditDocumentPageSchema = z.object({
	page_number: z.number().int().positive(),
	label: z.string().nullable(),
	machine_text: z.string(),
	curated_text: z.string().nullable(),
	status: documentPageStatusSchema,
});

export const objectEditCurationPayloadSchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('document'),
		machine_ocr_artifact_id: z.string().nullable(),
		page_count: z.number().int().nullable(),
		pages: z.array(objectEditDocumentPageSchema),
	}),
	z.object({ kind: z.literal('image') }),
	z.object({ kind: z.literal('audio') }),
	z.object({ kind: z.literal('video') }),
	z.object({ kind: z.literal('other') }),
]);

const lockSchema = z.object({
	locked: z.boolean(),
	locked_by: z.string().nullable(),
	locked_until: z.string().nullable(),
});

export const objectEditPayloadSchema = z.object({
	object_id: z.string().min(1),
	media_type: z.enum(['document', 'image', 'audio', 'video', 'other']),
	lock: lockSchema,
	curation_state: curationStateSchema,
	draft: z
		.object({
			updated_at: z.string(),
			updated_by: z.string(),
		})
		.nullable(),
	metadata: z.object({
		title: z.string(),
		publication_date: z.string(),
		date_precision: z.enum(['none', 'year', 'month', 'day']),
		date_approximate: z.boolean(),
		language: z.string().nullable(),
		tags: z.array(z.string()),
		people: z.array(z.string()),
		description: z.string().nullable(),
	}),
	rights: z.object({
		access_level: z.enum(['private', 'family', 'public']),
		rights_note: z.string().nullable(),
		sensitivity_note: z.string().nullable(),
	}),
	capabilities: z.object({
		can_edit_metadata: z.boolean(),
		can_curate_text: z.boolean(),
		can_submit_review: z.boolean(),
	}),
	curation_payload: objectEditCurationPayloadSchema,
});

export const saveMetadataResultSchema = z.object({
	object_id: z.string(),
	curation_state: curationStateSchema,
	updated_at: z.string(),
});

export const saveDocumentCurationResultSchema = z.object({
	object_id: z.string(),
	updated_count: z.number().int(),
	updated_at: z.string(),
});

export const submitCurationResultSchema = z.object({
	object_id: z.string(),
	curation_state: curationStateSchema,
	request: z.object({
		id: z.string(),
		action_type: z.string(),
		status: z.enum(['PENDING', 'PROCESSING']),
	}),
	submitted_at: z.string(),
	submitted_by: z.string(),
});

export const releaseLockResultSchema = z.object({
	object_id: z.string(),
	released: z.boolean(),
});

export type ObjectEditDocumentPageDto = z.infer<typeof objectEditDocumentPageSchema>;
export type ObjectEditPayloadDto = z.infer<typeof objectEditPayloadSchema>;
export type SaveMetadataResultDto = z.infer<typeof saveMetadataResultSchema>;
export type SaveDocumentCurationResultDto = z.infer<typeof saveDocumentCurationResultSchema>;
export type SubmitCurationResultDto = z.infer<typeof submitCurationResultSchema>;
export type ReleaseLockResultDto = z.infer<typeof releaseLockResultSchema>;
