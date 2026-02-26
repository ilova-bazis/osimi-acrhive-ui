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

export type SubmitIngestionRequest = {
	batchId: string;
	context: IngestionSetupRequestContext;
};

export type DeleteIngestionFileRequest = {
	batchId: string;
	fileId: string;
	context: IngestionSetupRequestContext;
};

export type IngestionSetupService = {
	presignFile: (request: PresignIngestionFileRequest) => Promise<PresignedIngestionFile>;
	commitFile: (request: CommitIngestionFileRequest) => Promise<void>;
	submit: (request: SubmitIngestionRequest) => Promise<void>;
	deleteFile: (request: DeleteIngestionFileRequest) => Promise<void>;
};
