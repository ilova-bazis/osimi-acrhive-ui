const RASTER_IMAGE_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/avif'
]);

const INLINE_EXACT_TYPES = new Set([
	...RASTER_IMAGE_TYPES,
	'image/bmp',
	'image/tiff',
	'application/pdf',
	'text/plain',
	'text/vtt'
]);

export const NO_STORE_CACHE_CONTROL = 'private, no-store';
export const PREVIEW_CONTENT_SECURITY_POLICY =
	"default-src 'none'; base-uri 'none'; form-action 'none'; sandbox";

export const normalizeMediaType = (value: string | null): string | null => {
	if (!value) return null;
	const mediaType = value.split(';', 1)[0]?.trim().toLowerCase() ?? '';
	return mediaType || null;
};

export const isSafePreviewMediaType = (value: string | null): value is string =>
	value !== null && RASTER_IMAGE_TYPES.has(value);

export const isSafeInlineArtifactMediaType = (value: string | null): value is string =>
	value !== null &&
	( INLINE_EXACT_TYPES.has(value) || value.startsWith('audio/') || value.startsWith('video/') );

const sanitizeFilename = (value: string): string | null => {
	const filename = value
		.normalize('NFKC')
		.split(/[\\/]/)
		.at(-1)
		// eslint-disable-next-line no-control-regex
		?.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069"\\]/g, '')
		.trim()
		.replace(/[. ]+$/, '');

	if (!filename || filename === '.' || filename === '..') return null;
	return Array.from(filename).slice(0, 150).join('');
};

const decodeFilenameStar = (contentDisposition: string): string | null => {
	const match = /(?:^|;)\s*filename\*\s*=\s*([^;]+)/i.exec(contentDisposition);
	if (!match) return null;

	const value = match[1].trim().replace(/^"|"$/g, '');
	const encoded = /^utf-8''(.+)$/i.exec(value)?.[1];
	if (!encoded) return null;

	try {
		return sanitizeFilename(decodeURIComponent(encoded));
	} catch {
		return null;
	}
};

const readFilename = (contentDisposition: string): string | null => {
	const match = /(?:^|;)\s*filename\s*=\s*(?:"([^"]*)"|([^;\s]+))/i.exec(contentDisposition);
	return sanitizeFilename(match?.[1] ?? match?.[2] ?? '');
};

const toAsciiFilename = (filename: string): string => {
	const ascii = filename
		.replace(/[^\x20-\x7e]/g, '_')
		.replace(/["\\]/g, '')
		.trim()
		.replace(/[. ]+$/, '');
	return ascii && ascii !== '.' && ascii !== '..' ? ascii.slice(0, 150) : 'artifact-download';
};

const encodeRfc5987 = (filename: string): string =>
	encodeURIComponent(filename).replace(/[!'()*]/g, (character) =>
		`%${character.charCodeAt(0).toString(16).toUpperCase()}`
	);

export const createAttachmentDisposition = (
	contentDisposition: string | null,
	artifactId: string
): string => {
	const fallback = sanitizeFilename(`artifact-${artifactId}`) ?? 'artifact-download';
	const filename =
		(contentDisposition ? decodeFilenameStar(contentDisposition) : null) ??
		(contentDisposition ? readFilename(contentDisposition) : null) ??
		fallback;

	return `attachment; filename="${toAsciiFilename(filename)}"; filename*=UTF-8''${encodeRfc5987(filename)}`;
};
