import { createHash } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
	ART_OCR,
	ART_PAGE_1_OCR,
	ART_PAGE_2_OCR,
	AUD_OBJECT_ID,
	DOC_OBJECT_ID,
	FILE_UPLOAD,
	IMG_OBJECT_ID,
	TOKEN,
	VID_OBJECT_ID,
	buildRoutes,
	createContext,
	isAuthenticated,
	sendBytes
} from './smoke-fixture-routes.mjs';
import { createFixtureServer } from './smoke-auth-fixture.mjs';

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

const fakeRequest = ({ url = '/', method = 'GET', headers = {}, body, rawBody } = {}) => ({
	url,
	method,
	headers,
	resume() {},
	once(_event, callback) {
		callback();
	},
	async *[Symbol.asyncIterator]() {
		if (rawBody !== undefined) yield Buffer.from(rawBody);
		else if (body !== undefined) yield Buffer.from(JSON.stringify(body));
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
		await findRoute(routes, 'POST', '/api/ingestions/B/files/presign').handler(
			fakeRequest({
				url: '/api/ingestions/B/files/presign',
				body: { filename: 'fixture.txt', content_type: 'text/plain', size_bytes: 7 }
			}),
			response
		);
		expect(response.statusCode).toBe(201);
		const payload = parseBody(response);
		expect(new Date(payload.expires_at).getTime()).toBeGreaterThan(Date.now());
		expect(payload.headers).toEqual({ 'content-type': 'text/plain', 'content-length': '7' });
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
		expect(response.headers).toMatchObject({
			'content-type': 'text/plain',
			'content-range': 'bytes */16',
			'accept-ranges': 'bytes',
			'content-length': 0
		});
		expect(response.headers.etag).toBeDefined();
		expect(response.headers['last-modified']).toBeDefined();
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

	it('honors a current If-Range date and ignores a stale date', async () => {
		const current = fakeResponse();
		sendBytes(
			current,
			bytes,
			'text/plain',
			fakeRequest({ headers: { range: 'bytes=0-3', 'if-range': 'Fri, 14 Aug 2026 12:00:00 GMT' } })
		);
		expect(current.statusCode).toBe(206);

		const stale = fakeResponse();
		sendBytes(
			stale,
			bytes,
			'text/plain',
			fakeRequest({ headers: { range: 'bytes=0-3', 'if-range': 'Wed, 12 Aug 2026 12:00:00 GMT' } })
		);
		expect(stale.statusCode).toBe(200);
	});

	it('serves 200 without a range header', async () => {
		const response = fakeResponse();
		sendBytes(response, bytes, 'text/plain', fakeRequest({ headers: {} }));
		expect(response.statusCode).toBe(200);
		expect(response.headers.etag).toBeDefined();
	});

	it('ignores malformed and multiple ranges', () => {
		for (const range of ['bytes=-', 'bytes=0-1,4-5']) {
			const response = fakeResponse();
			sendBytes(response, bytes, 'text/plain', fakeRequest({ headers: { range } }));
			expect(response.statusCode, range).toBe(200);
			expect(response.body).toEqual(bytes);
		}
	});
});

describe('fixture artifact association', () => {
	const context = createContext();
	const routes = buildRoutes(context);

	it('serves an artifact that belongs to its object', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
			fakeRequest({ url: `/api/objects/${DOC_OBJECT_ID}/artifacts/${ART_OCR}/view` }),
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
			fakeRequest({ url: `/api/objects/${AUD_OBJECT_ID}/artifacts/${ART_OCR}/view` }),
			response
		);
		expect(response.statusCode).toBe(404);
	});

	it('rejects an unknown object with 404', async () => {
		const response = fakeResponse();
		await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
			fakeRequest({ url: `/api/objects/OBJ-UNKNOWN/artifacts/${ART_OCR}/view` }),
			response
		);
		expect(response.statusCode).toBe(404);
	});

	it('serves distinct per-page OCR artifacts only for their document', async () => {
		for (const artifactId of [ART_PAGE_1_OCR, ART_PAGE_2_OCR]) {
			const owned = fakeResponse();
			await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
				fakeRequest({ url: `/api/objects/${DOC_OBJECT_ID}/artifacts/${artifactId}/view` }),
				owned
			);
			expect(owned.statusCode, artifactId).toBe(200);
			expect(owned.headers['content-type'], artifactId).toBe('text/plain');

			const crossObject = fakeResponse();
			await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
				fakeRequest({ url: `/api/objects/${AUD_OBJECT_ID}/artifacts/${artifactId}/view` }),
				crossObject
			);
			expect(crossObject.statusCode, artifactId).toBe(404);
		}
	});
});

