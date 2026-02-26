import { ingestionCapabilitiesResponseSchema } from '$lib/api/schemas/ingestions';
import { backendRequest } from '$lib/server/apiClient';
import {
	DEFAULT_INGESTION_CAPABILITIES,
	type IngestionCapabilities,
	type IngestionCapabilitiesService,
	type IngestionMediaKind
} from './ingestionCapabilities';

const CAPABILITIES_PATH = '/api/ingestions/capabilities';

const VALID_KINDS: IngestionMediaKind[] = ['image', 'audio', 'video', 'document'];

const normalizeText = (value: string): string => value.trim().toLowerCase();

const unique = (values: string[]): string[] => Array.from(new Set(values));

const normalizeKind = (value: string): IngestionMediaKind | null => {
	const normalized = normalizeText(value);
	if (normalized === 'image' || normalized === 'audio' || normalized === 'video' || normalized === 'document') {
		return normalized;
	}
	return null;
};

const readExtensions = (
	raw: Record<string, string[]>,
	kind: IngestionMediaKind,
	fallback: string[]
): string[] => {
	const source = raw[kind] ?? fallback;
	return unique(
		source
			.map((value) => normalizeText(value).replace(/^\./, ''))
			.filter((value) => value.length > 0)
	);
};

const readMimes = (
	raw: Record<string, string[]> | undefined,
	kind: IngestionMediaKind,
	fallback: string[]
): string[] => {
	const source = raw?.[kind] ?? fallback;
	return unique(source.map(normalizeText).filter((value) => value.length > 0));
};

const normalizeCapabilities = (payload: {
	media_kinds: string[];
	extensions_by_kind: Record<string, string[]>;
	mime_by_kind?: Record<string, string[]>;
	mime_aliases?: Record<string, string>;
}): IngestionCapabilities => {
	const mediaKinds = unique(payload.media_kinds.map(normalizeKind).filter((kind): kind is IngestionMediaKind => kind !== null));

	const normalizedKinds = mediaKinds.length > 0 ? mediaKinds : DEFAULT_INGESTION_CAPABILITIES.mediaKinds;

	const extensionsByKind = {
		image: readExtensions(
			payload.extensions_by_kind,
			'image',
			DEFAULT_INGESTION_CAPABILITIES.extensionsByKind.image
		),
		audio: readExtensions(
			payload.extensions_by_kind,
			'audio',
			DEFAULT_INGESTION_CAPABILITIES.extensionsByKind.audio
		),
		video: readExtensions(
			payload.extensions_by_kind,
			'video',
			DEFAULT_INGESTION_CAPABILITIES.extensionsByKind.video
		),
		document: readExtensions(
			payload.extensions_by_kind,
			'document',
			DEFAULT_INGESTION_CAPABILITIES.extensionsByKind.document
		)
	};

	const mimeByKind = {
		image: readMimes(payload.mime_by_kind, 'image', DEFAULT_INGESTION_CAPABILITIES.mimeByKind.image),
		audio: readMimes(payload.mime_by_kind, 'audio', DEFAULT_INGESTION_CAPABILITIES.mimeByKind.audio),
		video: readMimes(payload.mime_by_kind, 'video', DEFAULT_INGESTION_CAPABILITIES.mimeByKind.video),
		document: readMimes(
			payload.mime_by_kind,
			'document',
			DEFAULT_INGESTION_CAPABILITIES.mimeByKind.document
		)
	};

	const mimeAliases = Object.fromEntries(
		Object.entries(payload.mime_aliases ?? DEFAULT_INGESTION_CAPABILITIES.mimeAliases)
			.map(([key, value]) => [normalizeText(key), normalizeText(value)])
			.filter(([key, value]) => key.length > 0 && value.length > 0)
	);

	return {
		mediaKinds: VALID_KINDS.filter((kind) => normalizedKinds.includes(kind)),
		extensionsByKind,
		mimeByKind,
		mimeAliases
	};
};

export const apiIngestionCapabilitiesService: IngestionCapabilitiesService = {
	getCapabilities: async ({ fetchFn, token }) => {
		const response = await backendRequest({
			fetchFn,
			path: CAPABILITIES_PATH,
			context: 'ingestions.capabilities',
			method: 'GET',
			token,
			responseSchema: ingestionCapabilitiesResponseSchema
		});

		return normalizeCapabilities(response);
	}
};
