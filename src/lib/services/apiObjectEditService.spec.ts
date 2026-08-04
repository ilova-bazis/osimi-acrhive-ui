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
	saveDocumentCurationRequestSchema,
	saveMetadataRequestSchema,
	submitCurationRequestSchema,
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
			capabilities: { can_edit_metadata: true, can_curate_text: true, can_submit_review: false },
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

	it('maps submit requests to backend transport shape', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1',
			revision: 5,
			curation_state: 'review_in_progress',
			request: { id: 'req-1', action_type: 'CURATION_REVIEW', status: 'PENDING' },
			submitted_at: '2026-05-23T18:00:00.000Z',
			submitted_by: 'u1',
		});

		await apiObjectEditService.submitObjectCuration({
			context,
			objectId: 'OBJ-1',
			revision: 4,
			reviewNote: 'Ready',
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
				expect.objectContaining({
					path: '/api/objects/OBJ-1/curation/submit',
					method: 'POST',
					requestSchema: submitCurationRequestSchema,
					body: { revision: 4, review_note: 'Ready' },
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
			apiObjectEditService.submitObjectCuration({ context, objectId: 'OBJ-1', revision: 4, reviewNote: null }),
		).rejects.toMatchObject({
			name: 'ObjectEditLockedError',
			lockedBy: 'u2',
			lockedUntil: '2026-05-23T19:00:00.000Z',
		});
		await expect(
			apiObjectEditService.submitObjectCuration({ context, objectId: 'OBJ-1', revision: 4, reviewNote: null }),
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
