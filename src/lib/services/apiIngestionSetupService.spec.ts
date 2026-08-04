import { beforeEach, describe, expect, it, vi } from 'vitest';

const { backendRequestMock, privateEnv, publicEnv } = vi.hoisted(() => ({
	backendRequestMock: vi.fn(),
	privateEnv: {} as Record<string, string | undefined>,
	publicEnv: {} as Record<string, string | undefined>
}));

vi.mock('$lib/server/apiClient', () => ({
	backendRequest: backendRequestMock
}));

vi.mock('$env/dynamic/private', () => ({
	env: privateEnv
}));

vi.mock('$env/dynamic/public', () => ({
	env: publicEnv
}));

import { apiIngestionSetupService } from './apiIngestionSetupService';
import { updateItemRequestSchema } from '$lib/api/schemas/ingestions';

describe('apiIngestionSetupService', () => {
	beforeEach(() => {
		backendRequestMock.mockReset();
		for (const key of Object.keys(privateEnv)) delete privateEnv[key];
		for (const key of Object.keys(publicEnv)) delete publicEnv[key];
	});

	const presignFile = async (uploadUrl: string) => {
		backendRequestMock.mockResolvedValue({
			file_id: 'file-1',
			storage_key: 'tenants/tenant-1/uploads/file-1.pdf',
			upload_url: uploadUrl,
			expires_at: '2026-08-03T20:00:00.000Z',
			headers: { 'content-type': 'application/pdf', 'content-length': 12 }
		});

		return apiIngestionSetupService.presignFile({
			batchId: 'batch-1',
			filename: 'document.pdf',
			contentType: 'application/pdf',
			sizeBytes: 12,
			context: { fetchFn: vi.fn() as never, token: 'token-1' }
		});
	};

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

	it('uses the public API base for relative browser upload URLs', async () => {
		privateEnv.PRIVATE_API_BASE = 'http://backend.internal:3000';
		publicEnv.PUBLIC_API_BASE = 'https://api.archive.example';

		const presigned = await presignFile('/api/uploads/token-1');

		expect(presigned).toMatchObject({
			uploadUrl: 'https://api.archive.example/api/uploads/token-1',
			headers: { contentType: 'application/pdf', contentLength: '12' }
		});
	});

	it('falls back to the private API base only when no public base is configured', async () => {
		privateEnv.PRIVATE_API_BASE = 'http://backend.internal:3000';

		const presigned = await presignFile('/api/uploads/token-1');

		expect(presigned.uploadUrl).toBe('http://backend.internal:3000/api/uploads/token-1');
	});

	it('preserves the localhost fallback when no API base is configured', async () => {
		const presigned = await presignFile('/api/uploads/token-1');

		expect(presigned.uploadUrl).toBe('http://localhost:3000/api/uploads/token-1');
	});

	it('preserves absolute upload URLs', async () => {
		privateEnv.PRIVATE_API_BASE = 'http://backend.internal:3000';
		publicEnv.PUBLIC_API_BASE = 'https://api.archive.example';

		const presigned = await presignFile('https://uploads.archive.example/signed/token-1');

		expect(presigned.uploadUrl).toBe('https://uploads.archive.example/signed/token-1');
	});
});
