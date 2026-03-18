import { z } from 'zod';

export const classificationTypeSchema = z.enum([
	'newspaper_article',
	'magazine_article',
	'book_chapter',
	'book',
	'letter',
	'speech',
	'interview',
	'report',
	'manuscript',
	'image',
	'document',
	'other'
]);

export const itemKindSchema = z.enum([
	'photo',
	'audio',
	'video',
	'scanned_document',
	'document',
	'other'
]);

const summaryDateValueSchema = z.union([
	z.null(),
	z.string().regex(/^(\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/)
]);

const summaryDateSchema = z
	.object({
		value: summaryDateValueSchema,
		approximate: z.boolean(),
		confidence: z.enum(['low', 'medium', 'high']),
		note: z.string().nullable()
	})
	.strict();

const summaryTranslationSchema = z
	.object({
		lang: z.string().min(1),
		text: z.string().min(1)
	})
	.strict();

const summaryProcessingItemSchema = z
	.object({
		enabled: z.boolean(),
		language: z.string().min(1).optional()
	})
	.strict();

export const ingestionSummarySchema = z
	.object({
		title: z
			.object({
				primary: z.string().min(1),
				original_script: z.string().nullable(),
				translations: z.array(summaryTranslationSchema)
			})
			.strict(),
		classification: z
			.object({
				tags: z.array(z.string().min(1)).refine((tags) => new Set(tags).size === tags.length),
				summary: z.string().nullable()
			})
			.strict(),
		dates: z
			.object({
				published: summaryDateSchema,
				created: summaryDateSchema
			})
			.strict(),
		item_kind: z.enum(['scanned_document', 'photo', 'audio', 'video', 'document', 'other']).optional(),
		processing: z
			.object({
				ocr_text: summaryProcessingItemSchema.optional(),
				audio_transcript: summaryProcessingItemSchema.optional(),
				video_transcript: summaryProcessingItemSchema.optional()
			})
			.strict()
			.optional(),
		publication: z
			.object({
				name: z.string().nullable().optional(),
				issue: z.string().nullable().optional(),
				volume: z.string().nullable().optional(),
				pages: z.string().nullable().optional(),
				place: z.string().nullable().optional()
			})
			.strict()
			.optional(),
		people: z
			.object({
				subjects: z.array(z.string()).optional(),
				authors: z.array(z.string()).optional(),
				contributors: z.array(z.string()).optional(),
				mentioned: z.array(z.string()).optional()
			})
			.strict()
			.optional(),
		links: z
			.object({
				related_object_ids: z.array(z.string()).optional(),
				external_urls: z.array(z.string().url()).optional()
			})
			.strict()
			.optional(),
		notes: z
			.object({
				internal: z.string().nullable().optional(),
				public: z.string().nullable().optional()
			})
			.strict()
			.optional()
	})
	.strict();

export const ingestionDtoSchema = z.object({
	id: z.string().min(1).optional(),
	ingestion_id: z.string().min(1).optional(),
	batch_id: z.string().min(1).optional(),
	batch_label: z.string().min(1).optional(),
	schema_version: z.string().min(1).optional(),
	classification_type: classificationTypeSchema.optional(),
	item_kind: itemKindSchema.optional(),
	document_type: z.string().min(1).optional(),
	language_code: z.string().min(1).optional(),
	pipeline_preset: z.string().min(1).optional(),
	access_level: z.string().min(1).optional(),
	embargo_until: z.string().nullable().optional(),
	rights_note: z.string().nullable().optional(),
	sensitivity_note: z.string().nullable().optional(),
	summary: ingestionSummarySchema.optional(),
	status: z.string().min(1).optional(),
	created_at: z.string().min(1).optional(),
	updated_at: z.string().min(1).optional(),
	processed_objects: z.number().int().nonnegative().optional(),
	objects_processed: z.number().int().nonnegative().optional(),
	completed_count: z.number().int().nonnegative().optional(),
	total_objects: z.number().int().nonnegative().optional(),
	object_count: z.number().int().nonnegative().optional(),
	total_count: z.number().int().nonnegative().optional()
});

export const ingestionsListResponseSchema = z.object({
	ingestions: z.array(ingestionDtoSchema),
	next_cursor: z.string().nullable().optional()
});

export const createIngestionRequestSchema = z
	.object({
		batch_label: z.string().min(1),
		schema_version: z.literal('1.0'),
		classification_type: classificationTypeSchema,
		item_kind: itemKindSchema,
		language_code: z.string().min(1),
		pipeline_preset: z.enum([
			'auto',
			'none',
			'ocr_text',
			'audio_transcript',
			'video_transcript',
			'ocr_and_audio_transcript',
			'ocr_and_video_transcript'
		]),
		access_level: z.enum(['private', 'family', 'public']),
		embargo_until: z.string().datetime().nullable().optional(),
		rights_note: z.string().nullable().optional(),
		sensitivity_note: z.string().nullable().optional(),
		summary: ingestionSummarySchema
	})
	.strict();

export const updateIngestionRequestSchema = z
	.object({
		batch_label: z.string().min(1).optional(),
		classification_type: classificationTypeSchema.optional(),
		item_kind: itemKindSchema.optional(),
		language_code: z.string().min(1).optional(),
		pipeline_preset: z
			.enum([
				'auto',
				'none',
				'ocr_text',
				'audio_transcript',
				'video_transcript',
				'ocr_and_audio_transcript',
				'ocr_and_video_transcript'
			])
			.optional(),
		access_level: z.enum(['private', 'family', 'public']).optional(),
		embargo_until: z.string().datetime().nullable().optional(),
		rights_note: z.string().nullable().optional(),
		sensitivity_note: z.string().nullable().optional(),
		summary: ingestionSummarySchema.optional()
	})
	.strict();

export const createIngestionResponseSchema = z.object({
	ingestion: ingestionDtoSchema
});

export const presignIngestionFileRequestSchema = z
	.object({
		filename: z.string().min(1),
		content_type: z.string().min(1),
		size_bytes: z.number().int().positive()
	})
	.strict();

export const presignIngestionFileResponseSchema = z.object({
	file_id: z.string().min(1).optional(),
	fileId: z.string().min(1).optional(),
	storage_key: z.string().min(1).optional(),
	storageKey: z.string().min(1).optional(),
	upload_url: z.string().min(1).optional(),
	uploadUrl: z.string().min(1).optional(),
	expires_at: z.string().min(1).optional(),
	expiresAt: z.string().min(1).optional(),
	headers: z.record(z.string(), z.union([z.string(), z.number()])).optional()
});

export const commitIngestionFileRequestSchema = z
	.object({
		file_id: z.string().min(1),
		checksum_sha256: z.string().min(1)
	})
	.strict();

export const commitIngestionFileResponseSchema = z.object({
	file: z.object({
		id: z.string().min(1).optional(),
		file_id: z.string().min(1).optional(),
		status: z.string().min(1).optional()
	})
});

export const objectItemMetadataSchema = z
	.object({
		title: z.string().min(1).optional(),
		date: z
			.object({
				value: z.union([z.null(), z.string().regex(/^(\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/)]),
				approximate: z.boolean()
			})
			.strict()
			.optional(),
		tags: z.array(z.string().min(1)).optional(),
		description: z.string().optional(),
		people: z.array(z.string().min(1)).optional()
	})
	.strict();

export const objectGroupSchema = z
	.object({
		label: z.string().min(1).optional(),
		file_ids: z.array(z.string().min(1)).min(1),
		metadata: objectItemMetadataSchema.optional()
	})
	.strict();

export const submitIngestionRequestSchema = z
	.object({
		object_groups: z.array(objectGroupSchema).optional()
	})
	.strict();

export const submitIngestionResponseSchema = z.object({
	ingestion: ingestionDtoSchema
});

export const deleteIngestionFileResponseSchema = z.object({}).passthrough();

export const ingestionFileDtoSchema = z.object({
	id: z.string().min(1).optional(),
	file_id: z.string().min(1).optional(),
	filename: z.string().min(1).optional(),
	file_name: z.string().min(1).optional(),
	status: z.string().min(1).optional(),
	content_type: z.string().min(1).nullable().optional(),
	size_bytes: z.number().int().nonnegative().nullable().optional(),
	created_at: z.string().min(1).nullable().optional()
});

export const ingestionDetailResponseSchema = z.object({
	ingestion: ingestionDtoSchema,
	files: z.array(ingestionFileDtoSchema).optional(),
	object_groups: z.array(objectGroupSchema).optional()
});

export const saveDraftObjectGroupsResponseSchema = z.object({ ok: z.boolean() });

export const ingestionItemSchema = z.object({
	id: z.string().min(1),
	ingestion_id: z.string().min(1),
	item_index: z.number().int().min(1),
	status: z.string().min(1),
	classification_type: z.string().nullable().optional(),
	item_kind: z.string().nullable().optional(),
	language_code: z.string().nullable().optional(),
	title: z.string().nullable().optional(),
	summary: z.record(z.string(), z.unknown()).optional(),
	object_id: z.string().nullable().optional(),
	created_at: z.string().min(1),
	updated_at: z.string().min(1)
});

export const ingestionItemFileSchema = z.object({
	id: z.string().min(1),
	ingestion_item_id: z.string().min(1),
	ingestion_file_id: z.string().min(1),
	ingestion_id: z.string().min(1),
	role: z.string().optional(),
	sort_order: z.number().int().min(1),
	page_number: z.number().nullable().optional(),
	is_primary: z.boolean().optional(),
	logical_label: z.string().nullable().optional(),
	created_at: z.string().min(1)
});

export const listItemsResponseSchema = z.object({ items: z.array(ingestionItemSchema) });
export const createItemResponseSchema = z.object({ item: ingestionItemSchema });
export const updateItemResponseSchema = z.object({ item: ingestionItemSchema });
export const reorderItemsResponseSchema = z.object({ items: z.array(ingestionItemSchema) });
export const listItemFilesResponseSchema = z.object({ files: z.array(ingestionItemFileSchema) });
export const attachItemFileResponseSchema = z.object({ file: ingestionItemFileSchema });
export const reorderItemFilesResponseSchema = z.object({ files: z.array(ingestionItemFileSchema) });

export const retryIngestionResponseSchema = z.object({
	ingestion: ingestionDtoSchema
});

export const cancelIngestionResponseSchema = z.object({
	ingestion: ingestionDtoSchema
});

export const restoreIngestionResponseSchema = z.object({
	ingestion: ingestionDtoSchema
});

export const deleteIngestionResponseSchema = z.object({
	status: z.string().min(1),
	ingestion_id: z.string().min(1)
});

export const ingestionCapabilitiesResponseSchema = z.object({
	media_kinds: z.array(z.string().min(1)),
	extensions_by_kind: z.record(z.string(), z.array(z.string().min(1))),
	mime_by_kind: z.record(z.string(), z.array(z.string().min(1))).optional(),
	mime_aliases: z.record(z.string(), z.string().min(1)).optional()
});

export type IngestionDto = z.infer<typeof ingestionDtoSchema>;
export type ObjectGroupDto = z.infer<typeof objectGroupSchema>;
export type IngestionSummaryDto = z.infer<typeof ingestionSummarySchema>;
export type IngestionFileDto = z.infer<typeof ingestionFileDtoSchema>;
export type IngestionsListResponseDto = z.infer<typeof ingestionsListResponseSchema>;
export type CreateIngestionResponseDto = z.infer<typeof createIngestionResponseSchema>;
export type PresignIngestionFileResponseDto = z.infer<typeof presignIngestionFileResponseSchema>;
export type IngestionCapabilitiesResponseDto = z.infer<typeof ingestionCapabilitiesResponseSchema>;
export type IngestionItemDto = z.infer<typeof ingestionItemSchema>;
export type IngestionItemFileDto = z.infer<typeof ingestionItemFileSchema>;
