import { createHash } from 'node:crypto';

export const TOKEN = 'um98-session-token';
export const USER_ID = 'user-um98';
export const TENANT_ID = 'tenant-um98';
export const FIXED_TIME = '2026-08-14T12:34:56.000Z';

export const BATCH_ID = 'BATCH-20260814-SMOKE';
export const DRAFT_BATCH_ID = 'BATCH-20260814-DRAFT';
export const ITEM_ID = 'item-um98-1';
export const FILE_DOC = 'file-um98-document';
export const FILE_IMG = 'file-um98-image';
export const FILE_SKIPPED = 'file-um98-skipped';
export const FILE_UPLOAD = '40000000-0000-4000-8000-000000000001';
export const AVAILABLE_FILE_ID = '11111111-1111-4111-8111-111111111111';
export const DOWNLOAD_REQUEST_ID = '22222222-2222-4222-8222-222222222222';
export const RESYNC_REQUEST_ID = '33333333-3333-4333-8333-333333333333';
export const PUBLICATION_REQUEST_ID = 'request-um98-publication';

export const DOC_OBJECT_ID = 'OBJ-20260814-DOC001';
export const IMG_OBJECT_ID = 'OBJ-20260814-IMG001';
export const AUD_OBJECT_ID = 'OBJ-20260814-AUD001';
export const VID_OBJECT_ID = 'OBJ-20260814-VID001';

const ART_PAGE_1 = '50000000-0000-4000-8000-000000000001';
export const ART_OCR = '50000000-0000-4000-8000-000000000002';
const ART_DOC_THUMB = '50000000-0000-4000-8000-000000000003';
const ART_IMG_THUMB = '50000000-0000-4000-8000-000000000004';
const ART_AUDIO = '50000000-0000-4000-8000-000000000005';
const ART_AUD_THUMB = '50000000-0000-4000-8000-000000000006';
const ART_POSTER = '50000000-0000-4000-8000-000000000007';
const ART_VID_THUMB = '50000000-0000-4000-8000-000000000008';
const ART_TRANSCRIPT = '50000000-0000-4000-8000-000000000009';
export const ART_PAGE_1_OCR = '50000000-0000-4000-8000-000000000010';
export const ART_PAGE_2_OCR = '50000000-0000-4000-8000-000000000011';

const UI_ORIGIN = process.env.SMOKE_UI_ORIGIN ?? 'http://127.0.0.1:4600';
const LAST_MODIFIED = 'Thu, 13 Aug 2026 12:00:00 GMT';

export const createContext = () => ({
	activeTokens: new Set(),
	uploadsByFileId: new Map(),
	uploadsByToken: new Map(),
	committedUploads: new Set(),
	nextUploadId: 1
});

const PNG_BYTES = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
	'base64'
);

const TEXT_BYTES = Buffer.from('Smoke fixture OCR text for page one.\nSecond line of text.', 'utf8');

const PAGE_ONE_OCR_BYTES = Buffer.from('Smoke fixture page one OCR text.', 'utf8');
const PAGE_TWO_OCR_BYTES = Buffer.from('Smoke fixture page two OCR text.', 'utf8');

const PDF_BYTES = Buffer.from(
	'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
	'utf8'
);

const makeWav = (durationSeconds = 1) => {
	const sampleRate = 8000;
	const samples = Math.floor(sampleRate * durationSeconds);
	const dataSize = samples * 2;
	const buffer = Buffer.alloc(44 + dataSize);
	buffer.write('RIFF', 0);
	buffer.writeUInt32LE(36 + dataSize, 4);
	buffer.write('WAVE', 8);
	buffer.write('fmt ', 12);
	buffer.writeUInt32LE(16, 16);
	buffer.writeUInt16LE(1, 20);
	buffer.writeUInt16LE(1, 22);
	buffer.writeUInt32LE(sampleRate, 24);
	buffer.writeUInt32LE(sampleRate * 2, 28);
	buffer.writeUInt16LE(2, 32);
	buffer.writeUInt16LE(16, 34);
	buffer.write('data', 36);
	buffer.writeUInt32LE(dataSize, 40);
	return buffer;
};

const WAV_BYTES = makeWav(1);

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

const json = (response, status, payload, headers = {}) => {
	const body = JSON.stringify(payload);
	response.writeHead(status, {
		'content-type': 'application/json',
		'content-length': Buffer.byteLength(body),
		...headers
	});
	response.end(body);
};

const uploadJson = (response, status, payload) =>
	json(response, status, payload, { 'access-control-allow-origin': UI_ORIGIN });

export const unauthorized = (response) =>
	json(response, 401, {
		error: { code: 'UNAUTHORIZED', message: 'Missing or invalid session token.' },
		request_id: 'req-um98-unauthorized'
	});

export const isAuthenticated = (context, request) => {
	const header = request.headers.authorization ?? '';
	const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
	return context.activeTokens.has(token);
};

const backendUser = () => ({
	id: USER_ID,
	username: 'smoke-archiver',
	tenant_id: TENANT_ID,
	role: 'archiver'
});

const baseSummary = () => ({
	title: {
		primary: 'War-time newspaper issue',
		original_script: null,
		translations: [{ lang: 'ru', text: 'Номер газеты военного времени' }]
	},
	classification: { tags: ['war', 'newspaper'], summary: 'A scanned newspaper issue.' },
	dates: {
		published: { value: '1945-05-09', approximate: false, confidence: 'high', note: null },
		created: { value: '1945-05-09', approximate: true, confidence: 'low', note: null }
	},
	item_kind: 'scanned_document',
	processing: {
		ocr_text: { enabled: true, language: 'ru' },
		audio_transcript: { enabled: false },
		video_transcript: { enabled: false }
	},
	publication: { name: null, issue: null, volume: null, pages: null, place: null },
	people: { subjects: [], authors: ['Editor A.'], contributors: [], mentioned: [] },
	links: { related_object_ids: [], external_urls: [] },
	notes: { internal: null, public: null }
});

