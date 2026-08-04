import { describe, expect, it } from 'vitest';

import { createObjectDownloadRequestResponseSchema, objectIdSchema, objectListItemSchema } from './objects';

const queuedResponse = {
	status: 'queued',
	object_id: 'OBJ-20260101-SCHEMA1',
	request: {
		id: '60000000-0000-4000-8000-000000000001',
		available_file_id: '70000000-0000-4000-8000-000000000001',
		requested_by: 'user-1',
		artifact_kind: 'pdf',
		variant: null,
		status: 'PENDING',
		failure_reason: null,
		created_at: '2026-01-01T00:00:00.000Z',
		updated_at: '2026-01-01T00:00:00.000Z',
		completed_at: null
	}
};

describe('createObjectDownloadRequestResponseSchema', () => {
	it('accepts a queued response with a valid selected available-file ID', () => {
		expect(createObjectDownloadRequestResponseSchema.safeParse(queuedResponse).success).toBe(true);
	});

	it('rejects null or omitted selected available-file IDs', () => {
		expect(
			createObjectDownloadRequestResponseSchema.safeParse({
				...queuedResponse,
				request: { ...queuedResponse.request, available_file_id: null }
			}).success
		).toBe(false);

		const requestWithoutAvailableFileId: Partial<typeof queuedResponse.request> = {
			...queuedResponse.request
		};
		delete requestWithoutAvailableFileId.available_file_id;
		expect(
			createObjectDownloadRequestResponseSchema.safeParse({
				...queuedResponse,
				request: requestWithoutAvailableFileId
			}).success
		).toBe(false);
	});
});

describe('object identity schemas', () => {
	const listItem = {
		id: 'OBJ-20260101-SCHEMA1', object_id: 'OBJ-20260101-SCHEMA1', thumbnail_artifact_id: null,
		title: 'Object', processing_state: 'index_done', curation_state: 'reviewed',
		availability_state: 'AVAILABLE', access_level: 'private', type: 'DOCUMENT', tenant_id: 'tenant-1',
		source_ingestion_id: null, source_batch_label: null, metadata: {},
		created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
		embargo_until: null, embargo_kind: 'none', embargo_curation_state: null,
		rights_note: null, sensitivity_note: null, language: null, tags: [], can_download: true,
		access_reason_code: 'OK', has_access_pdf: false, has_ocr: false,
	};

	it('rejects prototype and malformed route identifiers', () => {
		expect(objectIdSchema.safeParse('prototype').success).toBe(false);
		expect(objectIdSchema.safeParse('OBJ-1').success).toBe(false);
		expect(objectIdSchema.safeParse('OBJ-20260101-SCHEMA1').success).toBe(true);
	});

	it('requires legacy id and canonical object_id to agree', () => {
		expect(objectListItemSchema.safeParse(listItem).success).toBe(true);
		expect(objectListItemSchema.safeParse({ ...listItem, id: 'OBJ-20260101-OTHER' }).success).toBe(false);
	});
});
