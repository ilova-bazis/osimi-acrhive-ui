import type { Batch, CatalogJson } from '$lib/models';

export const sampleBatch: Batch = {
	batchId: 'BATCH-20260127-0001',
	title: 'NoorMags Issue 76-79',
	description: 'Scanned newspaper issues from 1971.',
	defaults: {
		language: 'Persian',
		contentCategory: 'Newspaper',
		pipelinePreset: 'Newspapers (layout OCR + review)',
		visibility: 'Team'
	},
	items: [
		{
			fileId: 'FILE-0001',
			originalFilename: 'noormags_076_page1.tiff',
			mimeType: 'image/tiff',
			groupLabel: 'Issue 76',
			overrides: {
				language: 'Persian',
				documentType: 'Newspaper scan',
				pipelines: {
					ocr: true,
					layoutOcr: true,
					imageTagging: false
				}
			},
			notes: 'Page 1 has hand annotations. Preserve margins during OCR.',
			tags: ['Tehran', '1970s'],
			status: 'needs-review'
		},
		{
			fileId: 'FILE-0002',
			originalFilename: 'noormags_076_page2.tiff',
			mimeType: 'image/tiff',
			groupLabel: 'Issue 76',
			status: 'queued'
		},
		{
			fileId: 'FILE-0003',
			originalFilename: 'noormags_076_page3.tiff',
			mimeType: 'image/tiff',
			groupLabel: 'Issue 76',
			status: 'processing'
		},
		{
			fileId: 'FILE-0004',
			originalFilename: 'photo_event_2012.jpg',
			mimeType: 'image/jpeg',
			overrides: {
				language: 'Mixed / Unknown',
				documentType: 'Photo',
				pipelines: {
					ocr: false,
					imageTagging: true
				}
			},
			tags: ['event'],
			status: 'skipped'
		},
		{
			fileId: 'FILE-0005',
			originalFilename: 'bad_pdf_scan.pdf',
			mimeType: 'application/pdf',
			overrides: {
				language: 'Persian',
				documentType: 'Document',
				pipelines: {
					ocr: true
				}
			},
			status: 'failed'
		}
	]
};

export const sampleCatalog: CatalogJson = {
	schema_version: '1.0',
	object_id: 'OBJ-20260127-0001',
	updated_at: '2026-01-27T12:00:00Z',
	updated_by: 'Farzon',
	access: {
		level: 'private',
		embargo_until: null,
		rights_note: null,
		sensitivity_note: null
	},
	title: {
		primary: 'Unknown newspaper article',
		original_script: null,
		translations: []
	},
	classification: {
		type: 'newspaper_article',
		language: 'fa',
		tags: ['source:family_archive'],
		summary: null
	},
	dates: {
		published: { value: null, approximate: true, confidence: 'low', note: 'Not yet identified' },
		created: { value: null, approximate: true, confidence: 'low', note: 'Unknown' }
	},
	item_kind: 'scanned_document',
	processing: {
		ocr_text: { enabled: true, language: 'fa' },
		audio_transcript: { enabled: false }
	}
};
