import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const getApiBase = (): string =>
	env.PRIVATE_API_BASE || env.PUBLIC_API_BASE || 'http://localhost:3000';

export const GET: RequestHandler = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		return new Response(null, { status: 401 });
	}

	const backendUrl = `${getApiBase()}/api/ingestions/${encodeURIComponent(params.batchId)}/files/${encodeURIComponent(params.fileId)}/preview`;

	let response: Response;
	try {
		response = await fetch(backendUrl, {
			headers: { Authorization: `Bearer ${token}` }
		});
	} catch {
		return new Response(null, { status: 502 });
	}

	if (!response.ok) {
		return new Response(null, { status: response.status });
	}

	const body = await response.arrayBuffer();
	const contentType = response.headers.get('content-type') ?? 'application/octet-stream';

	return new Response(body, {
		headers: {
			'content-type': contentType,
			'cache-control': 'private, max-age=300'
		}
	});
};
