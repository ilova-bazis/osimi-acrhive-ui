import {
	mutationErrorCodeForResponse,
	isMutationErrorCode,
	type MutationErrorCode
} from '$lib/services/mutationErrors';
import { formatCount } from './format';
import { formatTemplate, translate } from './translate';
import type { LocaleKey, TranslationDictionary, TranslationKey } from './translations';

/**
 * Maps stable mutation error codes onto localized copy.
 *
 * Keys live under `mutationErrors.*` so every surface shares one wording.
 */
export const mutationErrorKeys: Record<MutationErrorCode, TranslationKey> = {
	unauthorized: 'mutationErrors.unauthorized',
	forbidden: 'mutationErrors.forbidden',
	notFound: 'mutationErrors.notFound',
	locked: 'mutationErrors.locked',
	conflict: 'mutationErrors.conflict',
	rateLimited: 'mutationErrors.rateLimited',
	invalidPayload: 'mutationErrors.invalidPayload',
	incompatibleCapability: 'mutationErrors.incompatibleCapability',
	requestFailed: 'mutationErrors.requestFailed',
	unexpected: 'mutationErrors.unexpected',
	invalidAttempt: 'mutationErrors.invalidAttempt',
	invalidItemKind: 'mutationErrors.invalidItemKind',
	invalidClassificationType: 'mutationErrors.invalidClassificationType',
	incompatibleClassificationType: 'mutationErrors.incompatibleClassificationType',
	invalidPipelinePreset: 'mutationErrors.invalidPipelinePreset',
	incompatiblePipelinePreset: 'mutationErrors.incompatiblePipelinePreset',
	invalidAccessLevel: 'mutationErrors.invalidAccessLevel',
	creationFailed: 'mutationErrors.creationFailed'
};

/**
 * Failures that carry no specific wording of their own.
 *
 * For these the caller-supplied fallback is used, because an operation-specific
 * sentence such as "Failed to delete ingestion" carries more context than a generic
 * "the request could not be completed".
 */
const genericMutationErrorCodes: ReadonlySet<MutationErrorCode> = new Set([
	'requestFailed',
	'unexpected',
	'creationFailed'
]);

export type MutationErrorPayload = {
	/** Stable code the UI can translate. */
	code: MutationErrorCode;
	/** Backend request identifier, when the server provided one. */
	requestId: string | null;
	/**
	 * True when the server named the failure explicitly.
	 *
	 * An explicit code means the server knows exactly what went wrong, so its wording
	 * wins. An inferred code only reflects the response status, so the caller's
	 * operation-specific fallback is used instead.
	 *
	 * The bare HTTP status 429 also counts as explicit: it unambiguously means rate
	 * limiting, and the wait-and-retry guidance is too important to hide behind an
	 * operation-specific fallback.
	 */
	explicit: boolean;
};

const readString = (value: unknown): string | null =>
	typeof value === 'string' && value.length > 0 ? value : null;

const readRequestId = (payload: unknown): string | null => {
	if (!payload || typeof payload !== 'object') return null;
	const record = payload as Record<string, unknown>;
	return readString(record.requestId) ?? readString(record.request_id);
};

/**
 * Reads the stable error code from an already-parsed response body.
 *
 * The server may answer with an explicit `errorCode`, or with a body that carries only
 * a status. In every case a stable code is returned so the caller can render localized
 * copy instead of the raw response text.
 *
 * A bare HTTP 429 is treated as an explicitly named failure, because that status alone
 * identifies rate limiting.
 */
export const readMutationErrorPayloadFromBody = (
	payload: unknown,
	status: number
): MutationErrorPayload => {
	const explicitCode =
		payload && typeof payload === 'object'
			? (payload as Record<string, unknown>).errorCode
			: undefined;

	const serverNamed = isMutationErrorCode(explicitCode);
	const explicit = serverNamed || status === 429;
	const code = serverNamed ? explicitCode : mutationErrorCodeForResponse(status);

	return { code, requestId: readRequestId(payload), explicit };
};

/**
 * Reads the stable error code from a failed mutation response.
 */
export const readMutationErrorPayload = async (
	response: Response
): Promise<MutationErrorPayload> => {
	const payload = await response.json().catch(() => null);
	return readMutationErrorPayloadFromBody(payload, response.status);
};

/**
 * Renders a localized message for a mutation failure.
 *
 * Raw server text never reaches the user. When the server named the failure, the
 * shared wording for that code is used; otherwise the caller's operation-specific
 * fallback is kept.
 */
export const localizeMutationError = (
	dictionary: TranslationDictionary,
	payload: MutationErrorPayload,
	fallback: string
): string => {
	const useSpecificWording =
		payload.explicit && !genericMutationErrorCodes.has(payload.code);

	const message = useSpecificWording
		? translate(dictionary, mutationErrorKeys[payload.code])
		: fallback;

	if (!payload.requestId) return message;
	return formatTemplate(translate(dictionary, 'mutationErrors.withRequest'), {
		message,
		id: payload.requestId
	});
};

/**
 * A parameter value for a localized message template.
 *
 * Text values are user content and stay verbatim. Labels are resolved from the active
 * dictionary at render time so they retranslate. Counts are formatted with the active
 * locale's number formatting.
 */
export type MessageParam =
	| { kind: 'text'; value: string }
	| { kind: 'count'; value: number }
	| { kind: 'label'; key: TranslationKey; lower?: boolean };

/**
 * A failure or notice kept in component state as a message descriptor.
 *
 * Storing the descriptor instead of a rendered sentence lets the message retranslate
 * when the visitor switches language while it is still visible.
 */
export type LocalizedMessageState = {
	key: TranslationKey;
	params?: Record<string, MessageParam>;
	/** Structured server failure; when present, its specific wording may win. */
	failure?: MutationErrorPayload;
};

/**
 * An exception carrying a {@link LocalizedMessageState}.
 *
 * Throwing this across internal await boundaries keeps the failure structured until a
 * catch site stores it, so arbitrary `Error.message` text never reaches the user.
 */
export class StructuredFailureError extends Error {
	state: LocalizedMessageState;

	constructor(state: LocalizedMessageState) {
		super(state.key);
		this.name = 'StructuredFailureError';
		this.state = state;
	}
}

const resolveMessageParams = (
	dictionary: TranslationDictionary,
	locale: LocaleKey,
	params: Record<string, MessageParam> | undefined
): Record<string, string> => {
	const resolved: Record<string, string> = {};
	for (const [name, param] of Object.entries(params ?? {})) {
		if (param.kind === 'text') {
			resolved[name] = param.value;
		} else if (param.kind === 'count') {
			resolved[name] = formatCount(param.value, locale);
		} else {
			const label = translate(dictionary, param.key);
			resolved[name] = param.lower ? label.toLowerCase() : label;
		}
	}
	return resolved;
};

/**
 * Renders a {@link LocalizedMessageState} against the active dictionary.
 */
export const renderLocalizedMessage = (
	dictionary: TranslationDictionary,
	locale: LocaleKey,
	state: LocalizedMessageState
): string => {
	const resolved = resolveMessageParams(dictionary, locale, state.params);
	const template = translate(dictionary, state.key);
	const hasParams = Object.keys(resolved).length > 0;
	const fallback = hasParams ? formatTemplate(template, resolved) : template;

	if (!state.failure) return fallback;
	return localizeMutationError(dictionary, state.failure, fallback);
};
