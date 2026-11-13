import { json } from '@sveltejs/kit';

import {
	mutationErrorCodeForResponse,
	type MutationErrorCode
} from '$lib/services/mutationErrors';

/**
 * Builds a failed mutation response that carries a stable, translatable error code.
 *
 * The `error` field stays as a diagnostic string for logs and support tooling. The UI
 * must render `errorCode` so that every locale shows the same message.
 */
export const mutationErrorResponse = (
	status: number,
	code: MutationErrorCode,
	error: string,
	extra: Record<string, unknown> = {}
): Response => json({ error, errorCode: code, ...extra }, { status });

/**
 * Builds a failed mutation response for an upstream backend failure.
 *
 * The backend status and code are mapped onto a stable mutation error code so the UI
 * never has to interpret backend vocabulary.
 */
export const mutationBackendErrorResponse = (
	status: number,
	backendCode: string | null | undefined,
	error: string,
	extra: Record<string, unknown> = {}
): Response =>
	mutationErrorResponse(
		status,
		mutationErrorCodeForResponse(status, backendCode),
		error,
		extra
	);
