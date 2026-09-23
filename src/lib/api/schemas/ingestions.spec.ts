import { describe, expect, it } from 'vitest';

import {
	createIngestionResponseSchema,
	ingestionDetailResponseSchema,
	ingestionDtoSchema,
	ingestionsListResponseSchema
} from './ingestions';

const resourceFields = {
	staging_purge: { state: 'NOT_SCHEDULED' as const, started_at: null, purged_at: null },
	action_capabilities: {
		can_resume: false,
		can_retry: true,
		can_cancel: false,
		can_restore: false,
		can_delete: false
	}
};

describe('ingestionDtoSchema', () => {
	it('accepts legacy and canonical identifier aliases', () => {
		expect(ingestionDtoSchema.safeParse({ id: 'id-1' }).success).toBe(true);
		expect(ingestionDtoSchema.safeParse({ ingestion_id: 'ing-1' }).success).toBe(true);
		expect(ingestionDtoSchema.safeParse({ batch_id: 'batch-1' }).success).toBe(true);
		expect(ingestionDtoSchema.safeParse({ batch_label: 'Batch 1' }).success).toBe(true);
	});

	it('rejects payloads without any ingestion identifier', () => {
		const parsed = ingestionDtoSchema.safeParse({ status: 'DRAFT' });

		expect(parsed.success).toBe(false);
		if (!parsed.success) {
			expect(parsed.error.issues[0]?.message).toBe('Expected at least one ingestion identifier field');
		}
	});
});

describe('createIngestionResponseSchema', () => {
	it('accepts a canonical ingestion id', () => {
		expect(createIngestionResponseSchema.safeParse({ ingestion: { id: 'ing-1' } }).success).toBe(true);
	});

	it('accepts a canonical id alongside legacy aliases', () => {
		expect(
			createIngestionResponseSchema.safeParse({
				ingestion: { id: 'ing-1', ingestion_id: 'ing-1', batch_label: 'Batch 1' }
			}).success
		).toBe(true);
	});

	it('rejects responses with alias-only identifiers', () => {
		expect(createIngestionResponseSchema.safeParse({ ingestion: { ingestion_id: 'ing-1' } }).success).toBe(false);
		expect(createIngestionResponseSchema.safeParse({ ingestion: { batch_id: 'batch-1' } }).success).toBe(false);
		expect(createIngestionResponseSchema.safeParse({ ingestion: { batch_label: 'Batch 1' } }).success).toBe(false);
	});

	it('rejects responses without any identifier', () => {
		expect(createIngestionResponseSchema.safeParse({ ingestion: { status: 'draft' } }).success).toBe(false);
	});
});

describe('ingestionsListResponseSchema', () => {
	it('rejects list responses containing rows without identifiers', () => {
		const parsed = ingestionsListResponseSchema.safeParse({
			ingestions: [{ status: 'DRAFT', ...resourceFields }],
			next_cursor: null
		});

		expect(parsed.success).toBe(false);
	});
});

describe('ingestionDetailResponseSchema', () => {
	it('accepts retention-purged previews', () => {
		const parsed = ingestionDetailResponseSchema.safeParse({
			ingestion: { id: 'ing-1', ...resourceFields },
			files: [
				{
					id: 'file-1',
					filename: 'page-1.jpg',
					preview: {
						status: 'purged',
						content_type: null,
						size_bytes: null,
						width: null,
						height: null,
						url: null,
						error: null
					}
				}
			]
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.files?.[0]?.preview?.status).toBe('purged');
		}
	});

	it('rejects unknown preview statuses', () => {
		const parsed = ingestionDetailResponseSchema.safeParse({
			ingestion: { id: 'ing-1', ...resourceFields },
			files: [{ id: 'file-1', preview: { status: 'deleted' } }]
		});

		expect(parsed.success).toBe(false);
	});

	it('requires purge and action capability fields on ingestion resources', () => {
		expect(
			ingestionsListResponseSchema.safeParse({
				ingestions: [{ id: 'ing-1', ...resourceFields }],
				next_cursor: null
			}).success
		).toBe(true);
		expect(
			ingestionsListResponseSchema.safeParse({
				ingestions: [{ id: 'ing-1', staging_purge: resourceFields.staging_purge }],
				next_cursor: null
			}).success
		).toBe(false);
	});

	it('accepts unknown pipeline_preset on inbound DTO', () => {
		const parsed = ingestionDtoSchema.safeParse({
			id: 'ing-1',
			pipeline_preset: 'historical_unknown_preset'
		});
		expect(parsed.success).toBe(true);
	});
});

describe('createIngestionRequestSchema and updateIngestionRequestSchema', () => {
	it('accepts known pipeline presets and rejects unknown ones', async () => {
		const { createIngestionRequestSchema, updateIngestionRequestSchema } = await import('./ingestions');

		const validPayload = {
			batch_label: 'Batch 1',
			schema_version: '1.0' as const,
			classification_type: 'document' as const,
			item_kind: 'document' as const,
			language_code: 'en',
			pipeline_preset: 'ocr_text' as const,
			access_level: 'private' as const,
			summary: {
				title: { primary: 'Batch 1', original_script: null, translations: [] },
				classification: { tags: [], summary: null },
				dates: {
					published: { value: null, approximate: false, confidence: 'medium' as const, note: null },
					created: { value: null, approximate: false, confidence: 'medium' as const, note: null }
				}
			}
		};

		expect(createIngestionRequestSchema.safeParse(validPayload).success).toBe(true);

		const invalidPayload = {
			...validPayload,
			pipeline_preset: 'unknown_preset'
		};
		expect(createIngestionRequestSchema.safeParse(invalidPayload).success).toBe(false);

		expect(updateIngestionRequestSchema.safeParse({ pipeline_preset: 'audio_transcript' }).success).toBe(true);
		expect(updateIngestionRequestSchema.safeParse({ pipeline_preset: 'invalid_preset' }).success).toBe(false);
	});
});

describe('ingestionItemSchema', () => {
	it('accepts null, known kinds, and unknown strings for item_kind', async () => {
		const { ingestionItemSchema } = await import('./ingestions');

		const baseItem = {
			id: 'item-1',
			ingestion_id: 'ing-1',
			item_index: 1,
			status: 'DRAFT',
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z'
		};

		expect(ingestionItemSchema.safeParse({ ...baseItem, item_kind: null }).success).toBe(true);
		expect(ingestionItemSchema.safeParse({ ...baseItem, item_kind: 'photo' }).success).toBe(true);
		expect(ingestionItemSchema.safeParse({ ...baseItem, item_kind: 'raw_legacy_override' }).success).toBe(true);
	});
});
