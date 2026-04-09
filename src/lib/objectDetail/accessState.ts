import type { ArchiveRequest } from '$lib/services/archiveRequests';
import type {
	AccessReasonCode,
	ObjectAvailableFile,
	ObjectDetail
} from '$lib/services/objects';

export type ObjectDetailMediaType = 'document' | 'image' | 'audio' | 'video' | 'unknown';

export type ObjectDetailPreviewArtifact = 'thumbnail' | 'ocr' | 'access_pdf' | 'index';

export type ObjectDetailAccessState =
	| 'available'
	| 'request_required'
	| 'request_pending'
	| 'restricted'
	| 'temporarily_unavailable';

export type ObjectDetailAccessSummary = {
	mediaType: ObjectDetailMediaType;
	state: ObjectDetailAccessState;
	reasonCode: AccessReasonCode;
	previewArtifacts: ObjectDetailPreviewArtifact[];
	primaryFile: ObjectAvailableFile | null;
	pendingRequest: ArchiveRequest | null;
};

const isMediaContentType = (contentType: string | null, mediaType: ObjectDetailMediaType): boolean => {
	if (!contentType) return false;
	if (mediaType === 'document') return contentType === 'application/pdf';
	if (mediaType === 'image') return contentType.startsWith('image/');
	if (mediaType === 'audio') return contentType.startsWith('audio/');
	if (mediaType === 'video') return contentType.startsWith('video/');
	return false;
};

const normalizeMediaType = (value: string): ObjectDetailMediaType => {
	const normalized = value.trim().toLowerCase();
	if (normalized === 'document') return 'document';
	if (normalized === 'image') return 'image';
	if (normalized === 'audio') return 'audio';
	if (normalized === 'video') return 'video';
	return 'unknown';
};

const previewArtifactsFor = (detail: ObjectDetail): ObjectDetailPreviewArtifact[] => {
	const previewArtifacts: ObjectDetailPreviewArtifact[] = [];

	if (detail.thumbnailArtifactId) previewArtifacts.push('thumbnail');
	if (detail.indicators.ocr) previewArtifacts.push('ocr');
	if (detail.indicators.accessPdf) previewArtifacts.push('access_pdf');
	if (detail.indicators.index) previewArtifacts.push('index');

	return previewArtifacts;
};

const fileScore = (
	file: ObjectAvailableFile,
	mediaType: ObjectDetailMediaType
): number => {
	let score = 0;
	const artifactKind = file.artifactKind.toLowerCase();
	const variant = file.variant?.toLowerCase() ?? '';

	if (isMediaContentType(file.contentType, mediaType)) score += 40;
	if (artifactKind.includes('original')) score += 30;
	if (artifactKind.includes('access')) score += 25;
	if (artifactKind.includes('stream')) score += 25;
	if (artifactKind.includes('proxy')) score += 20;
	if (artifactKind.includes('poster') || artifactKind.includes('thumbnail')) score -= 30;
	if (artifactKind.includes('ocr') || artifactKind.includes('transcript') || artifactKind.includes('caption')) score -= 35;
	if (variant.includes('mp4') || variant.includes('mp3') || variant.includes('pdf')) score += 5;
	if (file.isAvailable) score += 10;

	return score;
};

const selectPrimaryFile = (
	mediaType: ObjectDetailMediaType,
	availableFiles: ObjectAvailableFile[]
): ObjectAvailableFile | null => {
	if (availableFiles.length === 0) return null;

	const sorted = [...availableFiles].sort((left, right) => fileScore(right, mediaType) - fileScore(left, mediaType));
	return sorted[0] ?? null;
};

const pendingArtifactFetch = (pendingRequests: ArchiveRequest[]): ArchiveRequest | null =>
	pendingRequests.find((request) => request.actionType === 'artifact_fetch') ?? null;

export const deriveObjectDetailAccessSummary = (params: {
	detail: ObjectDetail;
	availableFiles: ObjectAvailableFile[];
	pendingRequests: ArchiveRequest[];
}): ObjectDetailAccessSummary => {
	const mediaType = normalizeMediaType(params.detail.type);
	const primaryFile = selectPrimaryFile(mediaType, params.availableFiles);
	const pendingRequest = pendingArtifactFetch(params.pendingRequests);
	const previewArtifacts = previewArtifactsFor(params.detail);

	if (params.detail.accessReasonCode === 'FORBIDDEN_POLICY' || params.detail.accessReasonCode === 'EMBARGO_ACTIVE') {
		return {
			mediaType,
			state: 'restricted',
			reasonCode: params.detail.accessReasonCode,
			previewArtifacts,
			primaryFile,
			pendingRequest
		};
	}

	if (pendingRequest || params.detail.accessReasonCode === 'RESTORE_IN_PROGRESS') {
		return {
			mediaType,
			state: 'request_pending',
			reasonCode: 'RESTORE_IN_PROGRESS',
			previewArtifacts,
			primaryFile,
			pendingRequest
		};
	}

	if (params.detail.isDeliverable && params.detail.canDownload && primaryFile?.isAvailable) {
		return {
			mediaType,
			state: 'available',
			reasonCode: 'OK',
			previewArtifacts,
			primaryFile,
			pendingRequest
		};
	}

	if (params.detail.accessReasonCode === 'RESTORE_REQUIRED' || primaryFile) {
		return {
			mediaType,
			state: 'request_required',
			reasonCode: params.detail.accessReasonCode === 'OK' ? 'RESTORE_REQUIRED' : params.detail.accessReasonCode,
			previewArtifacts,
			primaryFile,
			pendingRequest
		};
	}

	return {
		mediaType,
		state: 'temporarily_unavailable',
		reasonCode: params.detail.accessReasonCode === 'OK' ? 'TEMP_UNAVAILABLE' : params.detail.accessReasonCode,
		previewArtifacts,
		primaryFile,
		pendingRequest
	};
};
