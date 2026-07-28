import { describe, expect, it, vi } from 'vitest';

import { GET } from './+server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'operator' };

const makeEvent = (overrides: {
	session?: typeof session | null;
	token?: string | undefined;
	fetch?: ReturnType<typeof vi.fn>;
} = {}) =>
	({
		params: { batchId: 'batch 1', fileId: 'file/1' },
		locals: { session: overrides.session ?? session },
		cookies: { get: () => ('token' in overrides ? overrides.token : 'token-1') },
		fetch: overrides.fetch ?? vi.fn()
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

	it('forwards preview bytes with content type and private cache header', async () => {
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
		expect(response.headers.get('cache-control')).toBe('private, max-age=300');
		expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2, 3]);
	});
});