const baseIngestionResource = (id, label, status, overrides = {}) => ({
	ingestion_id: id,
	batch_label: label,
	schema_version: '1.0',
	classification_type: 'document',
	item_kind: 'scanned_document',
	language_code: 'ru',
	pipeline_preset: 'ocr_text',
	access_level: 'private',
	embargo_until: null,
	rights_note: null,
	sensitivity_note: null,
	summary: baseSummary(),
	status,
	created_at: FIXED_TIME,
	updated_at: FIXED_TIME,
	total_objects: 2,
	completed_count: 1,
	staging_purge: { state: 'NOT_SCHEDULED', started_at: null, purged_at: null },
	action_capabilities: {
		can_resume: true,
		can_retry: false,
		can_cancel: true,
		can_restore: false,
		can_delete: true
	},
	...overrides
});

const previewEntry = (contentType, width = 640, height = 480, url = null) => ({
	status: 'ready',
	content_type: contentType,
	size_bytes: PNG_BYTES.length,
	width,
	height,
	url,
	error: null
});

const filesPayload = () => ({
	files: [
		{
			file_id: FILE_DOC,
			filename: 'report-1945.pdf',
			status: 'UPLOADED',
			content_type: 'application/pdf',
			size_bytes: 1024000,
			created_at: FIXED_TIME,
			preview: previewEntry('image/png', 640, 480, `/ingestion/${BATCH_ID}/files/${FILE_DOC}/preview`)
		},
		{
			file_id: FILE_IMG,
			filename: 'photo-1945.jpg',
			status: 'UPLOADED',
			content_type: 'image/jpeg',
			size_bytes: 204800,
			created_at: FIXED_TIME,
			preview: previewEntry('image/png', 320, 240, `/ingestion/${BATCH_ID}/files/${FILE_IMG}/preview`)
		},
		{
			file_id: FILE_SKIPPED,
			filename: 'notes.txt',
			status: 'FAILED',
			content_type: 'text/plain',
			size_bytes: 120,
			created_at: FIXED_TIME,
			preview: {
				status: 'unsupported',
				content_type: null,
				size_bytes: null,
				width: null,
				height: null,
				url: null,
				error: null
			}
		}
	]
});

const objectGroupsPayload = () => ({
	object_groups: [
		{
			label: 'Item 1',
			file_ids: [FILE_DOC],
			metadata: { title: 'War-time newspaper issue', tags: ['war'], description: 'Scanned issue.', people: [] }
		}
	]
});

const itemsPayload = () => ({
	items: [
		{
			id: ITEM_ID,
			ingestion_id: BATCH_ID,
			item_index: 1,
			status: 'READY',
			classification_type: 'document',
			item_kind: 'scanned_document',
			language_code: 'ru',
			title: 'War-time newspaper issue',
			summary: {},
			object_id: null,
			created_at: FIXED_TIME,
			updated_at: FIXED_TIME
		}
	]
});

const itemFilesPayload = () => ({
	files: [
		{
			id: 'item-file-um98-1',
			ingestion_item_id: ITEM_ID,
			ingestion_file_id: FILE_DOC,
			ingestion_id: BATCH_ID,
			role: 'primary',
			sort_order: 1,
			page_number: null,
			is_primary: true,
			logical_label: null,
			created_at: FIXED_TIME
		}
	]
});

const objectBase = (objectId, title, type, availability, thumbnailArtifactId, overrides = {}) => ({
	id: objectId,
	object_id: objectId,
	thumbnail_artifact_id: thumbnailArtifactId,
	title,
	processing_state: 'derivatives_done',
	curation_state: 'reviewed',
	availability_state: availability,
	access_level: 'public',
	type,
	tenant_id: TENANT_ID,
	source_ingestion_id: BATCH_ID,
	source_batch_label: 'Smoke Batch',
	metadata: {},
	created_at: FIXED_TIME,
	updated_at: FIXED_TIME,
	embargo_until: null,
	embargo_kind: 'none',
	embargo_curation_state: null,
	rights_note: null,
	sensitivity_note: null,
	language: 'ru',
	tags: ['war'],
	...overrides
});

const docObject = () =>
	objectBase(DOC_OBJECT_ID, 'War-time newspaper issue', 'document', 'AVAILABLE', ART_DOC_THUMB, {
		can_download: true,
		access_reason_code: 'OK',
		has_access_pdf: true,
		has_ocr: true,
		is_authorized: true,
		is_deliverable: true,
		ingest_manifest: null
	});

const imgObject = () =>
	objectBase(IMG_OBJECT_ID, 'Field photograph', 'image', 'ARCHIVED', ART_IMG_THUMB, {
		can_download: false,
		access_reason_code: 'RESTORE_REQUIRED',
		has_access_pdf: false,
		has_ocr: false,
		ingest_manifest: null
	});

const audObject = () =>
	objectBase(AUD_OBJECT_ID, 'Recorded interview', 'audio', 'RESTORING', ART_AUD_THUMB, {
		can_download: false,
		access_reason_code: 'RESTORE_IN_PROGRESS',
		has_access_pdf: false,
		has_ocr: false,
		ingest_manifest: null
	});

const vidObject = () =>
	objectBase(VID_OBJECT_ID, 'Home movie reel', 'video', 'UNAVAILABLE', ART_VID_THUMB, {
		can_download: false,
		access_reason_code: 'TEMP_UNAVAILABLE',
		has_access_pdf: false,
		has_ocr: false,
		ingest_manifest: null
	});

const artifactRef = (artifactId, contentType, displayName) => ({
	available: true,
	artifact_id: artifactId,
	content_type: contentType,
	display_name: displayName,
	metadata: {}
});

