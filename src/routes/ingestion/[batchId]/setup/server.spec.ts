import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { presignFileMock, commitFileMock, submitMock } = vi.hoisted(() => ({
	presignFileMock: vi.fn(),
	commitFileMock: vi.fn(),
	submitMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionSetupService: {
		presignFile: presignFileMock,
		commitFile: commitFileMock,
		submit: submitMock
	}
}));

import { POST } from './+server';

describe('/ingestion/[batchId]/setup +server', () => {
	beforeEach(() => {
		presignFileMock.mockReset();
		commitFileMock.mockReset();
		submitMock.mockReset();
	});

	it('returns 401 when auth is missing', async () => {
		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({ action: 'submit' })
			}),
			params: { batchId: 'batch-1' },
			locals: { session: null },
			cookies: { get: () => undefined, delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(401);
	});

	it('presigns files through ingestion setup service', async () => {
		presignFileMock.mockResolvedValue({
			fileId: 'f1',
			storageKey: 'ing/batch-1/f1',
			uploadUrl: 'https://example-upload.test/token',
			expiresAt: '2026-02-19T12:00:00.000Z',
			headers: {
				contentType: 'application/pdf',
				contentLength: '123'
			}
		});

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({
					action: 'presign',
					filename: 'doc.pdf',
					contentType: 'application/pdf',
					sizeBytes: 123
				})
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(presignFileMock).toHaveBeenCalledWith(
			expect.objectContaining({
				batchId: 'batch-1',
				filename: 'doc.pdf',
				contentType: 'application/pdf',
				sizeBytes: 123
			})
		);
	});

	it('commits uploaded files through ingestion setup service', async () => {
		commitFileMock.mockResolvedValue(undefined);

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({
					action: 'commit',
					fileId: 'f1',
					checksumSha256: 'abcd'
				})
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(commitFileMock).toHaveBeenCalledWith(
			expect.objectContaining({ batchId: 'batch-1', fileId: 'f1', checksumSha256: 'abcd' })
		);
	});

	it('submits ingestion through ingestion setup service', async () => {
		submitMock.mockResolvedValue(undefined);

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({ action: 'submit' })
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(submitMock).toHaveBeenCalledWith(expect.objectContaining({ batchId: 'batch-1' }));
	});

	it('maps backend api errors to JSON response status', async () => {
		submitMock.mockRejectedValue(
			new ApiClientError({
				status: 423,
				code: 'LOCKED',
				message: 'Ingestion is locked'
			})
		);

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({ action: 'submit' })
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(423);
	});
});
