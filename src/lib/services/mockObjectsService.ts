import type {
	ObjectsListRequest,
	ObjectsRecentRequest,
	ObjectsService,
	ObjectRow
} from './objects';

const rows: ObjectRow[] = [
	{
		id: 'OBJ-20260202-000312',
		objectId: 'OBJ-20260202-000312',
		thumbnailArtifactId: 'artifact-thumb-1',
		title: 'NoorMags Issue 80-82',
		type: 'DOCUMENT',
		processingState: 'index_done',
		curationState: 'reviewed',
		availabilityState: 'AVAILABLE',
		accessLevel: 'family',
		language: 'fa',
		tags: ['source:family_archive', 'collection:noormags'],
		tenantId: 'tenant-1',
		sourceIngestionId: 'ingestion-1',
		sourceBatchLabel: 'BATCH-20260202-0031',
		metadata: {},
		embargoUntil: null,
		embargoKind: 'none',
		embargoCurationState: null,
		rightsNote: null,
		sensitivityNote: null,
		canDownload: true,
		accessReasonCode: 'OK',
		createdAt: '2026-02-01T10:40:00Z',
		updatedAt: '2026-02-02T10:40:00Z',
		indicators: { accessPdf: true, ocr: true, index: true }
	},
	{
		id: 'OBJ-20260201-000287',
		objectId: 'OBJ-20260201-000287',
		thumbnailArtifactId: null,
		title: null,
		type: 'IMAGE',
		processingState: 'derivatives_done',
		curationState: 'needs_review',
		availabilityState: 'RESTORE_PENDING',
		accessLevel: 'private',
		language: 'fa',
		tags: ['media:image_scan'],
		tenantId: 'tenant-1',
		sourceIngestionId: 'ingestion-2',
		sourceBatchLabel: 'BATCH-20260201-0029',
		metadata: {},
		embargoUntil: null,
		embargoKind: 'none',
		embargoCurationState: null,
		rightsNote: null,
		sensitivityNote: null,
		canDownload: false,
		accessReasonCode: 'RESTORE_IN_PROGRESS',
		createdAt: '2026-02-01T14:00:00Z',
		updatedAt: '2026-02-01T14:18:00Z',
		indicators: { accessPdf: false, ocr: false, index: true }
	},
	{
		id: 'OBJ-20260131-000255',
		objectId: 'OBJ-20260131-000255',
		thumbnailArtifactId: 'artifact-thumb-3',
		title: 'Tajik Radio Interview – Episode 4',
		type: 'AUDIO',
		processingState: 'ingesting',
		curationState: 'review_in_progress',
		availabilityState: 'UNAVAILABLE',
		accessLevel: 'public',
		language: 'tg',
		tags: ['subject:interview', 'format:audio'],
		tenantId: 'tenant-1',
		sourceIngestionId: 'ingestion-3',
		sourceBatchLabel: 'BATCH-20260131-0024',
		metadata: {},
		embargoUntil: null,
		embargoKind: 'none',
		embargoCurationState: null,
		rightsNote: null,
		sensitivityNote: null,
		canDownload: false,
		accessReasonCode: 'TEMP_UNAVAILABLE',
		createdAt: '2026-01-31T11:00:00Z',
		updatedAt: '2026-01-31T12:02:00Z',
		indicators: { accessPdf: false, ocr: false, index: false }
	},
	{
		id: 'OBJ-20260130-000231',
		objectId: 'OBJ-20260130-000231',
		thumbnailArtifactId: null,
		title: 'Letter from Dushanbe',
		type: 'DOCUMENT',
		processingState: 'processing_failed',
		curationState: 'curation_failed',
		availabilityState: 'ARCHIVED',
		accessLevel: 'private',
		language: 'tg',
		tags: ['subject:correspondence'],
		tenantId: 'tenant-1',
		sourceIngestionId: 'ingestion-4',
		sourceBatchLabel: 'BATCH-20260130-0020',
		metadata: {},
		embargoUntil: null,
		embargoKind: 'none',
		embargoCurationState: null,
		rightsNote: null,
		sensitivityNote: null,
		canDownload: false,
		accessReasonCode: 'RESTORE_REQUIRED',
		createdAt: '2026-01-30T07:00:00Z',
		updatedAt: '2026-01-30T08:40:00Z',
		indicators: { accessPdf: false, ocr: true, index: false }
	}
];

