export type CreateIngestionRequest = {
	name: string;
	description?: string;
};

export type CreateIngestionResponse = {
	batchId: string;
};

export type IngestionNewService = {
	createDraft: (payload: CreateIngestionRequest) => Promise<CreateIngestionResponse>;
};
