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
	canSubmitReview: boolean;
};

export type ObjectEditDraft = { updatedAt: string; updatedBy: string } | null;

export type ObjectEditLock = {
	locked: boolean;
	lockedBy: string | null;
	lockedUntil: string | null;
};

export type ObjectEditPayload = {
	objectId: string;
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
	curationState: CurationState;
	updatedAt: string;
};

export type SaveDocumentCurationResult = {
	objectId: string;
	updatedCount: number;
	updatedAt: string;
};

export type SubmitCurationResult = {
	objectId: string;
	curationState: CurationState;
	submittedAt: string;
	submittedBy: string;
	requestId: string;
	requestStatus: 'PENDING' | 'PROCESSING';
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
	metadata: ObjectEditMetadata;
	rights: Pick<ObjectEditRights, 'rightsNote' | 'sensitivityNote'>;
};

export type SaveDocumentCurationRequest = {
	context: ObjectsRequestContext;
	objectId: string;
	pages: Array<{ pageNumber: number; curatedText: string }>;
};

export type SubmitCurationRequest = {
	context: ObjectsRequestContext;
	objectId: string;
	reviewNote: string | null;
};

export type ReleaseLockRequest = {
	context: ObjectsRequestContext;
	objectId: string;
};

export type ObjectEditService = {
	getObjectEditPayload: (req: ObjectEditRequest) => Promise<ObjectEditPayload>;
	saveObjectMetadata: (req: SaveMetadataRequest) => Promise<SaveMetadataResult>;
	saveDocumentCuration: (req: SaveDocumentCurationRequest) => Promise<SaveDocumentCurationResult>;
	submitObjectCuration: (req: SubmitCurationRequest) => Promise<SubmitCurationResult>;
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