export const mockObjectsService: ObjectsService = {
	listObjects: async (request: ObjectsListRequest) => ({
		rows,
		limit: request.filters.limit ?? 25,
		totalCount: 128,
		filteredCount: rows.length,
		nextCursor: null
	}),
	listRecent: async (request: ObjectsRecentRequest) => rows.slice(0, request.limit ?? 6),
	getObjectDetail: async ({ objectId }) => {
		const found = rows.find((row) => row.objectId === objectId || row.id === objectId) ?? rows[0];
		if (!found) {
			throw new Error('Object not found');
		}

		return {
			...found,
			ingestManifest: {
				schema_version: '1.0',
				object_id: found.objectId,
				classification: {
					type: found.type,
					language: found.language,
					tags: found.tags
				}
			},
			isAuthorized: found.accessReasonCode !== 'FORBIDDEN_POLICY',
			isDeliverable: found.availabilityState === 'AVAILABLE'
		};
	},
	listObjectArtifacts: async ({ objectId }) => [
		{
			id: `${objectId}-artifact-pdf`,
			kind: 'access_pdf',
			variant: null,
			storageKey: `objects/${objectId}/access.pdf`,
			contentType: 'application/pdf',
			sizeBytes: 120340,
			createdAt: '2026-02-20T10:00:00Z'
		},
		{
			id: `${objectId}-artifact-ocr`,
			kind: 'ocr_text',
			variant: null,
			storageKey: `objects/${objectId}/ocr.txt`,
			contentType: 'text/plain',
			sizeBytes: 26000,
			createdAt: '2026-02-20T10:02:00Z'
		}
	],
	listObjectAvailableFiles: async ({ objectId }) => [
		{
			id: '11111111-1111-4111-8111-111111111111',
			archiveFileKey: `${objectId}/original.pdf`,
			artifactKind: 'original',
			variant: null,
			displayName: 'Original PDF',
			contentType: 'application/pdf',
			sizeBytes: 421337,
			checksumSha256: null,
			metadata: {},
			isAvailable: true,
			syncedAt: '2026-03-02T10:00:00.000Z'
		},
		{
			id: '22222222-2222-4222-8222-222222222222',
			archiveFileKey: `${objectId}/ocr.txt`,
			artifactKind: 'ocr_text',
			variant: null,
			displayName: 'OCR text',
			contentType: 'text/plain',
			sizeBytes: 26000,
			checksumSha256: null,
			metadata: {},
			isAvailable: true,
			syncedAt: '2026-03-02T10:00:00.000Z'
		}
	],
	createObjectDownloadRequest: async ({ objectId, availableFileId }) => ({
		status: 'queued',
		objectId,
		artifact: null,
		request: {
			id: '44444444-4444-4444-8444-444444444444',
			availableFileId,
			requestedBy: 'user-1',
			artifactKind: 'original',
			variant: null,
			status: 'PENDING',
			failureReason: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			completedAt: null
		}
	}),
	requestResync: async ({ objectId }) => ({
		status: 'queued',
		objectId,
		request: {
			id: '55555555-5555-4555-8555-555555555555',
			tenantId: 'tenant-1',
			targetType: 'object',
			targetId: objectId,
			actionType: 'object_resync',
			actionPayload: {},
			requestedBy: 'user-1',
			dedupeKey: `object_resync:${objectId}`,
			status: 'PENDING',
			failureReason: null,
			failureDetails: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			completedAt: null
		}
	})
};
