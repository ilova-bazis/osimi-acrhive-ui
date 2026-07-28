import { beforeEach, describe, expect, it, vi } from 'vitest';

const { backendRequestMock } = vi.hoisted(() => ({
	backendRequestMock: vi.fn()
}));

vi.mock('$lib/server/apiClient', () => ({
	backendRequest: backendRequestMock
}));

import { ingestionCapabilitiesResponseSchema } from '$lib/api/schemas/ingestions';
import { apiIngestionCapabilitiesService } from './apiIngestionCapabilitiesService';

const context = { fetchFn: vi.fn() as never, token: 'token-1' };

describe('apiIngestionCapabilitiesService', () => {
	beforeEach(() => {
		backendRequestMock.mockReset();
	});

	it('normalizes capabilities from backend response', async () => {
		backendRequestMock.mockResolvedValue({
			media_kinds: [' Image ', 'audio', 'unknown', 'image'],
			extensions_by_kind: {
				image: ['.JPG', 'jpg', ' PNG '],
				audio: ['.MP3'],
				video: [' mp4 '],
				document: ['.PDF']
			},
			mime_by_kind: {
				image: [' IMAGE/JPEG '],
				audio: ['audio/mpeg'],
				video: ['video/mp4'],
				document: ['application/pdf']
			},
			mime_aliases: { 'image/jpg': ' IMAGE/JPEG ' }
		});

		await expect(apiIngestionCapabilitiesService.getCapabilities(context)).resolves.toEqual({
			mediaKinds: ['image', 'audio'],
			extensionsByKind: {
				image: ['jpg', 'png'],
				audio: ['mp3'],
				video: ['mp4'],
				document: ['pdf']
			},
			mimeByKind: {
				image: ['image/jpeg'],
				audio: ['audio/mpeg'],
				video: ['video/mp4'],
				document: ['application/pdf']
			},
			mimeAliases: { 'image/jpg': 'image/jpeg' }
		});
		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: '/api/ingestions/capabilities',
				context: 'ingestions.capabilities',
				method: 'GET',
				responseSchema: ingestionCapabilitiesResponseSchema
			})
		);
	});

	it('falls back to default media kinds when backend kinds are invalid', async () => {
		backendRequestMock.mockResolvedValue({
			media_kinds: ['unknown'],
			extensions_by_kind: {}
		});

		const capabilities = await apiIngestionCapabilitiesService.getCapabilities(context);

		expect(capabilities.mediaKinds).toEqual(['image', 'audio', 'video', 'document']);
		expect(capabilities.extensionsByKind.image.length).toBeGreaterThan(0);
		expect(capabilities.mimeAliases).toEqual(expect.any(Object));
	});
});
