export type IngestionSetupRequestContext = {
	fetchFn: typeof fetch;
	token: string;
};

export type PresignIngestionFileRequest = {
	batchId: string;
	filename: string;
	contentType: string;
	sizeBytes: number;
	context: IngestionSetupRequestContext;
};

export type PresignedIngestionFile = {
	fileId: string;
	storageKey: string;
	uploadUrl: string;
	expiresAt: string;
	headers: {
		contentType?: string;
		contentLength?: string;
	};
};

export type CommitIngestionFileRequest = {
	batchId: string;
	fileId: string;
	checksumSha256: string;
	context: IngestionSetupRequestContext;
};

import type { ObjectItemMetadata } from '$lib/models';

export type SubmitIngestionRequest = {
	batchId: string;
	context: IngestionSetupRequestContext;
};

export type DeleteIngestionFileRequest = {
	batchId: string;
	fileId: string;
	context: IngestionSetupRequestContext;
};

export type CreateItemRequest = {
	batchId: string;
	itemIndex: number;
	label?: string;
	context: IngestionSetupRequestContext;
};

export type UpdateItemRequest = {
	batchId: string;
	itemId: string;
	label?: string;
	metadata?: ObjectItemMetadata;
	context: IngestionSetupRequestContext;
};

export type ReorderItemsRequest = {
	batchId: string;
	items: { itemId: string; itemIndex: number }[];
	context: IngestionSetupRequestContext;
};

export type AttachFileToItemRequest = {
	batchId: string;
	itemId: string;
	fileId: string;
	sortOrder: number;
	role?: string;
	context: IngestionSetupRequestContext;
};

export type ReorderItemFilesRequest = {
	batchId: string;
	itemId: string;
	files: { fileId: string; sortOrder: number }[];
	context: IngestionSetupRequestContext;
};

export type IngestionSetupService = {
	presignFile: (request: PresignIngestionFileRequest) => Promise<PresignedIngestionFile>;
	commitFile: (request: CommitIngestionFileRequest) => Promise<void>;
	submit: (request: SubmitIngestionRequest) => Promise<void>;
	deleteFile: (request: DeleteIngestionFileRequest) => Promise<void>;
	createItem: (request: CreateItemRequest) => Promise<{ id: string; itemIndex: number }>;
	updateItem: (request: UpdateItemRequest) => Promise<void>;
	reorderItems: (request: ReorderItemsRequest) => Promise<void>;
	attachFileToItem: (request: AttachFileToItemRequest) => Promise<void>;
	reorderItemFiles: (request: ReorderItemFilesRequest) => Promise<void>;
};
