import {
	attachItemFileResponseSchema,
	commitIngestionFileRequestSchema,
	commitIngestionFileResponseSchema,
	createItemResponseSchema,
	deleteIngestionFileResponseSchema,
	presignIngestionFileRequestSchema,
	presignIngestionFileResponseSchema,
	reorderItemFilesResponseSchema,
	reorderItemsResponseSchema,
	submitIngestionResponseSchema,
	updateItemResponseSchema
} from '$lib/api/schemas/ingestions';
import { env } from '$env/dynamic/private';
import { ApiClientError, backendRequest } from '$lib/server/apiClient';
import type {
	AttachFileToItemRequest,
	CommitIngestionFileRequest,
	CreateItemRequest,
	DeleteIngestionFileRequest,
	IngestionSetupService,
	PresignIngestionFileRequest,
	ReorderItemFilesRequest,
	ReorderItemsRequest,
	SubmitIngestionRequest,
	UpdateItemRequest
} from './ingestionSetup';

const toPresignPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/files/presign`;
const toCommitPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/files/commit`;
const toDeletePath = (batchId: string, fileId: string): string =>
	`/api/ingestions/${encodeURIComponent(batchId)}/files/${encodeURIComponent(fileId)}`;
const toSubmitPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/submit`;
const toItemsPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/items`;
const toItemPath = (batchId: string, itemId: string): string =>
	`/api/ingestions/${encodeURIComponent(batchId)}/items/${encodeURIComponent(itemId)}`;
const toItemsOrderPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/items/order`;
const toItemFilesPath = (batchId: string, itemId: string): string =>
	`/api/ingestions/${encodeURIComponent(batchId)}/items/${encodeURIComponent(itemId)}/files`;
const toItemFilesOrderPath = (batchId: string, itemId: string): string =>
	`/api/ingestions/${encodeURIComponent(batchId)}/items/${encodeURIComponent(itemId)}/files/order`;

const getApiBase = (): string => env.PRIVATE_API_BASE || env.PUBLIC_API_BASE || 'http://localhost:3000';

const toAbsoluteUploadUrl = (value: string): string => new URL(value, getApiBase()).toString();

const getHeaderValue = (
	headers: Record<string, string | number> | undefined,
	keys: string[]
): string | undefined => {
	if (!headers) return undefined;

	const match = Object.entries(headers).find(([headerName]) =>
		keys.some((key) => key.toLowerCase() === headerName.toLowerCase())
	);

	if (!match) return undefined;
	return String(match[1]);
};

const presignFile = async (request: PresignIngestionFileRequest) => {
	const response = await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toPresignPath(request.batchId),
		context: 'ingestions.files.presign',
		method: 'POST',
		token: request.context.token,
		body: {
			filename: request.filename,
			content_type: request.contentType,
			size_bytes: request.sizeBytes
		},
		requestSchema: presignIngestionFileRequestSchema,
		responseSchema: presignIngestionFileResponseSchema
	});

	const fileId = response.file_id ?? response.fileId;
	const storageKey = response.storage_key ?? response.storageKey;
	const uploadUrl = response.upload_url ?? response.uploadUrl;
	const expiresAt = response.expires_at ?? response.expiresAt;

	if (!fileId || !storageKey || !uploadUrl || !expiresAt) {
		throw new ApiClientError({
			status: 502,
			code: 'INVALID_RESPONSE',
			message: 'Invalid backend response for ingestions.files.presign'
		});
	}

	return {
		fileId,
		storageKey,
		uploadUrl: toAbsoluteUploadUrl(uploadUrl),
		expiresAt,
		headers: {
			contentType: getHeaderValue(response.headers, ['content-type', 'content_type']),
			contentLength: getHeaderValue(response.headers, ['content-length', 'content_length'])
		}
	};
};

const commitFile = async (request: CommitIngestionFileRequest): Promise<void> => {
	await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toCommitPath(request.batchId),
		context: 'ingestions.files.commit',
		method: 'POST',
		token: request.context.token,
		body: {
			file_id: request.fileId,
			checksum_sha256: request.checksumSha256
		},
		requestSchema: commitIngestionFileRequestSchema,
		responseSchema: commitIngestionFileResponseSchema
	});
};

const submit = async (request: SubmitIngestionRequest): Promise<void> => {
	await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toSubmitPath(request.batchId),
		context: 'ingestions.submit',
		method: 'POST',
		token: request.context.token,
		responseSchema: submitIngestionResponseSchema
	});
};

const deleteFile = async (request: DeleteIngestionFileRequest): Promise<void> => {
	await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toDeletePath(request.batchId, request.fileId),
		context: 'ingestions.files.delete',
		method: 'DELETE',
		token: request.context.token,
		responseSchema: deleteIngestionFileResponseSchema
	});
};

const createItem = async (request: CreateItemRequest): Promise<{ id: string; itemIndex: number }> => {
	const response = await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toItemsPath(request.batchId),
		context: 'ingestions.items.create',
		method: 'POST',
		token: request.context.token,
		body: {
			item_index: request.itemIndex,
			...(request.label ? { title: request.label } : {})
		},
		responseSchema: createItemResponseSchema
	});

	return { id: response.item.id, itemIndex: response.item.item_index };
};

const updateItem = async (request: UpdateItemRequest): Promise<void> => {
	const { metadata } = request;
	const body: Record<string, unknown> = {};

	if (request.label !== undefined) {
		body.title = request.label || null;
	}

	if (metadata) {
		if (metadata.title !== undefined) body.title = metadata.title || null;
		if (metadata.description !== undefined) body.description = metadata.description || null;
		if (metadata.tags !== undefined) body.tags = metadata.tags;
		if (metadata.date !== undefined) {
			body.dates = {
				published: {
					value: metadata.date.value,
					approximate: metadata.date.approximate,
					confidence: 'medium',
					note: null
				}
			};
		}
	}

	await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toItemPath(request.batchId, request.itemId),
		context: 'ingestions.items.update',
		method: 'PATCH',
		token: request.context.token,
		body,
		responseSchema: updateItemResponseSchema
	});
};

const reorderItems = async (request: ReorderItemsRequest): Promise<void> => {
	await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toItemsOrderPath(request.batchId),
		context: 'ingestions.items.reorder',
		method: 'PATCH',
		token: request.context.token,
		body: {
			items: request.items.map((item) => ({
				ingestion_item_id: item.itemId,
				item_index: item.itemIndex
			}))
		},
		responseSchema: reorderItemsResponseSchema
	});
};

const attachFileToItem = async (request: AttachFileToItemRequest): Promise<void> => {
	await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toItemFilesPath(request.batchId, request.itemId),
		context: 'ingestions.items.files.attach',
		method: 'POST',
		token: request.context.token,
		body: {
			ingestion_file_id: request.fileId,
			sort_order: request.sortOrder,
			...(request.role ? { role: request.role } : {})
		},
		responseSchema: attachItemFileResponseSchema
	});
};

const reorderItemFiles = async (request: ReorderItemFilesRequest): Promise<void> => {
	await backendRequest({
		fetchFn: request.context.fetchFn,
		path: toItemFilesOrderPath(request.batchId, request.itemId),
		context: 'ingestions.items.files.reorder',
		method: 'PATCH',
		token: request.context.token,
		body: {
			files: request.files.map((f) => ({
				ingestion_file_id: f.fileId,
				sort_order: f.sortOrder
			}))
		},
		responseSchema: reorderItemFilesResponseSchema
	});
};

export const apiIngestionSetupService: IngestionSetupService = {
	presignFile,
	commitFile,
	submit,
	deleteFile,
	createItem,
	updateItem,
	reorderItems,
	attachFileToItem,
	reorderItemFiles
};
