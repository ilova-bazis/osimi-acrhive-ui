import { describe, expect, it, vi } from 'vitest';

import { GET } from './+server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'operator' };

const makeEvent = (overrides: {
	session?: typeof session | null;
	token?: string | undefined;
	fetch?: ReturnType<typeof vi.fn>;
	method?: 'GET' | 'HEAD';
} = {}) =>
	({
		params: { batchId: 'batch 1', fileId: 'file/1' },
		locals: { session: 'session' in overrides ? overrides.session : session },
		cookies: { get: () => ('token' in overrides ? overrides.token : 'token-1') },
		fetch: overrides.fetch ?? vi.fn(),
		request: new Request('https://example.test/preview', { method: overrides.method ?? 'GET' })
	}) as never;

describe('/ingestion/[batchId]/files/[fileId]/preview +server', () => {
	it('returns 401 when auth is missing', async () => {
		const response = await GET(makeEvent({ session: null, token: undefined }));

		expect(response.status).toBe(401);
	});

	it('returns 502 when backend fetch fails', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));

		const response = await GET(makeEvent({ fetch: fetchMock }));

		expect(response.status).toBe(502);
	});

	it('propagates backend non-ok status', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

		const response = await GET(makeEvent({ fetch: fetchMock }));

		expect(response.status).toBe(404);
	});

	it('streams allowlisted preview bytes with hardened headers', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(new Uint8Array([1, 2, 3]), {
				status: 200,
				headers: { 'content-type': 'image/jpeg' }
			})
		);

		const response = await GET(makeEvent({ fetch: fetchMock }));

		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3000/api/ingestions/batch%201/files/file%2F1/preview',
			{ headers: { Authorization: 'Bearer token-1' } }
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/jpeg');
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(response.headers.get('content-disposition')).toBe('inline');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
		expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2, 3]);
	});

	it.each(['text/html', 'image/svg+xml', 'application/octet-stream', 'image/jpegfoo', null])(
		'rejects unsupported preview type %s',
		async (contentType) => {
			const fetchMock = vi.fn().mockResolvedValue(
				new Response('unsafe', {
					status: 200,
					headers: contentType ? { 'content-type': contentType } : {}
				})
			);

			const response = await GET(makeEvent({ fetch: fetchMock }));
			expect(response.status).toBe(415);
		}
	);

	it('normalizes parameterized preview types and handles HEAD without a body', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('preview', {
				status: 200,
				headers: { 'content-type': 'IMAGE/WEBP; charset=binary', 'content-length': '7' }
			})
		);

		const response = await GET(makeEvent({ fetch: fetchMock, method: 'HEAD' }));
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/webp');
		expect(response.headers.get('content-length')).toBe('7');
		expect(await response.text()).toBe('');
	});
});
