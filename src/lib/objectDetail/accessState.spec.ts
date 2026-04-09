import { describe, expect, it } from 'vitest';
import { deriveObjectDetailAccessSummary } from '$lib/objectDetail/accessState';
import type { ArchiveRequest } from '$lib/services/archiveRequests';
import type { ObjectAvailableFile, ObjectDetail } from '$lib/services/objects';

const baseDetail: ObjectDetail = {
	id: 'OBJ-1',
	objectId: 'OBJ-1',
	thumbnailArtifactId: 'thumb-1',
	title: 'Object 1',
	type: 'VIDEO',
	processingState: 'index_done',
	curationState: 'reviewed',
	availabilityState: 'ARCHIVED',
	accessLevel: 'family',
	language: 'en',
	tags: [],
	tenantId: 'tenant-1',
	sourceIngestionId: null,
	sourceBatchLabel: null,
	metadata: {},
	embargoUntil: null,
	embargoKind: 'none',
	embargoCurationState: null,
	rightsNote: null,
	sensitivityNote: null,
	canDownload: false,
	accessReasonCode: 'RESTORE_REQUIRED',
	createdAt: '2026-04-02T10:00:00.000Z',
	updatedAt: '2026-04-02T10:00:00.000Z',
	indicators: {
		accessPdf: false,
		ocr: false,
		index: false
	},
	ingestManifest: null,
	isAuthorized: true,
	isDeliverable: false
};

const videoFile: ObjectAvailableFile = {
	id: '11111111-1111-4111-8111-111111111111',
	archiveFileKey: 'OBJ-1/proxy.mp4',
	artifactKind: 'stream_proxy',
	variant: 'mp4',
	displayName: 'Streaming MP4',
	contentType: 'video/mp4',
	sizeBytes: 1024,
	checksumSha256: null,
	metadata: {},
	isAvailable: false,
	syncedAt: '2026-04-02T10:00:00.000Z'
};

describe('deriveObjectDetailAccessSummary', () => {
	it('picks the best primary file and marks request required', () => {
		const summary = deriveObjectDetailAccessSummary({
			detail: baseDetail,
			availableFiles: [videoFile],
			pendingRequests: []
		});

		expect(summary.mediaType).toBe('video');
		expect(summary.state).toBe('request_required');
		expect(summary.primaryFile?.id).toBe(videoFile.id);
	});

	it('marks request pending when artifact fetch is active', () => {
		const pendingRequest: ArchiveRequest = {
			id: 'req-1',
			tenantId: 'tenant-1',
			targetType: 'object',
			targetId: 'OBJ-1',
			actionType: 'artifact_fetch',
			requestedBy: 'user-1',
			dedupeKey: 'dedupe',
			status: 'PROCESSING',
			failureReason: null,
			createdAt: '2026-04-02T10:00:00.000Z',
			updatedAt: '2026-04-02T10:00:00.000Z',
			completedAt: null
		};

		const summary = deriveObjectDetailAccessSummary({
			detail: baseDetail,
			availableFiles: [videoFile],
			pendingRequests: [pendingRequest]
		});

		expect(summary.state).toBe('request_pending');
		expect(summary.pendingRequest?.id).toBe('req-1');
	});

	it('marks available when deliverable primary media exists', () => {
		const summary = deriveObjectDetailAccessSummary({
			detail: {
				...baseDetail,
				availabilityState: 'AVAILABLE',
				canDownload: true,
				isDeliverable: true,
				accessReasonCode: 'OK'
			},
			availableFiles: [{ ...videoFile, isAvailable: true }],
			pendingRequests: []
		});

		expect(summary.state).toBe('available');
		expect(summary.reasonCode).toBe('OK');
	});
});
