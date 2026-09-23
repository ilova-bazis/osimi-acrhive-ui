import { beforeEach, describe, expect, it, vi } from 'vitest';

const { backendRequestMock, ApiClientErrorMock } = vi.hoisted(() => {
	class ApiClientErrorMock extends Error {
		status: number;
		code: string;
		requestId: string | null;
		details: unknown;

		constructor(options: {
			message: string;
			status: number;
			code: string;
			requestId?: string | null;
			details?: unknown;
		}) {
			super(options.message);
			this.name = 'ApiClientError';
			this.status = options.status;
			this.code = options.code;
			this.requestId = options.requestId ?? null;
			this.details = options.details;
		}
	}

	return { backendRequestMock: vi.fn(), ApiClientErrorMock };
});

vi.mock('$lib/server/apiClient', () => ({
	ApiClientError: ApiClientErrorMock,
	backendRequest: backendRequestMock,
}));

vi.mock('$env/dynamic/private', () => ({
	env: {},
}));

import { ApiClientError } from '$lib/server/apiClient';
import {
	objectArchiveSyncSchema,
	retryObjectChangeSubmissionRequestSchema,
	saveDocumentCurationRequestSchema,
	saveMetadataRequestSchema,
	submitObjectChangesRequestSchema,
} from '$lib/api/schemas/objectEdit';
import { ObjectEditLockedError, ObjectEditRevisionConflictError } from './objectEdit';
import { apiObjectEditService } from './apiObjectEditService';

const context = { fetchFn: vi.fn() as never, token: 'token-1' };

