import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'viewer' };

const makeEvent = (fetchMock: ReturnType<typeof vi.fn>, overrides: Record<string, unknown> = {}) =>
	({
		params: { objectId: 'OBJ-1', artifactId: 'artifact-1' },
		locals: { session },
		cookies: { get: () => 'token-1', delete: vi.fn() },
		fetch: fetchMock,
		request: new Request('https://ui.example.test/objects/OBJ-1/artifacts/artifact-1/view'),
		...overrides,
	}) as never;

describe('/objects/[objectId]/artifacts/[artifactId]/view +server', () => {
	it('returns safe inline artifact responses with hardening headers', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('hello', {
				status: 200,
				headers: {
					'content-type': 'text/plain',
					'content-length': '5',
					'accept-ranges': 'bytes',
					etag: '"artifact-1"',
					'last-modified': 'Sun, 03 Aug 2026 00:00:00 GMT'
				},
			}),
		);

		const response = await GET(makeEvent(fetchMock));

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(response.headers.get('accept-ranges')).toBe('bytes');
		expect(response.headers.get('etag')).toBe('"artifact-1"');
		expect(response.headers.get('last-modified')).toBe('Sun, 03 Aug 2026 00:00:00 GMT');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
		expect(response.headers.get('content-disposition')).toBe('inline');
		expect(response.headers.get('cache-control')).toBe('private, no-store');
	});

	it('forwards only range validators and preserves partial responses', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('pdf', {
				status: 206,
				headers: {
					'content-type': 'application/pdf',
					'content-length': '3',
					'content-range': 'bytes 0-2/12',
					'accept-ranges': 'bytes',
					etag: '"artifact-1"',
					'last-modified': 'Sun, 03 Aug 2026 00:00:00 GMT'
				}
			}),
		);
		const request = new Request('https://ui.example.test/objects/OBJ-1/artifacts/artifact-1/view', {
			headers: {
				range: 'bytes=0-2',
				'if-range': '"artifact-1"',
				authorization: 'Bearer browser-token',
				cookie: 'session=browser-cookie',
				'x-unrelated-header': 'do-not-forward'
			}
		});

		const response = await GET(makeEvent(fetchMock, { request }));
		const backendHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);

		expect(backendHeaders.get('authorization')).toBe('Bearer token-1');
		expect(backendHeaders.get('range')).toBe('bytes=0-2');
		expect(backendHeaders.get('if-range')).toBe('"artifact-1"');
		expect(backendHeaders.get('cookie')).toBeNull();
		expect(backendHeaders.get('x-unrelated-header')).toBeNull();
		expect(response.status).toBe(206);
		expect(response.headers.get('content-range')).toBe('bytes 0-2/12');
		expect(response.headers.get('content-length')).toBe('3');
		expect(response.headers.get('accept-ranges')).toBe('bytes');
		expect(response.headers.get('etag')).toBe('"artifact-1"');
		expect(response.headers.get('last-modified')).toBe('Sun, 03 Aug 2026 00:00:00 GMT');
		expect(await response.text()).toBe('pdf');
	});

	it('preserves backend full responses after a stale range validator', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('pdf-content\n', {
				status: 200,
				headers: { 'content-type': 'application/pdf', 'content-length': '12' }
			}),
		);
		const request = new Request('https://ui.example.test/objects/OBJ-1/artifacts/artifact-1/view', {
			headers: { range: 'bytes=0-2', 'if-range': '"stale"' }
		});

		const response = await GET(makeEvent(fetchMock, { request }));

		expect(response.status).toBe(200);
		expect(response.headers.get('content-range')).toBeNull();
		expect(await response.text()).toBe('pdf-content\n');
	});

	it('preserves unsatisfiable range responses', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(null, {
				status: 416,
				headers: {
					'content-type': 'application/pdf',
					'content-range': 'bytes */12',
					'accept-ranges': 'bytes',
					etag: '"artifact-1"',
					'last-modified': 'Sun, 03 Aug 2026 00:00:00 GMT'
				}
			}),
		);

		const response = await GET(makeEvent(fetchMock));

		expect(response.status).toBe(416);
		expect(response.headers.get('content-range')).toBe('bytes */12');
		expect(response.headers.get('accept-ranges')).toBe('bytes');
		expect(response.headers.get('etag')).toBe('"artifact-1"');
		expect(await response.text()).toBe('');
	});

	it('rejects SVG even though it uses an image MIME type', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('<svg></svg>', {
				status: 200,
				headers: { 'content-type': 'image/svg+xml' }
			})
		);

		await expect(GET(makeEvent(fetchMock))).rejects.toMatchObject({ status: 415 });
	});

	it('rejects unsafe inline content types', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('<script></script>', {
				status: 200,
				headers: { 'content-type': 'text/html' },
			}),
		);

		await expect(GET(makeEvent(fetchMock))).rejects.toMatchObject({ status: 415 });
	});

	it('rejects unsafe partial content types', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('<svg></svg>', {
				status: 206,
				headers: { 'content-type': 'image/svg+xml', 'content-range': 'bytes 0-2/12' }
			}),
		);

		await expect(GET(makeEvent(fetchMock))).rejects.toMatchObject({ status: 415 });
	});

	it('maps backend fetch rejection to a controlled 502', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));

		await expect(GET(makeEvent(fetchMock))).rejects.toMatchObject({ status: 502 });
	});
});
