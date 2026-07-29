import { beforeEach, describe, expect, it, vi } from 'vitest';

const { backendRequestMock } = vi.hoisted(() => ({
	backendRequestMock: vi.fn()
}));

vi.mock('$lib/server/apiClient', () => ({
	backendRequest: backendRequestMock
}));

vi.mock('$env/dynamic/private', () => ({
	env: {}
}));

import { apiIngestionSetupService } from './apiIngestionSetupService';
import { updateItemRequestSchema } from '$lib/api/schemas/ingestions';

describe('apiIngestionSetupService', () => {
	beforeEach(() => {
		backendRequestMock.mockReset();
	});

	it('includes people when updating item metadata', async () => {
		backendRequestMock.mockResolvedValue({ ok: true });

		await apiIngestionSetupService.updateItem({
			batchId: 'batch-1',
			itemId: 'item-1',
			metadata: {
				title: 'Object title',
				tags: ['archive'],
				people: ['Ada Lovelace']
			},
			context: {
				fetchFn: vi.fn() as never,
				token: 'token-1'
			}
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
				expect.objectContaining({
					requestSchema: updateItemRequestSchema,
					body: expect.objectContaining({
					title: 'Object title',
					tags: ['archive'],
					people: ['Ada Lovelace']
				})
			})
		);
	});

	it('sends only the changed metadata fields', async () => {
		backendRequestMock.mockResolvedValue({ ok: true });

		await apiIngestionSetupService.updateItem({
			batchId: 'batch-1',
			itemId: 'item-1',
			metadata: { tags: ['archive'] },
			context: {
				fetchFn: vi.fn() as never,
				token: 'token-1'
			}
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				body: { tags: ['archive'] }
			})
		);
	});
});