const docViewer = () => ({
	media_type: 'document',
	primary_source: {
		source_type: 'access_copy',
		artifact_kind: 'pdf',
		variant: null,
		status: 'available',
		available_file_id: AVAILABLE_FILE_ID,
		artifact_id: ART_PAGE_1,
		display_name: 'report-1945.pdf',
		content_type: 'application/pdf',
		size_bytes: PDF_BYTES.length,
		access_reason_code: 'OK'
	},
	active_request: null,
	preview_artifacts: {
		thumbnail: artifactRef(ART_DOC_THUMB, 'image/png', 'thumbnail.png'),
		poster: null,
		ocr_text: artifactRef(ART_OCR, 'text/plain', 'ocr-combined.txt'),
		transcript: null,
		captions: null
	},
	viewer_payload: {
		kind: 'document',
		artifact_id: ART_PAGE_1,
		content_type: 'application/pdf',
		ocr_text_artifact_id: ART_OCR,
		page_count: 2,
		pages: [
			{ page_number: 1, label: 'Page 1', image_artifact_id: ART_PAGE_1, ocr_text_artifact_id: ART_PAGE_1_OCR },
			{ page_number: 2, label: 'Page 2', image_artifact_id: ART_PAGE_1, ocr_text_artifact_id: ART_PAGE_2_OCR }
		]
	}
});

const imgViewer = () => ({
	media_type: 'image',
	primary_source: {
		source_type: 'original',
		artifact_kind: 'original',
		variant: null,
		status: 'request_required',
		available_file_id: AVAILABLE_FILE_ID,
		artifact_id: null,
		display_name: 'photo-1945.jpg',
		content_type: 'image/jpeg',
		size_bytes: 204800,
		access_reason_code: 'RESTORE_REQUIRED'
	},
	active_request: null,
	preview_artifacts: {
		thumbnail: artifactRef(ART_IMG_THUMB, 'image/png', 'thumbnail.png'),
		poster: null,
		ocr_text: null,
		transcript: null,
		captions: null
	},
	viewer_payload: {
		kind: 'image',
		artifact_id: null,
		content_type: 'image/jpeg',
		width: 1024,
		height: 768
	}
});

const audViewer = () => ({
	media_type: 'audio',
	primary_source: {
		source_type: 'original',
		artifact_kind: 'original',
		variant: null,
		status: 'request_pending',
		available_file_id: AVAILABLE_FILE_ID,
		artifact_id: null,
		display_name: 'interview-1945.mp3',
		content_type: 'audio/mpeg',
		size_bytes: null,
		access_reason_code: 'RESTORE_IN_PROGRESS'
	},
	active_request: {
		id: DOWNLOAD_REQUEST_ID,
		action_type: 'artifact_fetch',
		status: 'PROCESSING',
		created_at: FIXED_TIME,
		updated_at: FIXED_TIME
	},
	preview_artifacts: {
		thumbnail: artifactRef(ART_AUD_THUMB, 'image/png', 'thumbnail.png'),
		poster: null,
		ocr_text: null,
		transcript: artifactRef(ART_TRANSCRIPT, 'text/plain', 'transcript.txt'),
		captions: null
	},
	viewer_payload: {
		kind: 'audio',
		artifact_id: null,
		content_type: 'audio/mpeg',
		transcript_artifact_id: ART_TRANSCRIPT,
		duration_seconds: 125
	}
});

const vidViewer = () => ({
	media_type: 'video',
	primary_source: {
		source_type: 'original',
		artifact_kind: 'original',
		variant: null,
		status: 'temporarily_unavailable',
		available_file_id: null,
		artifact_id: null,
		display_name: 'film-1945.mp4',
		content_type: 'video/mp4',
		size_bytes: null,
		access_reason_code: 'TEMP_UNAVAILABLE'
	},
	active_request: null,
	preview_artifacts: {
		thumbnail: artifactRef(ART_VID_THUMB, 'image/png', 'thumbnail.png'),
		poster: artifactRef(ART_POSTER, 'image/png', 'poster.png'),
		ocr_text: null,
		transcript: null,
		captions: null
	},
	viewer_payload: {
		kind: 'video',
		artifact_id: null,
		content_type: 'video/mp4',
		poster_artifact_id: ART_POSTER,
		transcript_artifact_id: null,
		captions_artifact_id: null,
		duration_seconds: null
	}
});

const viewersByObject = {
	[DOC_OBJECT_ID]: docViewer,
	[IMG_OBJECT_ID]: imgViewer,
	[AUD_OBJECT_ID]: audViewer,
	[VID_OBJECT_ID]: vidViewer
};

const objectsById = {
	[DOC_OBJECT_ID]: docObject,
	[IMG_OBJECT_ID]: imgObject,
	[AUD_OBJECT_ID]: audObject,
	[VID_OBJECT_ID]: vidObject
};

const artifactsByObject = {
	[DOC_OBJECT_ID]: [
		{
			id: ART_PAGE_1,
			kind: 'pdf',
			variant: null,
			storage_key: 'smoke/doc/page1.pdf',
			content_type: 'application/pdf',
			size_bytes: PDF_BYTES.length,
			created_at: FIXED_TIME
		},
		{
			id: ART_OCR,
			kind: 'ocr_text',
			variant: null,
			storage_key: 'smoke/doc/ocr-combined.txt',
			content_type: 'text/plain',
			size_bytes: TEXT_BYTES.length,
			created_at: FIXED_TIME
		},
		{
			id: ART_PAGE_1_OCR,
			kind: 'ocr_text',
			variant: null,
			storage_key: 'smoke/doc/ocr-page-1.txt',
			content_type: 'text/plain',
			size_bytes: PAGE_ONE_OCR_BYTES.length,
			created_at: FIXED_TIME
		},
		{
			id: ART_PAGE_2_OCR,
			kind: 'ocr_text',
			variant: null,
			storage_key: 'smoke/doc/ocr-page-2.txt',
			content_type: 'text/plain',
			size_bytes: PAGE_TWO_OCR_BYTES.length,
			created_at: FIXED_TIME
		},
		{
			id: ART_DOC_THUMB,
			kind: 'thumbnail',
			variant: null,
			storage_key: 'smoke/doc/thumb.png',
			content_type: 'image/png',
			size_bytes: PNG_BYTES.length,
			created_at: FIXED_TIME
		}
	],
	[IMG_OBJECT_ID]: [
		{
			id: ART_IMG_THUMB,
			kind: 'thumbnail',
			variant: null,
			storage_key: 'smoke/img/thumb.png',
			content_type: 'image/png',
			size_bytes: PNG_BYTES.length,
			created_at: FIXED_TIME
		}
	],
	[AUD_OBJECT_ID]: [
		{
			id: ART_TRANSCRIPT,
			kind: 'transcript',
			variant: null,
			storage_key: 'smoke/aud/transcript.txt',
			content_type: 'text/plain',
			size_bytes: TEXT_BYTES.length,
			created_at: FIXED_TIME
		},
		{
			id: ART_AUDIO,
			kind: 'audio',
			variant: null,
			storage_key: 'smoke/aud/interview.wav',
			content_type: 'audio/wav',
			size_bytes: WAV_BYTES.length,
			created_at: FIXED_TIME
		},
		{
			id: ART_AUD_THUMB,
			kind: 'thumbnail',
			variant: null,
			storage_key: 'smoke/aud/thumb.png',
			content_type: 'image/png',
			size_bytes: PNG_BYTES.length,
			created_at: FIXED_TIME
		}
	],
	[VID_OBJECT_ID]: [
		{
			id: ART_POSTER,
			kind: 'poster',
			variant: null,
			storage_key: 'smoke/vid/poster.png',
			content_type: 'image/png',
			size_bytes: PNG_BYTES.length,
			created_at: FIXED_TIME
		},
		{
			id: ART_VID_THUMB,
			kind: 'thumbnail',
			variant: null,
			storage_key: 'smoke/vid/thumb.png',
			content_type: 'image/png',
			size_bytes: PNG_BYTES.length,
			created_at: FIXED_TIME
		}
	]
};

