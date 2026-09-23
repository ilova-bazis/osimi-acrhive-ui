import type { CurationState, ObjectsRequestContext } from './objects';

export type ObjectEditMediaType = 'document' | 'image' | 'audio' | 'video' | 'other';
export type DocumentPageStatus = 'machine' | 'edited';

export type ObjectEditDocumentPage = {
	pageNumber: number;
	label: string | null;
	machineText: string;
	curatedText: string;
	status: DocumentPageStatus;
};

export type ObjectEditDocumentPayload = {
	kind: 'document';
	machineOcrArtifactId: string | null;
	pageCount: number | null;
	pages: ObjectEditDocumentPage[];
};

export type ObjectEditImagePayload = { kind: 'image' };
export type ObjectEditAudioPayload = { kind: 'audio' };
export type ObjectEditVideoPayload = { kind: 'video' };
export type ObjectEditOtherPayload = { kind: 'other' };

export type ObjectEditCurationPayload =
	| ObjectEditDocumentPayload
	| ObjectEditImagePayload
	| ObjectEditAudioPayload
	| ObjectEditVideoPayload
	| ObjectEditOtherPayload;

export type ObjectEditMetadata = {
	title: string;
	publicationDate: string;
	datePrecision: 'none' | 'year' | 'month' | 'day';
	dateApproximate: boolean;
	language: string | null;
	tags: string[];
	people: string[];
	description: string | null;
};

export type ObjectEditRights = {
	accessLevel: 'private' | 'family' | 'public';
	rightsNote: string | null;
	sensitivityNote: string | null;
};

export type ObjectEditCapabilities = {
	canEditMetadata: boolean;
	canCurateText: boolean;
	canSubmitChanges: boolean;
};

export type ObjectEditDraft = { updatedAt: string; updatedBy: string } | null;

export type ObjectEditLock = {
	locked: boolean;
	lockedBy: string | null;
	lockedUntil: string | null;
};

export type ObjectEditPayload = {
	objectId: string;
	revision: number;
	mediaType: ObjectEditMediaType;
	lock: ObjectEditLock;
	curationState: CurationState;
	draft: ObjectEditDraft;
	metadata: ObjectEditMetadata;
	rights: ObjectEditRights;
	capabilities: ObjectEditCapabilities;
	curation: ObjectEditCurationPayload;
};

export type SaveMetadataResult = {
	objectId: string;
	revision: number;
	curationState: CurationState;
	updatedAt: string;
};

export type SaveDocumentCurationResult = {
	objectId: string;
	revision: number;
	updatedCount: number;
	updatedAt: string;
};

export type ArchiveSyncStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

export type SubmitObjectChangesResult = {
	objectId: string;
	currentRevision: number;
	submittedRevision: number;
	submission: {
		id: string;
		requestId: string;
		status: ArchiveSyncStatus;
		submittedAt: string;
		submittedBy: string | null;
	};
};

export type ObjectArchiveSyncSubmission = {
	id: string;
	requestId: string;
	submittedRevision: number;
	status: ArchiveSyncStatus;
	submittedAt: string;
	submittedBy: string | null;
	completedAt: string | null;
	failureReason: string | null;
};

export type ObjectArchiveSync = {
	objectId: string;
	currentRevision: number;
	latestSubmittedRevision: number | null;
	latestAppliedRevision: number | null;
	archiveOutOfSync: boolean;
	activeSubmission: ObjectArchiveSyncSubmission | null;
	latestSubmission: ObjectArchiveSyncSubmission | null;
};

export type ReleaseLockResult = {
	objectId: string;
	released: boolean;
};

export type ObjectEditRequest = {
	context: ObjectsRequestContext;
	objectId: string;
};

export type SaveMetadataRequest = {
	context: ObjectsRequestContext;
	objectId: string;
	revision: number;
	metadata: ObjectEditMetadata;
	rights: Pick<ObjectEditRights, 'rightsNote' | 'sensitivityNote'>;
};

export type SaveDocumentCurationRequest = {
	context: ObjectsRequestContext;
	objectId: string;
	revision: number;
	pages: Array<{ pageNumber: number; curatedText: string }>;
};

export type SubmitObjectChangesRequest = {
	context: ObjectsRequestContext;
	objectId: string;
	revision: number;
	submissionNote: string | null;
};

export type RetryObjectChangeSubmissionRequest = {
	context: ObjectsRequestContext;
	objectId: string;
	requestId: string;
	retryReason: string | null;
};

export type ReleaseLockRequest = {
	context: ObjectsRequestContext;
	objectId: string;
};

export type ObjectEditService = {
	getObjectEditPayload: (req: ObjectEditRequest) => Promise<ObjectEditPayload>;
	saveObjectMetadata: (req: SaveMetadataRequest) => Promise<SaveMetadataResult>;
	saveDocumentCuration: (req: SaveDocumentCurationRequest) => Promise<SaveDocumentCurationResult>;
	submitObjectChanges: (req: SubmitObjectChangesRequest) => Promise<SubmitObjectChangesResult>;
	getObjectArchiveSync: (req: ObjectEditRequest) => Promise<ObjectArchiveSync>;
	retryObjectChangeSubmission: (req: RetryObjectChangeSubmissionRequest) => Promise<SubmitObjectChangesResult>;
	releaseEditLock: (req: ReleaseLockRequest) => Promise<ReleaseLockResult>;
};

export class ObjectEditLockedError extends Error {
	lockedBy: string | null;
	lockedUntil: string | null;

	constructor(lockedBy: string | null, lockedUntil: string | null) {
		super('Object is currently being edited by another user');
		this.name = 'ObjectEditLockedError';
		this.lockedBy = lockedBy;
		this.lockedUntil = lockedUntil;
	}
}

export class ObjectEditRevisionConflictError extends Error {
	latestRevision: number | null;

	constructor(latestRevision: number | null) {
		super('Object edit revision is stale');
		this.name = 'ObjectEditRevisionConflictError';
		this.latestRevision = latestRevision;
	}
}
