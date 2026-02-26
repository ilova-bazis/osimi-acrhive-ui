import {
	commitIngestionFileRequestSchema,
	commitIngestionFileResponseSchema,
	deleteIngestionFileResponseSchema,
	presignIngestionFileRequestSchema,
	presignIngestionFileResponseSchema,
	submitIngestionResponseSchema
} from '$lib/api/schemas/ingestions';
import { env } from '$env/dynamic/private';
import { ApiClientError, backendRequest } from '$lib/server/apiClient';
import type {
	CommitIngestionFileRequest,
	DeleteIngestionFileRequest,
	IngestionSetupService,
	PresignIngestionFileRequest,
	SubmitIngestionRequest
} from './ingestionSetup';

const toPresignPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/files/presign`;
const toCommitPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/files/commit`;
const toDeletePath = (batchId: string, fileId: string): string =>
	`/api/ingestions/${encodeURIComponent(batchId)}/files/${encodeURIComponent(fileId)}`;
const toSubmitPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/submit`;

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

export const apiIngestionSetupService: IngestionSetupService = {
	presignFile,
	commitFile,
	submit,
	deleteFile
};
