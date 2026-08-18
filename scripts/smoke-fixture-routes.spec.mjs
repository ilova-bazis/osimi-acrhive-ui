import { describe, expect, it } from 'vitest';

import {
	AUD_OBJECT_ID,
	DOC_OBJECT_ID,
	FILE_UPLOAD,
	TOKEN,
	buildRoutes,
	createContext,
	isAuthenticated,
	sendBytes
} from './smoke-fixture-routes.mjs';

const fakeResponse = () => {
	const response = {
		statusCode: null,
		headers: {},
		body: Buffer.alloc(0),
		writeHead(status, headers) {
			response.statusCode = status;
			Object.assign(response.headers, headers);
		},
		end(body) {
			response.body = body ?? Buffer.alloc(0);
		}
	};
	return response;
};

const fakeRequest = ({ url = '/', method = 'GET', headers = {}, body } = {}) => ({
	url,
	method,
	headers,
	resume() {},
	once(_event, callback) {
		callback();
	},
	async *[Symbol.asyncIterator]() {
		if (body !== undefined) yield Buffer.from(JSON.stringify(body));
	}
});

const findRoute = (routes, method, pathname) =>
	routes.find((route) => route.method === method && route.pattern.test(pathname));

const parseBody = (response) => JSON.parse(response.body.toString('utf8'));

describe('fixture route methods and statuses', () => {
	const context = createContext();
	const routes = buildRoutes(context);

	it('serves item reorder via PATCH, not POST', () => {
		expect(findRoute(routes, 'PATCH', '/api/ingestions/B/items/order')).toBeDefined();
		expect(findRoute(routes, 'POST', '/api/ingestions/B/items/order')).toBeUndefined();
	});

	it('serves item-file reorder via PATCH, not POST', () => {
		expect(findRoute(routes, 'PATCH', '/api/ingestions/B/items/I/files/order')).toBeDefined();
		expect(findRoute(routes, 'POST', '/api/ingestions/B/items/I/files/order')).toBeUndefined();
	});

	it('returns 201 for ingestion creation', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'POST', '/api/ingestions').handler(fakeRequest({ method: 'POST' }), response);
		expect(response.statusCode).toBe(201);
	});

	it('returns 201 for item creation', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'POST', '/api/ingestions/B/items').handler(fakeRequest(), response);
		expect(response.statusCode).toBe(201);
	});

	it('returns 201 for item-file attachment', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'POST', '/api/ingestions/B/items/I/files').handler(fakeRequest(), response);
		expect(response.statusCode).toBe(201);
	});

	it('returns 201 for presign with a fresh expiry', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'POST', '/api/ingestions/B/files/presign').handler(fakeRequest(), response);
		expect(response.statusCode).toBe(201);
		const payload = parseBody(response);
		expect(new Date(payload.expires_at).getTime()).toBeGreaterThan(Date.now());
	});
});

describe('fixture byte serving', () => {
	const bytes = Buffer.from('0123456789abcdef', 'utf8');

	it('serves the final N bytes for a suffix range', async () => {
		const response = fakeResponse();
		sendBytes(response, bytes, 'text/plain', fakeRequest({ headers: { range: 'bytes=-4' } }));
		expect(response.statusCode).toBe(206);
		expect(response.body.toString('utf8')).toBe('cdef');
		expect(response.headers['content-range']).toBe('bytes 12-15/16');
	});

	it('serves 416 for an unsatisfiable range', async () => {
		const response = fakeResponse();
		sendBytes(response, bytes, 'text/plain', fakeRequest({ headers: { range: 'bytes=999-' } }));
		expect(response.statusCode).toBe(416);
	});

	it('ignores the range when If-Range does not match the current etag', async () => {
		const response = fakeResponse();
		sendBytes(
			response,
			bytes,
			'text/plain',
			fakeRequest({ headers: { range: 'bytes=0-3', 'if-range': '"stale"' } })
		);
		expect(response.statusCode).toBe(200);
		expect(response.body.toString('utf8')).toBe('0123456789abcdef');
	});

	it('honors the range when If-Range matches', async () => {
		const baseline = fakeResponse();
		sendBytes(baseline, bytes, 'text/plain', fakeRequest({ headers: {} }));
		const etag = baseline.headers.etag;
		const response = fakeResponse();
		sendBytes(
			response,
			bytes,
			'text/plain',
			fakeRequest({ headers: { range: 'bytes=0-3', 'if-range': etag } })
		);
		expect(response.statusCode).toBe(206);
		expect(response.body.toString('utf8')).toBe('0123');
	});

	it('serves 200 without a range header', async () => {
		const response = fakeResponse();
		sendBytes(response, bytes, 'text/plain', fakeRequest({ headers: {} }));
		expect(response.statusCode).toBe(200);
		expect(response.headers.etag).toBeDefined();
	});
});

