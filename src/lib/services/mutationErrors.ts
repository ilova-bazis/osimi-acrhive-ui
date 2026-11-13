/**
 * Stable error codes shared by mutation endpoints and the browser UI.
 *
 * Mutation endpoints return one of these codes in the `errorCode` response field so the
 * client can render a localized message. The human-readable `error` field is kept for
 * diagnostics only and must never be shown to the user as-is.
 */
export const mutationErrorCodes = [
	'unauthorized',
	'forbidden',
	'notFound',
	'locked',
	'conflict',
	'rateLimited',
	'invalidPayload',
	'incompatibleCapability',
	'requestFailed',
	'unexpected',
	'invalidAttempt',
	'invalidItemKind',
	'invalidClassificationType',
	'incompatibleClassificationType',
	'invalidPipelinePreset',
	'incompatiblePipelinePreset',
	'invalidAccessLevel',
	'creationFailed'
] as const;

export type MutationErrorCode = (typeof mutationErrorCodes)[number];

export const isMutationErrorCode = (value: unknown): value is MutationErrorCode =>
	typeof value === 'string' && (mutationErrorCodes as readonly string[]).includes(value);

/**
 * Maps a backend response status and code onto a stable mutation error code.
 *
 * The status is authoritative because it is always present; the backend code only
 * refines the outcome when the status is ambiguous.
 */
export const mutationErrorCodeForResponse = (
	status: number,
	backendCode?: string | null
): MutationErrorCode => {
	if (backendCode === 'LOCKED' || status === 423) return 'locked';
	if (backendCode === 'REVISION_CONFLICT' || backendCode === 'PUBLICATION_ALREADY_ACTIVE') {
		return 'conflict';
	}
	if (backendCode === 'CONFLICT' || status === 409) return 'conflict';
	if (backendCode === 'RATE_LIMITED' || status === 429) return 'rateLimited';
	if (backendCode === 'VALIDATION_FAILED' || status === 400 || status === 422) {
		return 'invalidPayload';
	}
	if (backendCode === 'NOT_FOUND' || status === 404) return 'notFound';
	if (backendCode === 'FORBIDDEN' || status === 403) return 'forbidden';
	if (backendCode === 'UNAUTHORIZED' || status === 401) return 'unauthorized';
	if (status === 0) return 'requestFailed';
	if (status >= 500) return 'requestFailed';
	return 'unexpected';
};
