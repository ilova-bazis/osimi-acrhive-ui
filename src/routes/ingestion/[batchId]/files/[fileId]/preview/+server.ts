import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import {
	isSafePreviewMediaType,
	NO_STORE_CACHE_CONTROL,
	normalizeMediaType,
	PREVIEW_CONTENT_SECURITY_POLICY
} from '$lib/server/mediaResponses';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const getApiBase = (): string =>
	env.PRIVATE_API_BASE || env.PUBLIC_API_BASE || 'http://localhost:3000';

const proxyPreview: RequestHandler = async ({ params, locals, cookies, fetch, request }) => {
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

	const contentType = normalizeMediaType(response.headers.get('content-type'));
	if (!isSafePreviewMediaType(contentType)) {
		await response.body?.cancel();
		return new Response(null, { status: 415 });
	}

	const headers = new Headers({
		'cache-control': NO_STORE_CACHE_CONTROL,
		'content-disposition': 'inline',
		'content-security-policy': PREVIEW_CONTENT_SECURITY_POLICY,
		'content-type': contentType,
		'x-content-type-options': 'nosniff'
	});
	const contentLength = response.headers.get('content-length');
	if (contentLength) headers.set('content-length', contentLength);

	if (request.method === 'HEAD') {
		await response.body?.cancel();
		return new Response(null, { headers });
	}

	return new Response(response.body, { headers });
};

export const GET = proxyPreview;
export const HEAD = proxyPreview;
