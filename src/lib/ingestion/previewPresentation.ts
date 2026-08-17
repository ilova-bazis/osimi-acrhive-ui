import type { IngestionMediaKind } from '$lib/services/ingestionCapabilities';

export type PreviewPresentation =
	| { status: 'ready'; url: string }
	| { status: 'pending' }
	| { status: 'check-timeout' }
	| { status: 'failed' }
	| { status: 'purged' }
	| { status: 'unsupported' };

export type IngestionPreviewItem = {
	id: string;
	name: string;
	mediaType: IngestionMediaKind;
	contentType: string | null;
	sizeBytes: number;
	preview: PreviewPresentation;
};
