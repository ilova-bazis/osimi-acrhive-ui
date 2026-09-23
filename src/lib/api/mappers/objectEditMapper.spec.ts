import { describe, expect, it } from 'vitest';
import {
	mapObjectArchiveSync,
	mapObjectEditDocumentPage,
	mapObjectEditPayload,
	mapReleaseLockResult,
	mapSaveDocumentCurationResult,
	mapSaveMetadataResult,
	mapSubmitObjectChangesResult,
} from './objectEditMapper';

describe('objectEditMapper', () => {
	it('maps null curated text to an empty editable string', () => {
		expect(
			mapObjectEditDocumentPage({
				page_number: 1,
				label: '1',
				machine_text: 'Machine OCR',
				curated_text: null,
				status: 'machine',
			}),
		).toEqual({
			pageNumber: 1,
			label: '1',
			machineText: 'Machine OCR',
			curatedText: '',
			status: 'machine',
		});
	});

	it('maps object edit payloads to domain shape', () => {
		expect(
			mapObjectEditPayload({
				object_id: 'OBJ-1',
				revision: 4,
				media_type: 'document',
				lock: { locked: true, locked_by: 'u1', locked_until: '2026-05-23T19:00:00.000Z' },
				curation_state: 'review_in_progress',
				draft: { updated_at: '2026-05-23T18:00:00.000Z', updated_by: 'u1' },
				metadata: {
					title: 'Object title',
					publication_date: '2026',
					date_precision: 'year',
					date_approximate: true,
					language: 'en',
					tags: ['archive'],
					people: ['Ada'],
					description: 'Description',
				},
				rights: {
					access_level: 'family',
					rights_note: 'Rights',
					sensitivity_note: null,
				},
				capabilities: {
					can_edit_metadata: true,
					can_curate_text: true,
					can_submit_review: false,
					can_submit_changes: true,
				},
				curation_payload: {
					kind: 'document',
					machine_ocr_artifact_id: 'ocr-1',
					page_count: 1,
					pages: [
						{
							page_number: 1,
							label: null,
							machine_text: 'Raw',
							curated_text: 'Edited',
							status: 'edited',
						},
					],
				},
			}),
		).toMatchObject({
			objectId: 'OBJ-1',
			revision: 4,
			mediaType: 'document',
			lock: { locked: true, lockedBy: 'u1' },
			curationState: 'review_in_progress',
			draft: { updatedAt: '2026-05-23T18:00:00.000Z', updatedBy: 'u1' },
			metadata: { title: 'Object title', people: ['Ada'] },
			rights: { accessLevel: 'family', rightsNote: 'Rights' },
			capabilities: { canEditMetadata: true, canCurateText: true, canSubmitChanges: true },
			curation: { kind: 'document', machineOcrArtifactId: 'ocr-1', pages: [{ curatedText: 'Edited' }] },
		});
	});

	it('maps mutation result payloads', () => {
		expect(
			mapSaveMetadataResult({
				object_id: 'OBJ-1',
				revision: 5,
				curation_state: 'review_in_progress',
				updated_at: '2026-05-23T18:00:00.000Z',
			}),
		).toEqual({
			objectId: 'OBJ-1',
			revision: 5,
			curationState: 'review_in_progress',
			updatedAt: '2026-05-23T18:00:00.000Z',
		});

		expect(
			mapSaveDocumentCurationResult({
				object_id: 'OBJ-1',
				revision: 6,
				updated_count: 2,
				updated_at: '2026-05-23T18:01:00.000Z',
			}),
		).toEqual({
			objectId: 'OBJ-1',
			revision: 6,
			updatedCount: 2,
			updatedAt: '2026-05-23T18:01:00.000Z',
		});

		expect(
			mapSubmitObjectChangesResult({
				object_id: 'OBJ-1',
				current_revision: 6,
				submitted_revision: 6,
				submission: {
					id: 'sub-1',
					request_id: 'req-1',
					action_type: 'object_revision_apply',
					status: 'PENDING',
					submitted_at: '2026-05-23T18:02:00.000Z',
					submitted_by: 'u1',
				},
			}),
		).toEqual({
			objectId: 'OBJ-1',
			currentRevision: 6,
			submittedRevision: 6,
			submission: {
				id: 'sub-1',
				requestId: 'req-1',
				status: 'PENDING',
				submittedAt: '2026-05-23T18:02:00.000Z',
				submittedBy: 'u1',
			},
		});

		expect(
			mapObjectArchiveSync({
				object_id: 'OBJ-1',
				current_revision: 6,
				latest_submitted_revision: 6,
				latest_applied_revision: 6,
				archive_out_of_sync: false,
				active_submission: null,
				latest_submission: {
					id: 'sub-1',
					request_id: 'req-1',
					submitted_revision: 6,
					status: 'COMPLETED',
					submitted_at: '2026-05-23T18:02:00.000Z',
					submitted_by: 'u1',
					completed_at: '2026-05-23T18:03:00.000Z',
					failure_reason: null,
				},
			}),
		).toEqual({
			objectId: 'OBJ-1',
			currentRevision: 6,
			latestSubmittedRevision: 6,
			latestAppliedRevision: 6,
			archiveOutOfSync: false,
			activeSubmission: null,
			latestSubmission: {
				id: 'sub-1',
				requestId: 'req-1',
				submittedRevision: 6,
				status: 'COMPLETED',
				submittedAt: '2026-05-23T18:02:00.000Z',
				submittedBy: 'u1',
				completedAt: '2026-05-23T18:03:00.000Z',
				failureReason: null,
			},
		});

		expect(mapReleaseLockResult({ object_id: 'OBJ-1', released: true })).toEqual({
			objectId: 'OBJ-1',
			released: true,
		});
	});
});
