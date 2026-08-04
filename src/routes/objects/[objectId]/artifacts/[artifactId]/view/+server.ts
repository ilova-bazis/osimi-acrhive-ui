import { env } from '$env/dynamic/private';
import { backendErrorSchema } from '$lib/api/schemas/errors';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import {
	isSafeInlineArtifactMediaType,
	NO_STORE_CACHE_CONTROL,
	normalizeMediaType
} from '$lib/server/mediaResponses';
import { error, redirect, type RequestEvent } from '@sveltejs/kit';

const getApiBase = (): string => env.PRIVATE_API_BASE || env.PUBLIC_API_BASE || 'http://localhost:3000';
const MEDIA_RESPONSE_STATUSES = new Set([200, 206, 416]);
const MEDIA_RESPONSE_HEADERS = [
	'content-type',
	'content-length',
	'content-range',
	'accept-ranges',
	'etag',
	'last-modified'
] as const;

const toPassthroughStatus = (status: number): number => {
	if (status === 400 || status === 403 || status === 404 || status === 409 || status === 423) {
		return status;
	}

	return 502;
};

const readBackendErrorMessage = async (response: Response): Promise<string | null> => {
	const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
	if (!contentType.includes('application/json')) {
		return null;
	}

	try {
		const payload = await response.json();
		const parsed = backendErrorSchema.safeParse(payload);
		if (!parsed.success) {
			return null;
		}

		return parsed.data.error?.message ?? null;
	} catch {
		return null;
	}
};

export const GET = async ({ params, locals, cookies, fetch, request }: RequestEvent) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		throw redirect(303, '/login');
	}

	const objectId = params.objectId;
	const artifactId = params.artifactId;
	if (!objectId || !artifactId) {
		throw error(404, {
			message: 'Artifact not found.'
		});
	}

	const backendPath = `/api/objects/${encodeURIComponent(objectId)}/artifacts/${encodeURIComponent(artifactId)}/view`;
	const backendHeaders = new Headers({ authorization: `Bearer ${token}` });
	const range = request.headers.get('range');
	const ifRange = request.headers.get('if-range');
	if (range) backendHeaders.set('range', range);
	if (ifRange) backendHeaders.set('if-range', ifRange);
	let response: Response;
	try {
		response = await fetch(`${getApiBase()}${backendPath}`, {
			method: 'GET',
			headers: backendHeaders
		});
	} catch {
		throw error(502, {
			message: 'Failed to view artifact.'
		});
	}

	if (response.status === 401) {
		clearSessionCookie(cookies);
		throw redirect(303, '/login');
	}

	if (response.status === 404) {
		throw error(404, {
			message: 'Artifact not found.'
		});
	}

	if (!MEDIA_RESPONSE_STATUSES.has(response.status)) {
		const backendMessage = await readBackendErrorMessage(response);
		throw error(toPassthroughStatus(response.status), {
			message: backendMessage ?? 'Failed to view artifact.'
		});
	}

	const headers = new Headers();
	const contentType = response.headers.get('content-type');
	const normalizedContentType = normalizeMediaType(contentType);

	if (!isSafeInlineArtifactMediaType(normalizedContentType)) {
		throw error(415, {
			message: 'Artifact content type cannot be viewed inline.'
		});
	}

	for (const headerName of MEDIA_RESPONSE_HEADERS) {
		const value = response.headers.get(headerName);
		if (value) headers.set(headerName, value);
	}
	headers.set('cache-control', NO_STORE_CACHE_CONTROL);
	headers.set('content-disposition', 'inline');
	headers.set('x-content-type-options', 'nosniff');
	headers.set('content-security-policy', "default-src 'none'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'unsafe-inline'");

	return new Response(response.body, {
		status: response.status,
		headers
	});
};
