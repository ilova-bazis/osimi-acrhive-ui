import { beforeEach, describe, expect, it, vi } from 'vitest';

const { backendRequestMock } = vi.hoisted(() => ({
	backendRequestMock: vi.fn()
}));

vi.mock('$lib/server/apiClient', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/apiClient')>()),
	backendRequest: backendRequestMock
}));

import { ApiClientError } from '$lib/server/apiClient';
import { createIngestionRequestSchema } from '$lib/api/schemas/ingestions';
import { apiIngestionNewService } from './apiIngestionNewService';
import type { CreateIngestionRequest } from './ingestionNew';

const context = { fetchFn: vi.fn() as never, token: 'token-1' };

const payload: CreateIngestionRequest = {
	name: 'Batch 1',
	classificationType: 'document',
	itemKind: 'document',
	languageCode: 'en',
	pipelinePreset: 'auto',
	accessLevel: 'private',
	embargoUntil: undefined,
	rightsNote: 'Rights',
	sensitivityNote: 'Sensitivity',
	summary: {
		title: { primary: 'Batch 1', original_script: null, translations: [] },
		classification: { tags: [], summary: null },
		dates: {
			published: { value: null, approximate: false, confidence: 'low', note: null },
			created: { value: null, approximate: false, confidence: 'low', note: null }
		}
	}
};

describe('apiIngestionNewService', () => {
	beforeEach(() => {
		backendRequestMock.mockReset();
	});

	it('maps create draft requests to backend shape', async () => {
		backendRequestMock.mockResolvedValue({ ingestion: { ingestion_id: 'batch-1' } });

		await expect(apiIngestionNewService.createDraft({ payload, context })).resolves.toEqual({
			batchId: 'batch-1'
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: '/api/ingestions',
				context: 'ingestions.create',
				method: 'POST',
				token: 'token-1',
				requestSchema: createIngestionRequestSchema,
				body: expect.objectContaining({
					batch_label: 'Batch 1',
					classification_type: 'document',
					item_kind: 'document',
					language_code: 'en',
					pipeline_preset: 'auto',
					access_level: 'private'
				})
			})
		);
	});

	it('throws invalid response when created ingestion lacks an identifier', async () => {
		backendRequestMock.mockResolvedValue({ ingestion: { status: 'draft' } });

		const promise = apiIngestionNewService.createDraft({ payload, context });

		await expect(promise).rejects.toBeInstanceOf(ApiClientError);
		await expect(promise).rejects.toMatchObject({
			status: 502,
			code: 'INVALID_RESPONSE'
		});
	});
});
