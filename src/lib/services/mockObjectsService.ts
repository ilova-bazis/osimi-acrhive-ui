import type { ObjectsListResponse, ObjectsService, ObjectRow } from './objects';

const rows: ObjectRow[] = [
	{
		id: 'OBJ-20260202-000312',
		title: 'NoorMags Issue 80-82',
		type: 'newspaper_article',
		status: 'READY',
		language: 'fa',
		updatedAt: '2026-02-02T10:40:00Z',
		batchId: 'BATCH-20260202-0031',
		thumbnailUrl: '/assets/objects/placeholder-1.jpg',
		indicators: { ocr: true, transcript: false, embeddings: true }
	},
	{
		id: 'OBJ-20260201-000287',
		title: null,
		type: 'photo',
		status: 'NEEDS_REVIEW',
		language: 'fa',
		updatedAt: '2026-02-01T14:18:00Z',
		batchId: 'BATCH-20260201-0029',
		thumbnailUrl: null,
		indicators: { ocr: false, transcript: false, embeddings: true }
	},
	{
		id: 'OBJ-20260131-000255',
		title: 'Tajik Radio Interview – Episode 4',
		type: 'interview',
		status: 'INGESTING',
		language: 'tg',
		updatedAt: '2026-01-31T12:02:00Z',
		batchId: 'BATCH-20260131-0024',
		thumbnailUrl: '/assets/objects/placeholder-2.jpg',
		indicators: { ocr: false, transcript: true, embeddings: false }
	},
	{
		id: 'OBJ-20260130-000231',
		title: 'Letter from Dushanbe',
		type: 'letter',
		status: 'FAILED',
		language: 'tg',
		updatedAt: '2026-01-30T08:40:00Z',
		batchId: 'BATCH-20260130-0020',
		thumbnailUrl: null,
		indicators: { ocr: true, transcript: false, embeddings: false }
	}
];

export const mockObjectsService: ObjectsService = {
	listObjects: async (_filters) => ({
		rows,
		page: 1,
		pageSize: 25,
		total: 128
	}),
	listRecent: async () => rows.slice(0, 6)
};
