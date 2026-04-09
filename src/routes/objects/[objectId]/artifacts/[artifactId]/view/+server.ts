import { env } from '$env/dynamic/private';
import { backendErrorSchema } from '$lib/api/schemas/errors';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
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

	const backendPath = `/api/objects/${encodeURIComponent(objectId)}/artifacts/${encodeURIComponent(artifactId)}/view`;
	const response = await fetch(`${getApiBase()}${backendPath}`, {
		method: 'GET',
		headers: {
			authorization: `Bearer ${token}`
		}
	});

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
			message: backendMessage ?? 'Failed to view artifact.'
		});
	}

	const headers = new Headers();
	const contentType = response.headers.get('content-type');
	const contentLength = response.headers.get('content-length');
	const contentDisposition = response.headers.get('content-disposition');

	if (contentType) headers.set('content-type', contentType);
	if (contentLength) headers.set('content-length', contentLength);
	if (contentDisposition) headers.set('content-disposition', contentDisposition);

	return new Response(response.body, {
		status: 200,
		headers
	});
};
