import type {
	IngestionSummaryDto,
	classificationTypeSchema,
	itemKindSchema
} from '$lib/api/schemas/ingestions';
import type { PipelinePreset } from '$lib/ingestion/pipelineCapabilities';
import type { z } from 'zod';

type ClassificationType = z.infer<typeof classificationTypeSchema>;
type ItemKind = z.infer<typeof itemKindSchema>;

export type CreateIngestionRequest = {
	name: string;
	classificationType: ClassificationType;
	itemKind: ItemKind;
	languageCode: string;
	pipelinePreset: PipelinePreset;
	accessLevel: 'private' | 'family' | 'public';
	embargoUntil?: string;
	rightsNote?: string;
	sensitivityNote?: string;
	summary: IngestionSummaryDto;
};

export type CreateIngestionResponse = {
	batchId: string;
};

export type IngestionNewRequestContext = {
	fetchFn: typeof fetch;
	token: string;
};

export type CreateIngestionDraftRequest = {
	payload: CreateIngestionRequest;
	context: IngestionNewRequestContext;
};

export type IngestionNewService = {
	createDraft: (request: CreateIngestionDraftRequest) => Promise<CreateIngestionResponse>;
};