const artifactBytes = (artifactId) => {
	if (artifactId === ART_PAGE_1_OCR) return PAGE_ONE_OCR_BYTES;
	if (artifactId === ART_PAGE_2_OCR) return PAGE_TWO_OCR_BYTES;
	if (artifactId === ART_OCR || artifactId === ART_TRANSCRIPT) return TEXT_BYTES;
	if (artifactId === ART_PAGE_1) return PDF_BYTES;
	if (artifactId === ART_AUDIO) return WAV_BYTES;
	return PNG_BYTES;
};

const artifactContentType = (artifactId) => {
	if (
		artifactId === ART_OCR ||
		artifactId === ART_TRANSCRIPT ||
		artifactId === ART_PAGE_1_OCR ||
		artifactId === ART_PAGE_2_OCR
	) {
		return 'text/plain';
	}
	if (artifactId === ART_PAGE_1) return 'application/pdf';
	if (artifactId === ART_AUDIO) return 'audio/wav';
	return 'image/png';
};

const availableFilesPayload = (objectId) => ({
	object_id: objectId,
	available_files: [
		{
			id: AVAILABLE_FILE_ID,
			archive_file_key: `smoke/${objectId}/primary.bin`,
			artifact_kind: 'pdf',
			variant: null,
			display_name: 'report-1945.pdf',
			content_type: 'application/pdf',
			size_bytes: PDF_BYTES.length,
			checksum_sha256: sha256(PDF_BYTES),
			metadata: {},
			is_available: true,
			synced_at: FIXED_TIME
		}
	]
});

const publicationRequest = (status) => ({
	id: PUBLICATION_REQUEST_ID,
	tenant_id: TENANT_ID,
	target_type: 'object',
	target_id: DOC_OBJECT_ID,
	action_type: 'curation_apply',
	requested_by: USER_ID,
	dedupe_key: null,
	status,
	failure_reason: null,
	failure_details: null,
	created_at: FIXED_TIME,
	updated_at: FIXED_TIME,
	completed_at: status === 'COMPLETED' ? FIXED_TIME : null,
	action_payload: {}
});

const resyncRequest = () => ({
	id: RESYNC_REQUEST_ID,
	tenant_id: TENANT_ID,
	target_type: 'object',
	target_id: DOC_OBJECT_ID,
	action_type: 'object_resync',
	action_payload: {},
	requested_by: USER_ID,
	dedupe_key: null,
	status: 'PENDING',
	failure_reason: null,
	created_at: FIXED_TIME,
	updated_at: FIXED_TIME,
	completed_at: null
});

const editPayload = () => ({
	object_id: DOC_OBJECT_ID,
	revision: 4,
	media_type: 'document',
	lock: { locked: false, locked_by: null, locked_until: null },
	curation_state: 'review_in_progress',
	draft: null,
	metadata: {
		title: 'War-time newspaper issue',
		publication_date: '1945-05-09',
		date_precision: 'day',
		date_approximate: false,
		language: 'ru',
		tags: ['war'],
		people: ['Editor A.'],
		description: 'Scanned issue notes.'
	},
	rights: {
		access_level: 'public',
		rights_note: null,
		sensitivity_note: null
	},
	capabilities: {
		can_edit_metadata: true,
		can_curate_text: true,
		can_submit_review: true
	},
	curation_payload: {
		kind: 'document',
		machine_ocr_artifact_id: ART_OCR,
		page_count: 2,
		pages: [
			{ page_number: 1, label: 'Page 1', machine_text: 'Machine OCR page one.', curated_text: null, status: 'machine' },
			{ page_number: 2, label: 'Page 2', machine_text: 'Machine OCR page two.', curated_text: null, status: 'machine' }
		]
	}
});

const dashboardSummary = () => ({
	summary: {
		total_ingestions: 12,
		total_objects: 148,
		processed_today: 3,
		processed_week: 17,
		failed_count: 1
	}
});

const dashboardActivity = () => ({
	activity: [
		{
			id: 'act-um98-1',
			event_id: 'evt-um98-1',
			type: 'ingestion_completed',
			ingestion_id: BATCH_ID,
			object_id: null,
			payload: {},
			actor_user_id: USER_ID,
			created_at: FIXED_TIME
		},
		{
			id: 'act-um98-2',
			event_id: 'evt-um98-2',
			type: 'object_published',
			ingestion_id: null,
			object_id: DOC_OBJECT_ID,
			payload: {},
			actor_user_id: USER_ID,
			created_at: '2026-08-14T11:15:00.000Z'
		}
	],
	next_cursor: null
});

