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

const context = {
	fetchFn: vi.fn() as never,
	token: 'token-1',
	idempotencyKey: '123e4567-e89b-12d3-a456-426614174000'
};

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
		backendRequestMock.mockResolvedValue({ ingestion: { id: 'batch-1' } });

		await expect(apiIngestionNewService.createDraft({ payload, context })).resolves.toEqual({
			batchId: 'batch-1'
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: '/api/ingestions',
				context: 'ingestions.create',
				method: 'POST',
				token: 'token-1',
				headers: expect.objectContaining({
					'x-idempotency-key': '123e4567-e89b-12d3-a456-426614174000'
				}),
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

	it('keeps the idempotency key out of the JSON body', async () => {
		backendRequestMock.mockResolvedValue({ ingestion: { id: 'batch-1' } });

		await apiIngestionNewService.createDraft({ payload, context });

		const body = backendRequestMock.mock.calls[0][0].body;
		expect(body).not.toHaveProperty('idempotencyKey');
		expect(body).not.toHaveProperty('idempotency_key');
		expect(JSON.stringify(body)).not.toContain('123e4567-e89b-12d3-a456-426614174000');
	});

	it('returns the canonical ingestion id', async () => {
		backendRequestMock.mockResolvedValue({
			ingestion: {
				id: 'canonical-1',
				ingestion_id: 'alias-1',
				batch_label: 'Batch 1'
			}
		});

		await expect(apiIngestionNewService.createDraft({ payload, context })).resolves.toEqual({
			batchId: 'canonical-1'
		});
	});

	it('throws invalid response when created ingestion lacks an identifier', async () => {
		const { backendRequest: realBackendRequest } = await vi.importActual<
			typeof import('$lib/server/apiClient')
		>('$lib/server/apiClient');
		backendRequestMock.mockImplementation(realBackendRequest);
		const fetchFn = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ingestion: { status: 'draft' } }), {
				status: 201,
				headers: { 'content-type': 'application/json' }
			})
		);

		const promise = apiIngestionNewService.createDraft({
			payload,
			context: { ...context, fetchFn: fetchFn as never }
		});

		await expect(promise).rejects.toBeInstanceOf(ApiClientError);
		await expect(promise).rejects.toMatchObject({
			status: 502,
			code: 'INVALID_RESPONSE'
		});
	});

	it('throws invalid response when created ingestion only carries alias identifiers', async () => {
		const { backendRequest: realBackendRequest } = await vi.importActual<
			typeof import('$lib/server/apiClient')
		>('$lib/server/apiClient');
		backendRequestMock.mockImplementation(realBackendRequest);
		const fetchFn = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({ ingestion: { ingestion_id: 'alias-1', batch_label: 'Batch 1' } }),
				{
					status: 201,
					headers: { 'content-type': 'application/json' }
				}
			)
		);

		const promise = apiIngestionNewService.createDraft({
			payload,
			context: { ...context, fetchFn: fetchFn as never }
		});

		await expect(promise).rejects.toBeInstanceOf(ApiClientError);
		await expect(promise).rejects.toMatchObject({
			status: 502,
			code: 'INVALID_RESPONSE'
		});
	});
});
