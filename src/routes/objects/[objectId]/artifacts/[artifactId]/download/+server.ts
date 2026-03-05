import { env } from '$env/dynamic/private';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { error, redirect, type RequestEvent } from '@sveltejs/kit';

const getApiBase = (): string => env.PRIVATE_API_BASE || env.PUBLIC_API_BASE || 'http://localhost:3000';

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
		throw error(502, {
			message: 'Failed to download artifact.'
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
