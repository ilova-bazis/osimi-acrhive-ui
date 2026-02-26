import type { IngestionStatus } from './ingestionOverview';
import type { IngestionSummaryDto } from '$lib/api/schemas/ingestions';

export type IngestionDetailFile = {
	id: string;
	name: string;
	status: string;
	contentType: string | null;
	sizeBytes: number | null;
	createdAt: string | null;
};

export type IngestionDetail = {
	id: string;
	batchLabel: string;
	status: IngestionStatus;
	documentType: string;
	languageCode: string;
	pipelinePreset: string;
	accessLevel: 'private' | 'family' | 'public';
	embargoUntil: string | null;
	rightsNote: string | null;
	sensitivityNote: string | null;
	summary: IngestionSummaryDto;
	createdAt: string;
	updatedAt: string;
	processedObjects: number;
	totalObjects: number;
	files: IngestionDetailFile[];
};

export type IngestionDetailRequest = {
	fetchFn: typeof fetch;
	token: string;
	batchId: string;
};

export type RetryIngestionRequest = {
	fetchFn: typeof fetch;
	token: string;
	batchId: string;
};

export type CancelIngestionRequest = {
	fetchFn: typeof fetch;
	token: string;
	batchId: string;
};

export type RestoreIngestionRequest = {
	fetchFn: typeof fetch;
	token: string;
	batchId: string;
};

export type DeleteIngestionRequest = {
	fetchFn: typeof fetch;
	token: string;
	batchId: string;
};

export type UpdateIngestionRequest = {
	fetchFn: typeof fetch;
	token: string;
	batchId: string;
	payload: {
		batchLabel?: string;
		documentType?:
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
		languageCode?: string;
		pipelinePreset?:
			| 'auto'
			| 'none'
			| 'ocr_text'
			| 'audio_transcript'
			| 'video_transcript'
			| 'ocr_and_audio_transcript'
			| 'ocr_and_video_transcript';
		accessLevel?: 'private' | 'family' | 'public';
		embargoUntil?: string | null;
		rightsNote?: string | null;
		sensitivityNote?: string | null;
		summary?: IngestionSummaryDto;
	};
};

export type IngestionDetailService = {
	getDetail: (request: IngestionDetailRequest) => Promise<IngestionDetail>;
	retry: (request: RetryIngestionRequest) => Promise<void>;
	cancel: (request: CancelIngestionRequest) => Promise<void>;
	restore: (request: RestoreIngestionRequest) => Promise<void>;
	delete: (request: DeleteIngestionRequest) => Promise<void>;
	update: (request: UpdateIngestionRequest) => Promise<void>;
};
