import { env } from '$env/dynamic/private';
import { backendErrorSchema } from '$lib/api/schemas/errors';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import {
	createAttachmentDisposition,
	NO_STORE_CACHE_CONTROL,
	PREVIEW_CONTENT_SECURITY_POLICY
} from '$lib/server/mediaResponses';
import { error, redirect, type RequestEvent } from '@sveltejs/kit';

const getApiBase = (): string => env.PRIVATE_API_BASE || env.PUBLIC_API_BASE || 'http://localhost:3000';

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

export const GET = async ({ params, locals, cookies, fetch }: RequestEvent) => {
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

	const backendPath = `/api/objects/${encodeURIComponent(objectId)}/artifacts/${encodeURIComponent(artifactId)}/download`;
	let response: Response;
	try {
		response = await fetch(`${getApiBase()}${backendPath}`, {
			method: 'GET',
			headers: {
				authorization: `Bearer ${token}`
			}
		});
	} catch {
		throw error(502, {
			message: 'Failed to download artifact.'
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

	if (!response.ok) {
		const backendMessage = await readBackendErrorMessage(response);
		throw error(toPassthroughStatus(response.status), {
			message: backendMessage ?? 'Failed to download artifact.'
		});
	}

	const headers = new Headers();
	const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
	const contentLength = response.headers.get('content-length');
	const contentDisposition = response.headers.get('content-disposition');

	headers.set('cache-control', NO_STORE_CACHE_CONTROL);
	headers.set('content-disposition', createAttachmentDisposition(contentDisposition, artifactId));
	headers.set('content-security-policy', PREVIEW_CONTENT_SECURITY_POLICY);
	headers.set('content-type', contentType);
	if (contentLength) headers.set('content-length', contentLength);
	headers.set('x-content-type-options', 'nosniff');

	return new Response(response.body, {
		status: 200,
		headers
	});
};