const capabilitiesPayload = () => ({
	media_kinds: ['image', 'audio', 'video', 'document'],
	extensions_by_kind: {
		image: ['jpg', 'jpeg', 'png', 'tiff'],
		audio: ['mp3', 'wav'],
		video: ['mp4'],
		document: ['pdf', 'txt', 'docx']
	},
	mime_by_kind: {
		image: ['image/jpeg', 'image/png', 'image/tiff'],
		audio: ['audio/mpeg', 'audio/wav'],
		video: ['video/mp4'],
		document: ['application/pdf', 'text/plain']
	},
	mime_aliases: { 'image/jpg': 'image/jpeg', 'audio/mp3': 'audio/mpeg' }
});

const etagFor = (bytes) => `"smoke-${sha256(bytes).slice(0, 12)}"`;

export const sendBytes = (response, bytes, contentType, request, { ranges = true, disposition } = {}) => {
	const etag = etagFor(bytes);
	const ifRange = request.headers['if-range'];
	const rangeHeader = request.headers.range;
	const ifRangeDate = typeof ifRange === 'string' ? Date.parse(ifRange) : Number.NaN;
	const ifRangeMatches =
		ifRange === undefined ||
		ifRange === etag ||
		(!Number.isNaN(ifRangeDate) && ifRangeDate >= Date.parse(LAST_MODIFIED));
	const rangeApplicable = ranges && ifRangeMatches && Boolean(rangeHeader);
	if (rangeApplicable) {
		const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
		if (match && (match[1] !== '' || match[2] !== '')) {
			let start;
			let end;
			if (match[1] === '' && match[2] !== '') {
				const suffixLength = Number(match[2]);
				if (Number.isNaN(suffixLength) || suffixLength <= 0) {
					start = bytes.length;
					end = bytes.length - 1;
				} else {
					start = Math.max(0, bytes.length - suffixLength);
					end = bytes.length - 1;
				}
			} else {
				start = match[1] === '' ? 0 : Number(match[1]);
				end = match[2] === '' ? bytes.length - 1 : Math.min(Number(match[2]), bytes.length - 1);
			}
			if (Number.isNaN(start) || start >= bytes.length || start > end) {
				response.writeHead(416, {
					'content-type': contentType,
					'content-range': `bytes */${bytes.length}`,
					'content-length': 0,
					'accept-ranges': 'bytes',
					etag,
					'last-modified': LAST_MODIFIED,
					...(disposition ? { 'content-disposition': disposition } : {}),
					'access-control-allow-origin': UI_ORIGIN
				});
				response.end();
				return;
			}
			const chunk = bytes.subarray(start, end + 1);
			response.writeHead(206, {
				'content-type': contentType,
				'content-length': chunk.length,
				'content-range': `bytes ${start}-${end}/${bytes.length}`,
				'accept-ranges': 'bytes',
				etag,
				'last-modified': LAST_MODIFIED,
				...(disposition ? { 'content-disposition': disposition } : {}),
				'access-control-allow-origin': UI_ORIGIN
			});
			response.end(chunk);
			return;
		}
	}
	response.writeHead(200, {
		'content-type': contentType,
		'content-length': bytes.length,
		...(ranges ? { 'accept-ranges': 'bytes' } : {}),
		etag,
		'last-modified': LAST_MODIFIED,
		...(disposition ? { 'content-disposition': disposition } : {}),
		'access-control-allow-origin': UI_ORIGIN
	});
	response.end(bytes);
};

const readJsonBody = async (request) => {
	const chunks = [];
	for await (const chunk of request) chunks.push(chunk);
	const text = Buffer.concat(chunks).toString('utf8');
	if (!text) return {};
	try {
		return JSON.parse(text);
	} catch {
		return {};
	}
};

const readBody = async (request) => {
	const chunks = [];
	for await (const chunk of request) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks);
};

const uuidFor = (prefix, sequence) =>
	`${prefix}0000000-0000-4000-8000-${sequence.toString(16).padStart(12, '0')}`;

const ingestionIdFrom = (request) => new URL(request.url ?? '/', 'http://127.0.0.1').pathname.split('/')[3];

const conflict = (response, message) =>
	json(response, 409, {
		error: { code: 'CONFLICT', message },
		request_id: 'req-um131-conflict'
	});

const badRequest = (response, message) =>
	json(response, 400, {
		error: { code: 'BAD_REQUEST', message },
		request_id: 'req-um131-bad-request'
	});

