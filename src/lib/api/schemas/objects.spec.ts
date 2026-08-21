import { describe, expect, it } from 'vitest';

import {
	createObjectDownloadRequestResponseSchema,
	objectDetailResponseSchema,
	objectIdSchema,
	objectListItemSchema
} from './objects';

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

describe('objectDetailResponseSchema viewer contracts', () => {
	const detailObject = {
		id: 'OBJ-20260101-VIEWER', object_id: 'OBJ-20260101-VIEWER', thumbnail_artifact_id: null,
		title: 'Viewer object', processing_state: 'index_done', curation_state: 'reviewed',
		availability_state: 'AVAILABLE', access_level: 'private', type: 'DOCUMENT', tenant_id: 'tenant-1',
		source_ingestion_id: null, source_batch_label: null, metadata: {},
		created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
		embargo_until: null, embargo_kind: 'none', embargo_curation_state: null,
		rights_note: null, sensitivity_note: null, can_download: true,
		access_reason_code: 'OK'
	};

	const primarySource = {
		source_type: 'access_copy',
		artifact_kind: 'pdf',
		variant: null,
		status: 'available',
		available_file_id: null,
		artifact_id: null,
		display_name: null,
		content_type: null,
		size_bytes: null,
		access_reason_code: 'OK'
	};

	const previewArtifacts = {
		thumbnail: null,
		poster: null,
		ocr_text: null,
		transcript: null,
		captions: null
	};

	it('accepts document pages with OCR-only entries and nullable artifacts', () => {
		const parsed = objectDetailResponseSchema.safeParse({
			object: detailObject,
			viewer: {
				media_type: 'document',
				primary_source: primarySource,
				active_request: null,
				preview_artifacts: previewArtifacts,
				viewer_payload: {
					kind: 'document',
					artifact_id: null,
					content_type: 'application/pdf',
					ocr_text_artifact_id: 'ocr-agg',
					page_count: 2,
					pages: [
						{
							page_number: 1,
							label: 'Page 1',
							image_artifact_id: null,
							ocr_text_artifact_id: 'ocr-1'
						},
						{
							page_number: 2,
							label: 'Page 2',
							image_artifact_id: 'img-2',
							ocr_text_artifact_id: 'ocr-2'
						}
					]
				}
			}
		});

		expect(parsed.success).toBe(true);
	});

	it.each([
		{
			media_type: 'image',
			viewer_payload: {
				kind: 'image',
				artifact_id: null,
				content_type: 'image/jpeg',
				width: 640,
				height: 480
			}
		},
		{
			media_type: 'audio',
			viewer_payload: {
				kind: 'audio',
				artifact_id: null,
				content_type: 'audio/mpeg',
				transcript_artifact_id: null,
				duration_seconds: null
			}
		},
		{
			media_type: 'video',
			viewer_payload: {
				kind: 'video',
				artifact_id: null,
				content_type: 'video/mp4',
				poster_artifact_id: null,
				transcript_artifact_id: null,
				captions_artifact_id: null,
				duration_seconds: null
			}
		}
	])('accepts a $media_type viewer with a null primary artifact', (viewer) => {
		const parsed = objectDetailResponseSchema.safeParse({
			object: detailObject,
			viewer: {
				media_type: viewer.media_type,
				primary_source: primarySource,
				active_request: null,
				preview_artifacts: previewArtifacts,
				viewer_payload: viewer.viewer_payload
			}
		});

		expect(parsed.success).toBe(true);
	});
});