describe('apiObjectEditService', () => {
	beforeEach(() => {
		backendRequestMock.mockReset();
	});

	it('gets and maps the backend edit payload', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1', revision: 4, media_type: 'document',
			lock: { locked: true, locked_by: 'u2', locked_until: '2026-05-23T19:00:00.000Z' },
			curation_state: 'draft', draft: null,
			metadata: { title: 'Object title', publication_date: '2026', date_precision: 'year', date_approximate: false, language: 'en', tags: ['archive'], people: ['Ada'], description: null },
			rights: { access_level: 'family', rights_note: null, sensitivity_note: null },
			capabilities: { can_edit_metadata: true, can_curate_text: true, can_submit_review: false, can_submit_changes: true },
			curation_payload: { kind: 'document', machine_ocr_artifact_id: 'ocr-1', page_count: 1, pages: [{ page_number: 1, label: '1', machine_text: 'Raw', curated_text: null, status: 'machine' }] },
		});

		await expect(apiObjectEditService.getObjectEditPayload({ context, objectId: 'OBJ-1' })).resolves.toMatchObject({
			objectId: 'OBJ-1', revision: 4, lock: { lockedBy: 'u2' },
			metadata: { publicationDate: '2026' }, curation: { kind: 'document', pages: [{ pageNumber: 1, curatedText: '' }] },
		});
		expect(backendRequestMock).toHaveBeenCalledWith(expect.objectContaining({
			path: '/api/objects/OBJ-1/edit', method: 'GET', token: 'token-1',
		}));
	});

	it('maps metadata save requests to backend transport shape', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1',
			revision: 5,
			curation_state: 'review_in_progress',
			updated_at: '2026-05-23T18:00:00.000Z',
		});

		await apiObjectEditService.saveObjectMetadata({
			context,
			objectId: 'OBJ-1',
			revision: 4,
			metadata: {
				title: 'Object title',
				publicationDate: '2026-05-23',
				datePrecision: 'day',
				dateApproximate: false,
				language: 'en',
				tags: ['archive'],
				people: ['Ada'],
				description: 'Description',
			},
			rights: { rightsNote: 'Rights', sensitivityNote: null },
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: '/api/objects/OBJ-1/metadata',
				method: 'PATCH',
				requestSchema: saveMetadataRequestSchema,
				body: {
					revision: 4,
					metadata: {
						title: 'Object title',
						publication_date: '2026-05-23',
						date_precision: 'day',
						date_approximate: false,
						language: 'en',
						tags: ['archive'],
						people: ['Ada'],
						description: 'Description',
					},
					rights: {
						rights_note: 'Rights',
						sensitivity_note: null,
					},
				},
			}),
		);
	});

	it('maps document curation requests to backend transport shape', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1',
			revision: 5,
			updated_count: 1,
			updated_at: '2026-05-23T18:00:00.000Z',
		});

		await apiObjectEditService.saveDocumentCuration({
			context,
			objectId: 'OBJ-1',
			revision: 4,
			pages: [{ pageNumber: 2, curatedText: 'Edited text' }],
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
				expect.objectContaining({
					path: '/api/objects/OBJ-1/curation/document',
					method: 'PUT',
					requestSchema: saveDocumentCurationRequestSchema,
					body: { revision: 4, pages: [{ page_number: 2, curated_text: 'Edited text' }] },
			}),
		);
	});

	it('maps submit changes requests to backend transport shape', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1',
			current_revision: 5,
			submitted_revision: 5,
			submission: {
				id: 'sub-1',
				request_id: 'req-1',
				action_type: 'object_revision_apply',
				status: 'PENDING',
				submitted_at: '2026-05-23T18:00:00.000Z',
				submitted_by: 'u1',
			},
		});

		await apiObjectEditService.submitObjectChanges({
			context,
			objectId: 'OBJ-1',
			revision: 4,
			submissionNote: 'Ready for archive.',
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: '/api/objects/OBJ-1/changes/submit',
				method: 'POST',
				requestSchema: submitObjectChangesRequestSchema,
				body: { revision: 4, submission_note: 'Ready for archive.' },
			}),
		);
	});

	it('maps archive sync status requests to backend transport shape', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1',
			current_revision: 5,
			latest_submitted_revision: 5,
			latest_applied_revision: 5,
			archive_out_of_sync: false,
			active_submission: null,
			latest_submission: {
				id: 'sub-1',
				request_id: 'req-1',
				submitted_revision: 5,
				status: 'COMPLETED',
				submitted_at: '2026-05-23T18:00:00.000Z',
				submitted_by: 'u1',
				completed_at: '2026-05-23T18:01:00.000Z',
				failure_reason: null,
			},
		});

		await expect(
			apiObjectEditService.getObjectArchiveSync({ context, objectId: 'OBJ-1' }),
		).resolves.toMatchObject({
			objectId: 'OBJ-1',
			currentRevision: 5,
			latestAppliedRevision: 5,
			archiveOutOfSync: false,
			latestSubmission: { status: 'COMPLETED', submittedRevision: 5 },
		});
		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: '/api/objects/OBJ-1/changes/status',
				method: 'GET',
				responseSchema: objectArchiveSyncSchema,
			}),
		);
	});

	it('maps retry requests to backend transport shape', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1',
			current_revision: 5,
			submitted_revision: 4,
			submission: {
				id: 'sub-1',
				request_id: 'req-1',
				action_type: 'object_revision_apply',
				status: 'PENDING',
				submitted_at: '2026-05-23T18:00:00.000Z',
				submitted_by: 'u1',
			},
		});

		await apiObjectEditService.retryObjectChangeSubmission({
			context,
			objectId: 'OBJ-1',
			requestId: 'req-1',
			retryReason: 'Manual retry.',
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: '/api/objects/OBJ-1/change-submissions/req-1/retry',
				method: 'POST',
				requestSchema: retryObjectChangeSubmissionRequestSchema,
				body: { retry_reason: 'Manual retry.' },
			}),
		);
	});

	it('converts 423 backend errors into ObjectEditLockedError', async () => {
		backendRequestMock.mockRejectedValue(
			new ApiClientError({
				status: 423,
				code: 'LOCKED',
				message: 'Locked',
				details: { locked_by: 'u2', locked_until: '2026-05-23T19:00:00.000Z' },
			}),
		);

		await expect(
			apiObjectEditService.submitObjectChanges({ context, objectId: 'OBJ-1', revision: 4, submissionNote: null }),
		).rejects.toMatchObject({
			name: 'ObjectEditLockedError',
			lockedBy: 'u2',
			lockedUntil: '2026-05-23T19:00:00.000Z',
		});
		await expect(
			apiObjectEditService.retryObjectChangeSubmission({ context, objectId: 'OBJ-1', requestId: 'req-1', retryReason: null }),
		).rejects.toBeInstanceOf(ObjectEditLockedError);
	});

	it('converts revision conflicts into ObjectEditRevisionConflictError', async () => {
		backendRequestMock.mockRejectedValue(
			new ApiClientError({
				status: 409,
				code: 'REVISION_CONFLICT',
				message: 'Stale revision',
				details: { latest_revision: 5 },
			}),
		);

		await expect(
			apiObjectEditService.saveDocumentCuration({
				context,
				objectId: 'OBJ-1',
				revision: 4,
				pages: [{ pageNumber: 1, curatedText: 'Edited text' }],
			}),
		).rejects.toEqual(new ObjectEditRevisionConflictError(5));
	});

	it('releases an edit lock with the canonical DELETE request', async () => {
		backendRequestMock.mockResolvedValue({ object_id: 'OBJ-1', released: true });

		await expect(apiObjectEditService.releaseEditLock({ context, objectId: 'OBJ-1' })).resolves.toEqual({
			objectId: 'OBJ-1', released: true,
		});
		expect(backendRequestMock).toHaveBeenCalledWith(expect.objectContaining({
			path: '/api/objects/OBJ-1/edit-lock', method: 'DELETE', token: 'token-1',
		}));
	});
});
