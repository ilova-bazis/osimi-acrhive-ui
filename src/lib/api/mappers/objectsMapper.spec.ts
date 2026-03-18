import { describe, expect, it } from 'vitest';
import type { ObjectsListResponseDto } from '$lib/api/schemas/objects';
import {
	mapCreateObjectDownloadRequestResponse,
	mapObjectArtifacts,
	mapObjectAvailableFiles,
	mapObjectDetail,
	mapObjectsList
} from './objectsMapper';

describe('mapObjectsList', () => {
	it('maps backend object projection fields to UI rows', () => {
		const mapped = mapObjectsList({
			limit: 25,
			response: {
				objects: [
					{
						id: 'OBJ-1',
						object_id: 'OBJ-1',
						thumbnail_artifact_id: '60000000-0000-4000-8000-000000000777',
						title: 'Sample object',
						processing_state: 'index_done',
						curation_state: 'reviewed',
						availability_state: 'AVAILABLE',
						access_level: 'family',
						type: 'DOCUMENT',
						language: 'fa',
						tags: ['source:family_archive', 'subject:history'],
						tenant_id: 'tenant-1',
						source_ingestion_id: 'ing-1',
						source_batch_label: 'batch-1',
						metadata: {},
						created_at: '2026-02-17T00:00:00.000Z',
						updated_at: '2026-02-17T01:00:00.000Z',
						embargo_until: null,
						embargo_kind: 'none',
						embargo_curation_state: null,
						rights_note: null,
						sensitivity_note: null,
						can_download: true,
						access_reason_code: 'OK',
						has_access_pdf: 1,
						has_ocr: 1,
						has_index: 1
					}
				],
				next_cursor: 'cursor-1',
				total_count: 124,
				filtered_count: 37
			}
		});

		expect(mapped.rows).toHaveLength(1);
		expect(mapped.rows[0]?.availabilityState).toBe('AVAILABLE');
		expect(mapped.rows[0]?.accessLevel).toBe('family');
		expect(mapped.rows[0]?.tags).toEqual(['source:family_archive', 'subject:history']);
		expect(mapped.rows[0]?.thumbnailArtifactId).toBe('60000000-0000-4000-8000-000000000777');
		expect(mapped.rows[0]?.indicators).toEqual({
			accessPdf: true,
			ocr: true,
			index: true
		});
		expect(mapped.nextCursor).toBe('cursor-1');
		expect(mapped.totalCount).toBe(124);
		expect(mapped.filteredCount).toBe(37);
	});

	it('defaults optional indicator flags to false', () => {
		const mapped = mapObjectsList({
			limit: 25,
			response: {
				objects: [
					{
						id: 'OBJ-2',
						object_id: 'OBJ-2',
						thumbnail_artifact_id: null,
						title: null,
						processing_state: 'queued',
						curation_state: 'needs_review',
						availability_state: 'UNAVAILABLE',
						access_level: 'private',
						type: 'IMAGE',
						language: null,
						tags: [],
						tenant_id: 'tenant-1',
						source_ingestion_id: null,
						source_batch_label: null,
						metadata: {},
						created_at: '2026-02-17T00:00:00.000Z',
						updated_at: '2026-02-17T01:00:00.000Z',
						embargo_until: null,
						embargo_kind: 'none',
						embargo_curation_state: null,
						rights_note: null,
						sensitivity_note: null,
						can_download: false,
						access_reason_code: 'TEMP_UNAVAILABLE'
					}
				],
				next_cursor: null,
				total_count: 1,
				filtered_count: 1
			}
		});

		expect(mapped.rows[0]?.indicators).toEqual({
			accessPdf: false,
			ocr: false,
			index: false
		});
		expect(mapped.rows[0]?.thumbnailArtifactId).toBeNull();
	});

	it('falls back to empty tags array when API omits tags', () => {
		const mapped = mapObjectsList({
			limit: 25,
			response: {
				objects: [
					{
						id: 'OBJ-3',
						object_id: 'OBJ-3',
						thumbnail_artifact_id: null,
						title: 'Legacy object',
						processing_state: 'queued',
						curation_state: 'needs_review',
						availability_state: 'UNAVAILABLE',
						access_level: 'private',
						type: 'DOCUMENT',
						language: null,
						tenant_id: 'tenant-1',
						source_ingestion_id: null,
						source_batch_label: null,
						metadata: {},
						created_at: '2026-02-17T00:00:00.000Z',
						updated_at: '2026-02-17T01:00:00.000Z',
						embargo_until: null,
						embargo_kind: 'none',
						embargo_curation_state: null,
						rights_note: null,
						sensitivity_note: null,
						can_download: false,
						access_reason_code: 'TEMP_UNAVAILABLE'
					}
				],
				next_cursor: null,
				total_count: 1,
				filtered_count: 1
			} as unknown as ObjectsListResponseDto
		});

		expect(mapped.rows[0]?.tags).toEqual([]);
	});

	it('maps object detail ingest and access projection fields', () => {
		const mapped = mapObjectDetail({
			object: {
				id: 'OBJ-9',
				object_id: 'OBJ-9',
				thumbnail_artifact_id: '60000000-0000-4000-8000-000000000999',
				title: 'Detail object',
				processing_state: 'index_done',
				curation_state: 'reviewed',
				availability_state: 'AVAILABLE',
				access_level: 'public',
				type: 'DOCUMENT',
				tags: ['source:family_archive'],
				tenant_id: 'tenant-1',
				source_ingestion_id: 'ing-1',
				source_batch_label: 'batch-1',
				metadata: {},
				created_at: '2026-02-17T00:00:00.000Z',
				updated_at: '2026-02-17T01:00:00.000Z',
				embargo_until: null,
				embargo_kind: 'none',
				embargo_curation_state: null,
				rights_note: null,
				sensitivity_note: null,
				can_download: true,
				access_reason_code: 'OK',
				has_access_pdf: 1,
				has_ocr: 1,
				has_index: 1,
				ingest_manifest: {
					schema_version: '1.0',
					object_id: 'OBJ-9'
				},
				is_authorized: true,
				is_deliverable: true
			}
		});

		expect(mapped.objectId).toBe('OBJ-9');
		expect(mapped.thumbnailArtifactId).toBe('60000000-0000-4000-8000-000000000999');
		expect(mapped.tags).toEqual(['source:family_archive']);
		expect(mapped.ingestManifest).toEqual({
			schema_version: '1.0',
			object_id: 'OBJ-9'
		});
		expect(mapped.isAuthorized).toBe(true);
		expect(mapped.isDeliverable).toBe(true);
	});

	it('maps artifact list fields', () => {
		const mapped = mapObjectArtifacts({
			object_id: 'OBJ-9',
			artifacts: [
				{
					id: 'artifact-1',
					kind: 'ocr_text',
					variant: null,
					storage_key: 'objects/OBJ-9/ocr.txt',
					content_type: 'text/plain',
					size_bytes: 1234,
					created_at: '2026-02-17T01:00:00.000Z'
				}
			]
		});

		expect(mapped).toEqual([
			{
				id: 'artifact-1',
				kind: 'ocr_text',
				variant: null,
				storageKey: 'objects/OBJ-9/ocr.txt',
				contentType: 'text/plain',
				sizeBytes: 1234,
				createdAt: '2026-02-17T01:00:00.000Z'
			}
		]);
	});

	it('maps available files fields', () => {
		const mapped = mapObjectAvailableFiles({
			object_id: 'OBJ-9',
			available_files: [
				{
					id: '11111111-1111-4111-8111-111111111111',
					archive_file_key: 'archive/key.pdf',
					artifact_kind: 'original',
					variant: null,
					display_name: 'Original file',
					content_type: 'application/pdf',
					size_bytes: 999,
					checksum_sha256: null,
					metadata: {},
					is_available: true,
					synced_at: '2026-03-02T10:00:00.000Z'
				}
			]
		});

		expect(mapped[0]).toEqual({
			id: '11111111-1111-4111-8111-111111111111',
			archiveFileKey: 'archive/key.pdf',
			artifactKind: 'original',
			variant: null,
			displayName: 'Original file',
			contentType: 'application/pdf',
			sizeBytes: 999,
			checksumSha256: null,
			metadata: {},
			isAvailable: true,
			syncedAt: '2026-03-02T10:00:00.000Z'
		});
	});

	it('maps create download request response for available shortcut', () => {
		const mapped = mapCreateObjectDownloadRequestResponse({
			status: 'available',
			object_id: 'OBJ-9',
			artifact: {
				id: 'artifact-1',
				kind: 'original',
				variant: null,
				storage_key: 'objects/OBJ-9/original.pdf',
				content_type: 'application/pdf',
				size_bytes: 1024,
				created_at: '2026-03-02T10:00:00.000Z'
			}
		});

		expect(mapped.status).toBe('available');
		expect(mapped.artifact?.kind).toBe('original');
		expect(mapped.request).toBeNull();
	});
});