export const buildRoutes = (
	context,
	{
		now = () => Date.now(),
		uploadOrigin = (request) => `http://${request.headers.host ?? `127.0.0.1:${process.env.SMOKE_FIXTURE_PORT ?? 4601}`}`
	} = {}
) => [
	{
		method: 'GET',
		pattern: /^\/healthz$/,
		auth: false,
		handler: async (_request, response) => json(response, 200, { status: 'ok' })
	},
	{
		method: 'POST',
		pattern: /^\/api\/auth\/login$/,
		auth: false,
		handler: async (request, response) => {
			const body = await readJsonBody(request);
			if (body.username === 'smoke-archiver' && body.password === 'um98-smoke-password') {
				context.activeTokens.add(TOKEN);
				json(response, 200, {
					token: TOKEN,
					token_type: 'Bearer',
					user: backendUser()
				});
				return;
			}
			json(response, 401, {
				error: { code: 'UNAUTHORIZED', message: 'Invalid credentials.' },
				request_id: 'req-um98-login-denied'
			});
		}
	},
	{
		method: 'POST',
		pattern: /^\/api\/auth\/logout$/,
		auth: true,
		handler: async (_request, response) => {
			context.activeTokens.delete(TOKEN);
			json(response, 200, { status: 'ok' });
		}
	},
	{
		method: 'GET',
		pattern: /^\/api\/auth\/me$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, { user: backendUser() })
	},
	{
		method: 'GET',
		pattern: /^\/api\/dashboard\/summary$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, dashboardSummary())
	},
	{
		method: 'GET',
		pattern: /^\/api\/dashboard\/activity$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, dashboardActivity())
	},
	{
		method: 'GET',
		pattern: /^\/api\/ingestions$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				ingestions: [
					baseIngestionResource(BATCH_ID, 'Smoke Batch', 'UPLOADING'),
					baseIngestionResource(DRAFT_BATCH_ID, 'Draft Batch', 'DRAFT', {
						action_capabilities: {
							can_resume: true,
							can_retry: false,
							can_cancel: true,
							can_restore: false,
							can_delete: true
						}
					})
				],
				next_cursor: null
			})
	},
	{
		method: 'POST',
		pattern: /^\/api\/ingestions$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 201, {
				ingestion: baseIngestionResource(BATCH_ID, 'Smoke Batch', 'UPLOADING')
			})
	},
	{
		method: 'GET',
		pattern: /^\/api\/ingestions\/capabilities$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, capabilitiesPayload())
	},
	{
		method: 'GET',
		pattern: /^\/api\/ingestions\/[^/]+\/items$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, itemsPayload())
	},
	{
		method: 'POST',
		pattern: /^\/api\/ingestions\/[^/]+\/items$/,
		auth: true,
		handler: async (_request, response) => json(response, 201, { item: itemsPayload().items[0] })
	},
	{
		method: 'PATCH',
		pattern: /^\/api\/ingestions\/[^/]+\/items\/[^/]+$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, { item: itemsPayload().items[0] })
	},
	{
		method: 'PATCH',
		pattern: /^\/api\/ingestions\/[^/]+\/items\/order$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, itemsPayload())
	},
	{
		method: 'GET',
		pattern: /^\/api\/ingestions\/[^/]+\/items\/[^/]+\/files$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, itemFilesPayload())
	},
	{
		method: 'POST',
		pattern: /^\/api\/ingestions\/[^/]+\/items\/[^/]+\/files$/,
		auth: true,
		handler: async (_request, response) => json(response, 201, { file: itemFilesPayload().files[0] })
	},
	{
		method: 'PATCH',
		pattern: /^\/api\/ingestions\/[^/]+\/items\/[^/]+\/files\/order$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, itemFilesPayload())
	},
	{
		method: 'POST',
		pattern: /^\/api\/ingestions\/[^/]+\/files\/presign$/,
		auth: true,
		handler: async (request, response) => {
			const body = await readJsonBody(request);
			if (
				typeof body.filename !== 'string' ||
				body.filename.length === 0 ||
				typeof body.content_type !== 'string' ||
				body.content_type.length === 0 ||
				!Number.isInteger(body.size_bytes) ||
				body.size_bytes < 1
			) {
				badRequest(response, 'Presign requires filename, content_type, and a positive integer size_bytes.');
				return;
			}
			const sequence = context.nextUploadId++;
			const fileId = uuidFor('4', sequence);
			const uploadToken = uuidFor('6', sequence);
			const expiresAtMs = now() + 3_600_000;
			const upload = {
				fileId,
				uploadToken,
				ingestionId: ingestionIdFrom(request),
				filename: body.filename,
				contentType: body.content_type,
				sizeBytes: body.size_bytes,
				expiresAtMs,
				bytes: null,
				checksumSha256: null
			};
			context.uploadsByFileId.set(fileId, upload);
			context.uploadsByToken.set(uploadToken, upload);
			const origin = typeof uploadOrigin === 'function' ? uploadOrigin(request) : uploadOrigin;
			json(response, 201, {
				file_id: fileId,
				storage_key: `smoke/upload/${fileId}`,
				upload_url: `${origin}/smoke-upload/${uploadToken}`,
				expires_at: new Date(expiresAtMs).toISOString(),
				headers: { 'content-type': body.content_type, 'content-length': String(body.size_bytes) }
			});
		}
	},
	{
		method: 'POST',
		pattern: /^\/api\/ingestions\/[^/]+\/files\/commit$/,
		auth: true,
		handler: async (request, response) => {
			const body = await readJsonBody(request);
			const upload = context.uploadsByFileId.get(body.file_id);
			if (!upload || upload.ingestionId !== ingestionIdFrom(request)) {
				json(response, 400, {
					error: { code: 'INVALID_FILE', message: 'File was not presigned for this ingestion.' },
					request_id: 'req-um98-commit-invalid'
				});
				return;
			}
			if (upload.bytes === null) {
				conflict(response, 'The presigned file has not been uploaded.');
				return;
			}
			if (context.committedUploads.has(upload.fileId)) {
				conflict(response, 'The uploaded file has already been committed.');
				return;
			}
			if (typeof body.checksum_sha256 !== 'string' || body.checksum_sha256.toLowerCase() !== upload.checksumSha256) {
				conflict(response, 'The uploaded file checksum does not match.');
				return;
			}
			context.committedUploads.add(upload.fileId);
			json(response, 200, {
				file: {
					file_id: upload.fileId,
					filename: upload.filename,
					content_type: upload.contentType,
					size_bytes: upload.bytes.length,
					checksum_sha256: upload.checksumSha256,
					status: 'UPLOADED'
				}
			});
		}
	},
	{
		method: 'DELETE',
		pattern: /^\/api\/ingestions\/[^/]+\/files\/[^/]+$/,
		auth: true,
		handler: async (request, response) => {
			const { pathname } = new URL(request.url ?? '/', 'http://127.0.0.1');
			const fileId = pathname.split('/')[5];
			const upload = context.uploadsByFileId.get(fileId);
			if (!upload || upload.ingestionId !== ingestionIdFrom(request)) {
				json(response, 404, {
					error: { code: 'NOT_FOUND', message: 'Ingestion file not found.' },
					request_id: 'req-um131-delete-missing'
				});
				return;
			}
			context.uploadsByFileId.delete(fileId);
			context.uploadsByToken.delete(upload.uploadToken);
			context.committedUploads.delete(fileId);
			json(response, 200, { status: 'deleted', file_id: fileId });
		}
	},
	{
		method: 'GET',
		pattern: /^\/api\/ingestions\/[^/]+\/files\/[^/]+\/preview$/,
		auth: true,
		handler: async (request, response) => sendBytes(response, PNG_BYTES, 'image/png', request, { ranges: false })
	},
	{
		method: 'POST',
		pattern: /^\/api\/ingestions\/[^/]+\/submit$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				ingestion: baseIngestionResource(BATCH_ID, 'Smoke Batch', 'SUBMITTED')
			})
	},
	{
		method: 'POST',
		pattern: /^\/api\/ingestions\/[^/]+\/(retry|cancel|restore)$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				ingestion: baseIngestionResource(BATCH_ID, 'Smoke Batch', 'UPLOADING')
			})
	},
	{
		method: 'PATCH',
		pattern: /^\/api\/ingestions\/[^/]+$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				ingestion: baseIngestionResource(BATCH_ID, 'Smoke Batch', 'UPLOADING')
			})
	},
	{
		method: 'DELETE',
		pattern: /^\/api\/ingestions\/[^/]+$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, { status: 'deleted', ingestion_id: BATCH_ID })
	},
	{
		method: 'GET',
		pattern: /^\/api\/ingestions\/[^/]+$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				ingestion: baseIngestionResource(BATCH_ID, 'Smoke Batch', 'UPLOADING'),
				...filesPayload(),
				...objectGroupsPayload()
			})
	},
	{
		method: 'GET',
		pattern: /^\/api\/objects\/[^/]+\/curation-publication$/,
		auth: true,
		handler: async (request, response) => {
			const objectId = request.url.split('/')[3];
			json(response, 200, {
				object_id: objectId,
				request: objectId === DOC_OBJECT_ID
					? {
						id: PUBLICATION_REQUEST_ID,
						status: 'COMPLETED',
						failure_reason: null,
						publication_revision: 5,
						target_version: '20260814',
						created_at: FIXED_TIME,
						updated_at: FIXED_TIME,
						completed_at: FIXED_TIME
					}
					: null
			});
		}
	},
	{
		method: 'GET',
		pattern: /^\/api\/archive-requests$/,
		auth: true,
		handler: async (request, response) => {
			const url = new URL(request.url, 'http://127.0.0.1');
			const supportedParams = new Set([
				'limit',
				'cursor',
				'sort',
				'target_type',
				'target_id',
				'action_type',
				'status',
				'active_only',
				'include_payload'
			]);
			if ([...url.searchParams.keys()].some((key) => !supportedParams.has(key))) {
				badRequest(response, 'Unsupported archive request filter.');
				return;
			}
			const limitValue = url.searchParams.get('limit');
			const limit = limitValue === null ? 50 : Number(limitValue);
			const actionType = url.searchParams.get('action_type');
			const targetType = url.searchParams.get('target_type');
			const targetId = url.searchParams.get('target_id');
			const activeOnly = url.searchParams.get('active_only');
			const includePayload = url.searchParams.get('include_payload');
			const rawStatuses = url.searchParams.getAll('status').flatMap((value) => value.split(','));
			const statuses = rawStatuses.filter(Boolean);
			const validStatuses = new Set(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED']);
			if (
				!Number.isInteger(limit) ||
				limit < 1 ||
				limit > 200 ||
				(url.searchParams.has('sort') && url.searchParams.get('sort') !== 'created_at_desc') ||
				(url.searchParams.has('cursor') && !url.searchParams.get('cursor')) ||
				(targetType !== null && !['object', 'ingestion'].includes(targetType)) ||
				(targetId !== null && targetType === null) ||
				(targetId !== null && targetId.length === 0) ||
				(targetType === 'object' && targetId !== null && !/^OBJ-\d{8}-[A-Z0-9]{6}$/.test(targetId)) ||
				(actionType !== null && !['object_resync', 'artifact_fetch', 'curation_apply'].includes(actionType)) ||
				rawStatuses.some((status) => status.length === 0) ||
				statuses.some((status) => !validStatuses.has(status)) ||
				(activeOnly !== null && !['true', 'false'].includes(activeOnly)) ||
				(includePayload !== null && !['true', 'false'].includes(includePayload))
			) {
				badRequest(response, 'Invalid archive request filter.');
				return;
			}
			const candidates = [
				publicationRequest('COMPLETED'),
				{
					...publicationRequest('PROCESSING'),
					id: DOWNLOAD_REQUEST_ID,
					action_type: 'artifact_fetch',
					target_id: AUD_OBJECT_ID
				}
			];
			const effectiveStatuses = activeOnly === 'true' ? ['PENDING', 'PROCESSING'] : statuses;
			const requests = candidates
				.filter((entry) => targetType === null || entry.target_type === targetType)
				.filter((entry) => targetId === null || entry.target_id === targetId)
				.filter((entry) => actionType === null || entry.action_type === actionType)
				.filter((entry) => effectiveStatuses.length === 0 || effectiveStatuses.includes(entry.status))
				.slice(0, limit)
				.map((entry) => {
					if (includePayload === 'true') return entry;
					const withoutPayload = { ...entry };
					delete withoutPayload.action_payload;
					return withoutPayload;
				});
			json(response, 200, {
				requests,
				next_cursor: null,
				filtered_count: requests.length
			});
		}
	},
	{
		method: 'GET',
		pattern: /^\/api\/objects\/[^/]+\/artifacts\/[^/]+\/(view|download)$/,
		auth: true,
		handler: async (request, response) => {
			const { pathname } = new URL(request.url ?? '/', 'http://127.0.0.1');
			const segments = pathname.split('/');
			const objectId = segments[3];
			const artifactId = segments[5];
			const artifacts = artifactsByObject[objectId];
			const artifact = artifacts?.find((entry) => entry.id === artifactId);
			if (!artifact) {
				json(response, 404, {
					error: { code: 'NOT_FOUND', message: 'Artifact not found for object.' },
					request_id: 'req-um98-artifact-missing'
				});
				return;
			}
			const endpoint = segments[6];
			const disposition = `${endpoint === 'download' ? 'attachment' : 'inline'}; filename="${artifact.storage_key.split('/').at(-1)}"`;
			sendBytes(response, artifactBytes(artifactId), artifactContentType(artifactId), request, {
				ranges: endpoint === 'view',
				disposition
			});
		}
	},
	{
		method: 'GET',
		pattern: /^\/api\/objects\/[^/]+\/artifacts$/,
		auth: true,
		handler: async (request, response) => {
			const objectId = request.url.split('/')[3];
			json(response, 200, {
				object_id: objectId,
				artifacts: artifactsByObject[objectId] ?? []
			});
		}
	},
	{
		method: 'GET',
		pattern: /^\/api\/objects\/[^/]+\/available-files$/,
		auth: true,
		handler: async (request, response) => {
			const objectId = request.url.split('/')[3];
			json(response, 200, availableFilesPayload(objectId));
		}
	},
	{
		method: 'POST',
		pattern: /^\/api\/objects\/[^/]+\/download-requests$/,
		auth: true,
		handler: async (request, response) => {
			const objectId = request.url.split('/')[3];
			json(response, 200, {
				status: 'queued',
				object_id: objectId,
				request: {
					id: DOWNLOAD_REQUEST_ID,
					available_file_id: AVAILABLE_FILE_ID,
					requested_by: USER_ID,
					artifact_kind: 'pdf',
					variant: null,
					status: 'PENDING',
					failure_reason: null,
					created_at: FIXED_TIME,
					updated_at: FIXED_TIME,
					completed_at: null
				}
			});
		}
	},
	{
		method: 'POST',
		pattern: /^\/api\/objects\/[^/]+\/resync$/,
		auth: true,
		handler: async (request, response) => {
			const objectId = request.url.split('/')[3];
			json(response, 200, {
				status: 'queued',
				object_id: objectId,
				request: { ...resyncRequest(), target_id: objectId }
			});
		}
	},
	{
		method: 'GET',
		pattern: /^\/api\/objects\/[^/]+\/edit$/,
		auth: true,
		handler: async (_request, response) => json(response, 200, editPayload())
	},
	{
		method: 'PATCH',
		pattern: /^\/api\/objects\/[^/]+\/metadata$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				object_id: DOC_OBJECT_ID,
				revision: 5,
				curation_state: 'review_in_progress',
				updated_at: FIXED_TIME
			})
	},
	{
		method: 'PUT',
		pattern: /^\/api\/objects\/[^/]+\/curation\/document$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				object_id: DOC_OBJECT_ID,
				revision: 5,
				updated_count: 2,
				updated_at: FIXED_TIME
			})
	},
	{
		method: 'POST',
		pattern: /^\/api\/objects\/[^/]+\/curation\/submit$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				object_id: DOC_OBJECT_ID,
				revision: 5,
				curation_state: 'reviewed',
				request: {
					id: PUBLICATION_REQUEST_ID,
					action_type: 'curation_apply',
					status: 'PROCESSING'
				},
				submitted_at: FIXED_TIME,
				submitted_by: USER_ID
			})
	},
	{
		method: 'DELETE',
		pattern: /^\/api\/objects\/[^/]+\/edit-lock$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, { object_id: DOC_OBJECT_ID, released: true })
	},
	{
		method: 'GET',
		pattern: /^\/api\/objects\/[^/]+$/,
		auth: true,
		handler: async (request, response) => {
			const objectId = request.url.split('/')[3];
			const builder = objectsById[objectId];
			const viewerBuilder = viewersByObject[objectId];
			if (!builder) {
				json(response, 404, {
					error: { code: 'NOT_FOUND', message: 'Object not found.' },
					request_id: 'req-um98-object-missing'
				});
				return;
			}
			json(response, 200, {
				object: builder(),
				viewer: viewerBuilder ? viewerBuilder() : null
			});
		}
	},
	{
		method: 'GET',
		pattern: /^\/api\/objects$/,
		auth: true,
		handler: async (_request, response) =>
			json(response, 200, {
				objects: [docObject(), imgObject(), audObject(), vidObject()],
				next_cursor: null,
				total_count: 4,
				filtered_count: 4
			})
	},
	{
		method: 'PUT',
		pattern: /^\/smoke-upload\/[^/]+$/,
		auth: false,
		handler: async (request, response) => {
			const { pathname } = new URL(request.url ?? '/', 'http://127.0.0.1');
			const uploadToken = pathname.split('/')[2];
			const upload = context.uploadsByToken.get(uploadToken);
			if (!upload) {
				uploadJson(response, 404, {
					error: { code: 'NOT_FOUND', message: 'Upload was not presigned.' },
					request_id: 'req-um98-upload-unsigned'
				});
				return;
			}
			if (now() >= upload.expiresAtMs) {
				uploadJson(response, 403, {
					error: { code: 'UPLOAD_EXPIRED', message: 'The presigned upload has expired.' },
					request_id: 'req-um131-upload-expired'
				});
				return;
			}
			if (context.committedUploads.has(upload.fileId)) {
				uploadJson(response, 409, {
					error: { code: 'CONFLICT', message: 'The uploaded file has already been committed.' },
					request_id: 'req-um131-conflict'
				});
				return;
			}
			const bytes = await readBody(request);
			if (request.headers['content-type'] !== upload.contentType || bytes.length !== upload.sizeBytes) {
				uploadJson(response, 400, {
					error: { code: 'INVALID_UPLOAD', message: 'Upload headers or byte size do not match the presign.' },
					request_id: 'req-um131-upload-invalid'
				});
				return;
			}
			upload.bytes = bytes;
			upload.checksumSha256 = sha256(bytes);
			response.writeHead(200, {
				'access-control-allow-origin': UI_ORIGIN,
				etag: `"${upload.checksumSha256}"`,
				'content-length': 0
			});
			response.end();
		}
	},
	{
		method: 'OPTIONS',
		pattern: /^\/smoke-upload\/[^/]+$/,
		auth: false,
		handler: async (_request, response) => {
			response.writeHead(204, {
				'access-control-allow-origin': UI_ORIGIN,
				'access-control-allow-methods': 'PUT, OPTIONS',
				'access-control-allow-headers': 'content-type, content-length',
				'access-control-max-age': '300'
			});
			response.end();
		}
	}
];