describe('fixture publication-status filtering', () => {
	const context = createContext();
	const routes = buildRoutes(context);
	const route = findRoute(routes, 'GET', '/api/archive-requests');
	const objectRoute = findRoute(routes, 'GET', `/api/objects/${DOC_OBJECT_ID}/curation-publication`);

	it('returns the active-first object publication contract', async () => {
		const response = fakeResponse();
		await objectRoute.handler(
			fakeRequest({ url: `/api/objects/${DOC_OBJECT_ID}/curation-publication` }),
			response
		);
		expect(response.statusCode).toBe(200);
		expect(parseBody(response)).toMatchObject({
			object_id: DOC_OBJECT_ID,
			request: {
				status: 'COMPLETED',
				publication_revision: 5,
				target_version: '20260814'
			}
		});
	});

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
				url: '/api/archive-requests?action_type=curation_apply&target_type=object&target_id=OBJ-20260814-OTH001'
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

	it('validates supported enum, boolean, pagination, and target filters', async () => {
		for (const query of [
			'action_type=unknown',
			'status=WAITING',
			'active_only=yes',
			'limit=201',
			'cursor=',
			'status=',
			'target_id=OBJ-20260814-DOC001',
			'target_type=object&target_id=invalid',
			'unsupported=value'
		]) {
			const response = fakeResponse();
			await route.handler(fakeRequest({ url: `/api/archive-requests?${query}` }), response);
			expect(response.statusCode, query).toBe(400);
		}
	});

	it('applies active_only ahead of explicit statuses', async () => {
		const response = fakeResponse();
		await route.handler(
			fakeRequest({ url: '/api/archive-requests?active_only=true&status=COMPLETED' }),
			response
		);
		expect(parseBody(response).requests.map((request) => request.status)).toEqual(['PROCESSING']);
	});
});

describe('fixture upload sequence', () => {
	it('rejects an upload that was not presigned', async () => {
		const routes = buildRoutes(createContext());
		const response = fakeResponse();
		await findRoute(routes, 'PUT', '/smoke-upload/F').handler(
			fakeRequest({ method: 'PUT', url: '/smoke-upload/unknown-token' }),
			response
		);
		expect(response.statusCode).toBe(404);
		expect(response.headers['access-control-allow-origin']).toBeDefined();
	});

	it('rejects a commit for an unpresigned file', async () => {
		const routes = buildRoutes(createContext());
		const response = fakeResponse();
		await findRoute(routes, 'POST', '/api/ingestions/B/files/commit').handler(
			fakeRequest({ url: '/api/ingestions/B/files/commit', body: { file_id: 'unknown-file' } }),
			response
		);
		expect(response.statusCode).toBe(400);
	});
});

