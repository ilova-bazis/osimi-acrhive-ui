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
import { ObjectEditLockedError } from './objectEdit';
import { apiObjectEditService } from './apiObjectEditService';

const context = { fetchFn: vi.fn() as never, token: 'token-1' };

describe('apiObjectEditService', () => {
	beforeEach(() => {
		backendRequestMock.mockReset();
	});

	it('maps metadata save requests to backend transport shape', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1',
			curation_state: 'review_in_progress',
			updated_at: '2026-05-23T18:00:00.000Z',
		});

		await apiObjectEditService.saveObjectMetadata({
			context,
			objectId: 'OBJ-1',
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
			updated_count: 1,
			updated_at: '2026-05-23T18:00:00.000Z',
		});

		await apiObjectEditService.saveDocumentCuration({
			context,
			objectId: 'OBJ-1',
			pages: [{ pageNumber: 2, curatedText: 'Edited text' }],
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
				expect.objectContaining({
					path: '/api/objects/OBJ-1/curation/document',
					method: 'PUT',
					requestSchema: saveDocumentCurationRequestSchema,
					body: { pages: [{ page_number: 2, curated_text: 'Edited text' }] },
			}),
		);
	});

	it('maps submit requests to backend transport shape', async () => {
		backendRequestMock.mockResolvedValue({
			object_id: 'OBJ-1',
			curation_state: 'review_in_progress',
			request: { id: 'req-1', action_type: 'CURATION_REVIEW', status: 'PENDING' },
			submitted_at: '2026-05-23T18:00:00.000Z',
			submitted_by: 'u1',
		});

		await apiObjectEditService.submitObjectCuration({
			context,
			objectId: 'OBJ-1',
			reviewNote: 'Ready',
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
				expect.objectContaining({
					path: '/api/objects/OBJ-1/curation/submit',
					method: 'POST',
					requestSchema: submitCurationRequestSchema,
					body: { review_note: 'Ready' },
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
			apiObjectEditService.submitObjectCuration({ context, objectId: 'OBJ-1', reviewNote: null }),
		).rejects.toMatchObject({
			name: 'ObjectEditLockedError',
			lockedBy: 'u2',
			lockedUntil: '2026-05-23T19:00:00.000Z',
		});
		await expect(
			apiObjectEditService.submitObjectCuration({ context, objectId: 'OBJ-1', reviewNote: null }),
		).rejects.toBeInstanceOf(ObjectEditLockedError);
	});
});