describe('fixture artifact association', () => {
	const context = createContext();
	const routes = buildRoutes(context);

	it('serves an artifact that belongs to its object', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
			fakeRequest({ url: `/api/objects/${DOC_OBJECT_ID}/artifacts/artifact-um98-ocr/view` }),
			response
		);
		expect(response.statusCode).toBe(200);
		expect(response.headers['content-type']).toBe('text/plain');
	});

	it('rejects an unknown artifact id with 404', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
			fakeRequest({ url: `/api/objects/${DOC_OBJECT_ID}/artifacts/not-a-real-artifact/view` }),
			response
		);
		expect(response.statusCode).toBe(404);
	});

	it('rejects a cross-object artifact reference with 404', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
			fakeRequest({ url: `/api/objects/${AUD_OBJECT_ID}/artifacts/artifact-um98-ocr/view` }),
			response
		);
		expect(response.statusCode).toBe(404);
	});

	it('rejects an unknown object with 404', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
			fakeRequest({ url: '/api/objects/OBJ-UNKNOWN/artifacts/artifact-um98-ocr/view' }),
			response
		);
		expect(response.statusCode).toBe(404);
	});
});

describe('fixture publication-status filtering', () => {
	const context = createContext();
	const routes = buildRoutes(context);
	const route = findRoute(routes, 'GET', '/api/archive-requests');

	it('returns the completed request for the document target', async () => {
		const response = fakeResponse();
		await route.handler(
			fakeRequest({
				url: `/api/archive-requests?action_type=curation_apply&target_type=object&target_id=${DOC_OBJECT_ID}`
			}),
			response
		);
		expect(response.statusCode).toBe(200);
		expect(parseBody(response).requests).toHaveLength(1);
	});

	it('returns no request for a different target id', async () => {
		const response = fakeResponse();
		await route.handler(
			fakeRequest({
				url: '/api/archive-requests?action_type=curation_apply&target_type=object&target_id=OBJ-OTHER'
			}),
			response
		);
		expect(parseBody(response).requests).toHaveLength(0);
	});

	it('returns no request for a non-object target type', async () => {
		const response = fakeResponse();
		await route.handler(
			fakeRequest({
				url: `/api/archive-requests?action_type=curation_apply&target_type=ingestion&target_id=${DOC_OBJECT_ID}`
			}),
			response
		);
		expect(parseBody(response).requests).toHaveLength(0);
	});
});

describe('fixture upload sequence', () => {
	const context = createContext();
	const routes = buildRoutes(context);

	it('rejects an upload that was not presigned', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'PUT', '/smoke-upload/F').handler(
			fakeRequest({ method: 'PUT', url: `/smoke-upload/${FILE_UPLOAD}` }),
			response
		);
		expect(response.statusCode).toBe(404);
	});

	it('rejects a commit for an unpresigned file', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'POST', '/api/ingestions/B/files/commit').handler(
			fakeRequest({ body: { file_id: 'unknown-file' } }),
			response
		);
		expect(response.statusCode).toBe(400);
	});

	it('accepts upload and commit after presign', async () => {
		const presign = fakeResponse();
		await findRoute(routes, 'POST', '/api/ingestions/B/files/presign').handler(fakeRequest(), presign);
		expect(presign.statusCode).toBe(201);

		const upload = fakeResponse();
		await findRoute(routes, 'PUT', '/smoke-upload/F').handler(
			fakeRequest({ method: 'PUT', url: `/smoke-upload/${FILE_UPLOAD}` }),
			upload
		);
		expect(upload.statusCode).toBe(200);

		const commit = fakeResponse();
		await findRoute(routes, 'POST', '/api/ingestions/B/files/commit').handler(
			fakeRequest({ body: { file_id: FILE_UPLOAD } }),
			commit
		);
		expect(commit.statusCode).toBe(200);
		expect(parseBody(commit).file.file_id).toBe(FILE_UPLOAD);
		expect(context.committedUploads.has(FILE_UPLOAD)).toBe(true);
	});
});

describe('fixture auth lifecycle', () => {
	const context = createContext();
	const routes = buildRoutes(context);

	it('activates the token after a valid login and clears it on logout', async () => {
		expect(isAuthenticated(context, fakeRequest({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(
			false
		);

		const login = fakeResponse();
		await findRoute(routes, 'POST', '/api/auth/login').handler(
			fakeRequest({ body: { username: 'smoke-archiver', password: 'um98-smoke-password' } }),
			login
		);
		expect(login.statusCode).toBe(200);
		expect(isAuthenticated(context, fakeRequest({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(
			true
		);

		const logout = fakeResponse();
		await findRoute(routes, 'POST', '/api/auth/logout').handler(
			fakeRequest({ headers: { authorization: `Bearer ${TOKEN}` } }),
			logout
		);
		expect(logout.statusCode).toBe(200);
		expect(isAuthenticated(context, fakeRequest({ headers: { authorization: `Bearer ${TOKEN}` } }))).toBe(
			false
		);
	});

	it('rejects invalid credentials with 401', async () => {
		const login = fakeResponse();
		await findRoute(routes, 'POST', '/api/auth/login').handler(
			fakeRequest({ body: { username: 'smoke-archiver', password: 'wrong' } }),
			login
		);
		expect(login.statusCode).toBe(401);
	});
});