describe('fixture HTTP integration', () => {
	const context = createContext();
	let now = Date.parse('2026-08-20T12:00:00.000Z');
	const server = createFixtureServer({ context, routeOptions: { now: () => now } });
	let baseUrl;

	beforeAll(async () => {
		context.activeTokens.add(TOKEN);
		await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
		const address = server.address();
		baseUrl = `http://127.0.0.1:${address.port}`;
	});

	afterAll(async () => {
		await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
	});

	const authHeaders = { authorization: `Bearer ${TOKEN}` };
	const presign = async (filename, bytes, contentType = 'text/plain') => {
		const response = await fetch(`${baseUrl}/api/ingestions/B/files/presign`, {
			method: 'POST',
			headers: { ...authHeaders, 'content-type': 'application/json' },
			body: JSON.stringify({ filename, content_type: contentType, size_bytes: bytes.length })
		});
		expect(response.status).toBe(201);
		return response.json();
	};

	it('runs unique presign, upload, commit, expiry, CORS, and delete lifecycles over HTTP', async () => {
		expect(server.listening).toBe(true);
		const bytes = Buffer.from('actual fixture bytes', 'utf8');
		const checksum = createHash('sha256').update(bytes).digest('hex');
		const first = await presign('first.txt', bytes);
		const second = await presign('second.txt', bytes);
		expect(first.file_id).toBe(FILE_UPLOAD);
		expect(second.file_id).not.toBe(first.file_id);
		expect(second.upload_url).not.toBe(first.upload_url);
		expect(first.headers).toEqual({
			'content-type': 'text/plain',
			'content-length': String(bytes.length)
		});
		expect(first.expires_at).toBe('2026-08-20T13:00:00.000Z');

		const commitBeforePut = await fetch(`${baseUrl}/api/ingestions/B/files/commit`, {
			method: 'POST',
			headers: { ...authHeaders, 'content-type': 'application/json' },
			body: JSON.stringify({ file_id: first.file_id, checksum_sha256: checksum })
		});
		expect(commitBeforePut.status).toBe(409);

		const upload = await fetch(first.upload_url, {
			method: 'PUT',
			headers: { 'content-type': first.headers['content-type'] },
			body: bytes
		});
		expect(upload.status).toBe(200);
		expect(upload.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:4600');
		expect(upload.headers.get('etag')).toBe(`"${checksum}"`);

		const commit = await fetch(`${baseUrl}/api/ingestions/B/files/commit`, {
			method: 'POST',
			headers: { ...authHeaders, 'content-type': 'application/json' },
			body: JSON.stringify({ file_id: first.file_id, checksum_sha256: checksum })
		});
		expect(commit.status).toBe(200);
		expect((await commit.json()).file).toMatchObject({
			file_id: first.file_id,
			size_bytes: bytes.length,
			checksum_sha256: checksum,
			status: 'UPLOADED'
		});
		const deleted = await fetch(`${baseUrl}/api/ingestions/B/files/${first.file_id}`, {
			method: 'DELETE',
			headers: authHeaders
		});
		expect(deleted.status).toBe(200);
		expect(await deleted.json()).toEqual({ status: 'deleted', file_id: first.file_id });
		expect((await fetch(first.upload_url, { method: 'PUT', body: bytes })).status).toBe(404);

		const checksumCase = await presign('checksum.txt', bytes);
		expect(
			(
				await fetch(checksumCase.upload_url, {
					method: 'PUT',
					headers: { 'content-type': checksumCase.headers['content-type'] },
					body: bytes
				})
			).status
		).toBe(200);
		const checksumMismatch = await fetch(`${baseUrl}/api/ingestions/B/files/commit`, {
			method: 'POST',
			headers: { ...authHeaders, 'content-type': 'application/json' },
			body: JSON.stringify({ file_id: checksumCase.file_id, checksum_sha256: '0'.repeat(64) })
		});
		expect(checksumMismatch.status).toBe(409);

		const preflight = await fetch(second.upload_url, { method: 'OPTIONS' });
		expect(preflight.status).toBe(204);
		expect(preflight.headers.get('access-control-allow-methods')).toBe('PUT, OPTIONS');
		expect(preflight.headers.get('access-control-allow-headers')).toContain('content-length');

		now += 3_600_000;
		const expired = await fetch(second.upload_url, {
			method: 'PUT',
			headers: { 'content-type': second.headers['content-type'] },
			body: bytes
		});
		expect(expired.status).toBe(403);
		expect(expired.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:4600');
	});
});

describe('fixture backend contract values', () => {
	const routes = buildRoutes(createContext());

	it('uses the verified capability and resync enums', async () => {
		const capabilities = fakeResponse();
		await findRoute(routes, 'GET', '/api/ingestions/capabilities').handler(fakeRequest(), capabilities);
		expect(parseBody(capabilities).media_kinds).toEqual(['image', 'audio', 'video', 'document']);

		const resync = fakeResponse();
		await findRoute(routes, 'POST', '/api/objects/O/resync').handler(
			fakeRequest({ url: `/api/objects/${DOC_OBJECT_ID}/resync` }),
			resync
		);
		expect(parseBody(resync).request.action_type).toBe('object_resync');
	});

	it('keeps artifact IDs unique and metadata sizes equal to served bytes', async () => {
		const objectIds = [DOC_OBJECT_ID, IMG_OBJECT_ID, AUD_OBJECT_ID, VID_OBJECT_ID];
		const artifactIds = [];
		const thumbnailIds = [];
		for (const objectId of objectIds) {
			const detail = fakeResponse();
			await findRoute(routes, 'GET', '/api/objects/O').handler(
				fakeRequest({ url: `/api/objects/${objectId}` }),
				detail
			);
			const listing = fakeResponse();
			await findRoute(routes, 'GET', '/api/objects/O/artifacts').handler(
				fakeRequest({ url: `/api/objects/${objectId}/artifacts` }),
				listing
			);
			const artifacts = parseBody(listing).artifacts;
			const thumbnailId = parseBody(detail).object.thumbnail_artifact_id;
			thumbnailIds.push(thumbnailId);
			expect(artifacts.some((artifact) => artifact.id === thumbnailId)).toBe(true);
			for (const artifact of artifacts) {
				artifactIds.push(artifact.id);
				const content = fakeResponse();
				await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/view').handler(
					fakeRequest({ url: `/api/objects/${objectId}/artifacts/${artifact.id}/view` }),
					content
				);
				expect(content.body.length).toBe(artifact.size_bytes);
				expect(Number(content.headers['content-length'])).toBe(artifact.size_bytes);
			}
		}
		expect(new Set(artifactIds).size).toBe(artifactIds.length);
		expect(new Set(thumbnailIds).size).toBe(thumbnailIds.length);
	});

	it('only applies byte ranges to artifact view endpoints', async () => {
		const download = fakeResponse();
		await findRoute(routes, 'GET', '/api/objects/O/artifacts/A/download').handler(
			fakeRequest({
				url: `/api/objects/${DOC_OBJECT_ID}/artifacts/${ART_OCR}/download`,
				headers: { range: 'bytes=0-3' }
			}),
			download
		);
		expect(download.statusCode).toBe(200);
		expect(download.headers['accept-ranges']).toBeUndefined();
		expect(download.headers['content-disposition']).toMatch(/^attachment;/);

		const preview = fakeResponse();
		await findRoute(routes, 'GET', '/api/ingestions/B/files/F/preview').handler(
			fakeRequest({ url: '/api/ingestions/B/files/F/preview', headers: { range: 'bytes=0-3' } }),
			preview
		);
		expect(preview.statusCode).toBe(200);
		expect(preview.headers['accept-ranges']).toBeUndefined();
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
