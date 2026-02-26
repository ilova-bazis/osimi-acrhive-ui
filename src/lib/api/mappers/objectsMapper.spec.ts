import { describe, expect, it } from 'vitest';
import { mapObjectsList } from './objectsMapper';

describe('mapObjectsList', () => {
	it('maps backend object projection fields to UI rows', () => {
		const mapped = mapObjectsList({
			limit: 25,
			response: {
				objects: [
					{
						id: 'OBJ-1',
						object_id: 'OBJ-1',
						title: 'Sample object',
						processing_state: 'index_done',
						curation_state: 'reviewed',
						availability_state: 'AVAILABLE',
						access_level: 'family',
						type: 'DOCUMENT',
						language: 'fa',
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
						title: null,
						processing_state: 'queued',
						curation_state: 'needs_review',
						availability_state: 'UNAVAILABLE',
						access_level: 'private',
						type: 'IMAGE',
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
			}
		});

		expect(mapped.rows[0]?.indicators).toEqual({
			accessPdf: false,
			ocr: false,
			index: false
		});
	});
});
