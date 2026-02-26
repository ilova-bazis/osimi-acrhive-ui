import type { IngestionSummaryDto } from '$lib/api/schemas/ingestions';

export type CreateIngestionRequest = {
	name: string;
	documentType:
		| 'newspaper_article'
		| 'magazine_article'
		| 'book_chapter'
		| 'book'
		| 'photo'
		| 'letter'
		| 'speech'
		| 'interview'
		| 'document'
		| 'other';
	languageCode: string;
	pipelinePreset:
		| 'auto'
		| 'none'
		| 'ocr_text'
		| 'audio_transcript'
		| 'video_transcript'
		| 'ocr_and_audio_transcript'
		| 'ocr_and_video_transcript';
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
