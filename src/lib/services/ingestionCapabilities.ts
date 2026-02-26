export type IngestionMediaKind = 'image' | 'audio' | 'video' | 'document';

export type IngestionCapabilities = {
	mediaKinds: IngestionMediaKind[];
	extensionsByKind: Record<IngestionMediaKind, string[]>;
	mimeByKind: Record<IngestionMediaKind, string[]>;
	mimeAliases: Record<string, string>;
};

export type IngestionCapabilitiesRequest = {
	fetchFn: typeof fetch;
	token: string;
};

export type IngestionCapabilitiesService = {
	getCapabilities: (request: IngestionCapabilitiesRequest) => Promise<IngestionCapabilities>;
};

export const DEFAULT_INGESTION_CAPABILITIES: IngestionCapabilities = {
	mediaKinds: ['image', 'audio', 'video', 'document'],
	extensionsByKind: {
		image: ['png', 'jpg', 'jpeg', 'tif', 'tiff'],
		audio: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'opus'],
		video: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'mpg', 'mpeg'],
		document: [
			'pdf',
			'doc',
			'docx',
			'odf',
			'odt',
			'rtf',
			'txt',
			'xls',
			'xlsx',
			'ods',
			'csv',
			'ppt',
			'pptx',
			'odp'
		]
	},
	mimeByKind: {
		image: ['image/jpeg', 'image/png', 'image/tiff', 'image/webp', 'image/gif', 'image/bmp'],
		audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac'],
		video: ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm', 'video/x-msvideo'],
		document: [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'text/plain',
			'text/csv'
		]
	},
	mimeAliases: {
		'image/jpg': 'image/jpeg',
		'audio/mp3': 'audio/mpeg',
		'audio/x-m4a': 'audio/mp4'
	}
};
