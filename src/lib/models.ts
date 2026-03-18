export type Language = 'Persian' | 'Tajik' | 'English' | 'Mixed / Unknown';

export type ContentCategory =
	| 'Newspaper'
	| 'Book / Manuscript'
	| 'Photo'
	| 'Interview / Audio'
	| 'Video'
	| 'Other';

export type PipelinePreset =
	| 'Auto'
	| 'Photos only (no OCR)'
	| 'Newspapers (layout OCR + review)'
	| 'Audio/Video (speech-to-text)';

export type Visibility = 'Private' | 'Team' | 'Public';

export type FileState =
	| 'queued'
	| 'processing'
	| 'extracted'
	| 'needs-review'
	| 'approved'
	| 'blocked'
	| 'skipped'
	| 'failed';

export type PipelineStage = 'queued' | 'running' | 'completed';

export type PipelineFlags = {
	ocr?: boolean;
	layoutOcr?: boolean;
	speechToText?: boolean;
	imageTagging?: boolean;
	[key: string]: boolean | undefined;
};

export type BatchDefaults = {
	language?: Language;
	contentCategory?: ContentCategory;
	pipelinePreset?: PipelinePreset;
	visibility?: Visibility;
};

export type ItemOverrides = {
	language?: Language;
	documentType?: string;
	pipelines?: PipelineFlags;
};

export type ObjectGroup = {
	id: string;
	label?: string;
	fileIds: number[]; // ordered local file IDs — index = source_order
	serverId?: string; // backend ingestion_item ID once created
};

export type ObjectItemMetadata = {
	title?: string;
	date?: {
		value: string | null; // YYYY | YYYY-MM | YYYY-MM-DD | null
		approximate: boolean;
	};
	tags?: string[];
	description?: string;
	people?: string[];
};

export type BatchItem = {
	fileId: string;
	originalFilename: string;
	mimeType: string;
	groupLabel?: string;
	overrides?: ItemOverrides;
	notes?: string;
	tags?: string[];
	status?: FileState;
};

export type Batch = {
	batchId: string;
	title: string;
	description?: string;
	defaults: BatchDefaults;
	items: BatchItem[];
};

export type ReviewSummary = {
	fileCount: number;
	languages: Language[];
	pipelineSummary: string[];
	warnings?: string[];
};

export type CatalogAccessLevel = 'private' | 'family' | 'public';

export type CatalogLanguageCode = 'tg' | 'fa' | 'ru' | 'en';

export type CatalogClassificationType =
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

export type CatalogDateConfidence = 'low' | 'medium' | 'high';

export type CatalogDateField = {
	value: string | null;
	approximate: boolean;
	confidence: CatalogDateConfidence;
	note: string | null;
};

export type CatalogAccess = {
	level: CatalogAccessLevel;
	embargo_until: string | null;
	rights_note: string | null;
	sensitivity_note: string | null;
};

export type CatalogTitle = {
	primary: string;
	original_script: string | null;
	translations: string[];
};

export type CatalogClassification = {
	type: CatalogClassificationType;
	language: CatalogLanguageCode;
	tags: string[];
	summary: string | null;
};

export type CatalogDates = {
	published: CatalogDateField;
	created: CatalogDateField;
};

export type CatalogProcessingBlock = {
	ocr_text?: { enabled: boolean; language?: CatalogLanguageCode };
	audio_transcript?: { enabled: boolean };
	[key: string]: { enabled: boolean; language?: CatalogLanguageCode } | undefined;
};

export type CatalogJson = {
	schema_version: '1.0';
	object_id: string;
	updated_at: string;
	updated_by: string | null;
	access: CatalogAccess;
	title: CatalogTitle;
	classification: CatalogClassification;
	dates: CatalogDates;
	item_kind?: string;
	processing?: CatalogProcessingBlock;
};
