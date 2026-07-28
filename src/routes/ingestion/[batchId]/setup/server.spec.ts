import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const {
	presignFileMock,
	commitFileMock,
	submitMock,
	createItemMock,
	updateItemMock,
	reorderItemsMock,
	attachFileToItemMock,
	reorderItemFilesMock,
	deleteMock
} = vi.hoisted(() => ({
	presignFileMock: vi.fn(),
	commitFileMock: vi.fn(),
	submitMock: vi.fn(),
	createItemMock: vi.fn(),
	updateItemMock: vi.fn(),
	reorderItemsMock: vi.fn(),
	attachFileToItemMock: vi.fn(),
	reorderItemFilesMock: vi.fn(),
	deleteMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionSetupService: {
		presignFile: presignFileMock,
		commitFile: commitFileMock,
		submit: submitMock,
		createItem: createItemMock,
		updateItem: updateItemMock,
		reorderItems: reorderItemsMock,
		attachFileToItem: attachFileToItemMock,
		reorderItemFiles: reorderItemFilesMock
	},
	ingestionDetailService: {
		delete: deleteMock
	}
}));

import { POST } from './+server';

describe('/ingestion/[batchId]/setup +server', () => {
	beforeEach(() => {
		presignFileMock.mockReset();
		commitFileMock.mockReset();
		submitMock.mockReset();
		createItemMock.mockReset();
		updateItemMock.mockReset();
		reorderItemsMock.mockReset();
		attachFileToItemMock.mockReset();
		reorderItemFilesMock.mockReset();
		deleteMock.mockReset();
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

	it('rejects untrusted origins before processing setup actions', async () => {
		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				headers: { origin: 'https://evil.test' },
				body: JSON.stringify({ action: 'submit' })
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(403);
		expect(submitMock).not.toHaveBeenCalled();
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

	it('creates items through ingestion setup service', async () => {
		createItemMock.mockResolvedValue({ id: 'item-1', itemIndex: 2 });

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({ action: 'create_item', itemIndex: 2, label: 'Folder A' })
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ id: 'item-1', itemIndex: 2 });
		expect(createItemMock).toHaveBeenCalledWith(
			expect.objectContaining({ batchId: 'batch-1', itemIndex: 2, label: 'Folder A' })
		);
	});

	it('updates item metadata through ingestion setup service', async () => {
		updateItemMock.mockResolvedValue(undefined);

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({
					action: 'update_item',
					itemId: 'item-1',
					metadata: {
						title: 'Object title',
						date: { value: '2026-05-22', approximate: false },
						tags: ['archive'],
						description: 'Description',
						people: ['Ada']
					}
				})
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(updateItemMock).toHaveBeenCalledWith(
			expect.objectContaining({
				batchId: 'batch-1',
				itemId: 'item-1',
				metadata: expect.objectContaining({ people: ['Ada'] })
			})
		);
	});

	it('reorders items through ingestion setup service', async () => {
		reorderItemsMock.mockResolvedValue(undefined);

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({
					action: 'reorder_items',
					items: [{ itemId: 'item-1', itemIndex: 1 }]
				})
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(reorderItemsMock).toHaveBeenCalledWith(
			expect.objectContaining({ batchId: 'batch-1', items: [{ itemId: 'item-1', itemIndex: 1 }] })
		);
	});

	it('attaches files to items through ingestion setup service', async () => {
		attachFileToItemMock.mockResolvedValue(undefined);

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({ action: 'attach_file', itemId: 'item-1', fileId: 'file-1', sortOrder: 3 })
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(attachFileToItemMock).toHaveBeenCalledWith(
			expect.objectContaining({ batchId: 'batch-1', itemId: 'item-1', fileId: 'file-1', sortOrder: 3 })
		);
	});

	it('reorders item files through ingestion setup service', async () => {
		reorderItemFilesMock.mockResolvedValue(undefined);

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({
					action: 'reorder_item_files',
					itemId: 'item-1',
					files: [{ fileId: 'file-1', sortOrder: 1 }]
				})
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(reorderItemFilesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				batchId: 'batch-1',
				itemId: 'item-1',
				files: [{ fileId: 'file-1', sortOrder: 1 }]
			})
		);
	});

	it('deletes draft batches through ingestion detail service', async () => {
		deleteMock.mockResolvedValue(undefined);

		const response = await POST({
			request: new Request('https://example.test/ingestion/batch-1/setup', {
				method: 'POST',
				body: JSON.stringify({ action: 'delete_batch' })
			}),
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(deleteMock).toHaveBeenCalledWith(
			expect.objectContaining({ batchId: 'batch-1', token: 'token-1' })
		);
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
