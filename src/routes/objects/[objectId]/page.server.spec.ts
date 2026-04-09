import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const {
	getObjectDetailMock,
	listObjectArtifactsMock,
	listObjectAvailableFilesMock,
	listArchiveRequestsMock,
	createObjectDownloadRequestMock
} = vi.hoisted(() => ({
	getObjectDetailMock: vi.fn(),
	listObjectArtifactsMock: vi.fn(),
	listObjectAvailableFilesMock: vi.fn(),
	listArchiveRequestsMock: vi.fn(),
	createObjectDownloadRequestMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	objectsService: {
		getObjectDetail: getObjectDetailMock,
		listObjectArtifacts: listObjectArtifactsMock,
		listObjectAvailableFiles: listObjectAvailableFilesMock,
		createObjectDownloadRequest: createObjectDownloadRequestMock
	},
	archiveRequestsService: {
		listArchiveRequests: listArchiveRequestsMock
	}
}));

import { actions, load } from './+page.server';

describe('/objects/[objectId] +page.server', () => {
	beforeEach(() => {
		getObjectDetailMock.mockReset();
		listObjectArtifactsMock.mockReset();
		listObjectAvailableFilesMock.mockReset();
		listArchiveRequestsMock.mockReset();
		createObjectDownloadRequestMock.mockReset();
		listObjectArtifactsMock.mockResolvedValue([]);
		listObjectAvailableFilesMock.mockResolvedValue([]);
		listArchiveRequestsMock.mockResolvedValue({ requests: [], nextCursor: null, filteredCount: 0 });
	});

	it('redirects to login when auth is missing', async () => {
		await expect(
			load({
				params: { objectId: 'OBJ-1' },
				locals: { session: null },
				cookies: { get: () => undefined, delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('returns detail and artifacts for authenticated requests', async () => {
		const detail = {
			id: 'OBJ-1',
			objectId: 'OBJ-1',
			thumbnailArtifactId: 'thumb-1',
			title: 'Object title',
			type: 'DOCUMENT',
			processingState: 'index_done',
			curationState: 'reviewed',
			availabilityState: 'AVAILABLE',
			accessLevel: 'public',
			language: 'en',
			tags: ['source:family_archive'],
			tenantId: 'tenant-1',
			sourceIngestionId: 'ing-1',
			sourceBatchLabel: 'batch-1',
			metadata: {},
			embargoUntil: null,
			embargoKind: 'none',
			embargoCurationState: null,
			rightsNote: null,
			sensitivityNote: null,
			canDownload: true,
			accessReasonCode: 'OK',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
			indicators: { accessPdf: true, ocr: true, index: true },
			ingestManifest: null,
			isAuthorized: true,
			isDeliverable: true
		};

		getObjectDetailMock.mockResolvedValue({ detail, viewer: null });

		await expect(
			load({
				params: { objectId: 'OBJ-1' },
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).resolves.toEqual({
			detail,
			viewer: null,
			artifacts: [],
			artifactsError: null,
			availableFiles: [],
			availableFilesError: null,
			pendingRequests: [],
			pendingRequestsError: null
		});

		expect(listObjectArtifactsMock).toHaveBeenCalledWith(
			expect.objectContaining({ objectId: 'OBJ-1' })
		);
		expect(listArchiveRequestsMock).toHaveBeenCalledWith(
			expect.objectContaining({
				filters: { targetType: 'object', targetId: 'OBJ-1', activeOnly: true }
			})
		);
	});

	it('throws 404 when backend reports object not found', async () => {
		getObjectDetailMock.mockRejectedValue(
			new ApiClientError({
				status: 404,
				code: 'NOT_FOUND',
				message: 'Not found'
			})
		);

		await expect(
			load({
				params: { objectId: 'OBJ-1' },
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({ status: 404 });
	});

	it('returns detail with non-blocking artifacts error when artifacts fetch fails', async () => {
		const detail = {
			id: 'OBJ-1',
			objectId: 'OBJ-1',
			thumbnailArtifactId: null,
			title: 'Object title',
			type: 'DOCUMENT',
			processingState: 'index_done',
			curationState: 'reviewed',
			availabilityState: 'AVAILABLE',
			accessLevel: 'public',
			language: 'en',
			tags: [],
			tenantId: 'tenant-1',
			sourceIngestionId: 'ing-1',
			sourceBatchLabel: 'batch-1',
			metadata: {},
			embargoUntil: null,
			embargoKind: 'none',
			embargoCurationState: null,
			rightsNote: null,
			sensitivityNote: null,
			canDownload: true,
			accessReasonCode: 'OK',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
			indicators: { accessPdf: true, ocr: true, index: true },
			ingestManifest: null,
			isAuthorized: true,
			isDeliverable: true
		};

		getObjectDetailMock.mockResolvedValue({ detail, viewer: null });
		listObjectArtifactsMock.mockRejectedValue(
			new ApiClientError({
				status: 502,
				code: 'BAD_REQUEST',
				message: 'Artifacts unavailable',
				requestId: 'req-123'
			})
		);

		await expect(
			load({
				params: { objectId: 'OBJ-1' },
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).resolves.toEqual({
			detail,
			viewer: null,
			artifacts: [],
			artifactsError: 'Failed to load object artifacts (request: req-123).',
			availableFiles: [],
			availableFilesError: null,
			pendingRequests: [],
			pendingRequestsError: null
		});
	});

	it('submits download request action and returns queued message', async () => {
		const form = new FormData();
		form.set('availableFileId', '11111111-1111-4111-8111-111111111111');
		const request = new Request('https://example.test/objects/OBJ-1', {
			method: 'POST',
			body: form
		});

		createObjectDownloadRequestMock.mockResolvedValue({
			status: 'queued',
			objectId: 'OBJ-1',
			artifact: null,
			request: {
				id: 'req-1',
				availableFileId: '11111111-1111-4111-8111-111111111111',
				requestedBy: 'user-1',
				artifactKind: 'original',
				variant: null,
				status: 'PENDING',
				failureReason: null,
				createdAt: '2026-03-02T10:00:00.000Z',
				updatedAt: '2026-03-02T10:00:00.000Z',
				completedAt: null
			}
		});

		const result = await actions.requestDownload({
			request,
			params: { objectId: 'OBJ-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'viewer' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({ success: true });
		expect(createObjectDownloadRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				objectId: 'OBJ-1',
				availableFileId: '11111111-1111-4111-8111-111111111111'
			})
		);
	});
});
