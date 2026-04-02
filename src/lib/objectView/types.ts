export type ObjectViewMediaType = 'document' | 'image' | 'audio' | 'video';

export type ObjectViewStatus = 'READY' | 'PROCESSING' | 'NEEDS_REVIEW';

export type ObjectViewTag = {
	label: string;
};

export type ObjectViewTranscriptSegment = {
	id: string;
	startSeconds: number;
	endSeconds: number;
	text: string;
	speaker?: string;
};

export type ObjectViewSubtitleCue = {
	id: string;
	startSeconds: number;
	endSeconds: number;
	text: string;
};

export type ObjectViewDocumentPage = {
	id: string;
	label: string;
	imageUrl: string;
	ocrText: string;
};

export type ObjectViewMetadata = {
	title: string;
	publicationDate: string;
	language: string;
	tags: ObjectViewTag[];
	description: string;
	accessLevel: 'Private' | 'Family' | 'Public';
	rightsNote: string;
	collection: string;
};

type ObjectViewBase = {
	id: string;
	title: string;
	status: ObjectViewStatus;
	mediaType: ObjectViewMediaType;
	subtitle: string;
	metadata: ObjectViewMetadata;
	reviewLabel: string;
};

export type DocumentObjectView = ObjectViewBase & {
	mediaType: 'document';
	pageCount: number;
	pages: ObjectViewDocumentPage[];
	hasOcr: boolean;
};

export type ImageObjectView = ObjectViewBase & {
	mediaType: 'image';
	imageUrl: string;
	imageAlt: string;
	hasZoom: boolean;
};

export type AudioObjectView = ObjectViewBase & {
	mediaType: 'audio';
	durationSeconds: number;
	waveform: number[];
	transcript: ObjectViewTranscriptSegment[];
};

export type VideoObjectView = ObjectViewBase & {
	mediaType: 'video';
	durationSeconds: number;
	posterUrl: string;
	transcript: ObjectViewTranscriptSegment[];
	subtitles: ObjectViewSubtitleCue[];
};

export type ObjectViewRecord =
	| DocumentObjectView
	| ImageObjectView
	| AudioObjectView
	| VideoObjectView;
