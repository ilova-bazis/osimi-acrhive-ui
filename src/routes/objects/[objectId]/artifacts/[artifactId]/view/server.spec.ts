import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'viewer' };

const makeEvent = (fetchMock: ReturnType<typeof vi.fn>, overrides: Record<string, unknown> = {}) =>
	({
		params: { objectId: 'OBJ-1', artifactId: 'artifact-1' },
		locals: { session },
		cookies: { get: () => 'token-1', delete: vi.fn() },
		fetch: fetchMock,
		...overrides,
	}) as never;

describe('/objects/[objectId]/artifacts/[artifactId]/view +server', () => {
	it('returns safe inline artifact responses with hardening headers', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('hello', {
				status: 200,
				headers: { 'content-type': 'text/plain', 'content-length': '5' },
			}),
		);

		const response = await GET(makeEvent(fetchMock));

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('text/plain');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
		expect(response.headers.get('content-disposition')).toBe('inline');
		expect(response.headers.get('cache-control')).toBe('private, no-store');
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

	it('maps backend fetch rejection to a controlled 502', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));

		await expect(GET(makeEvent(fetchMock))).rejects.toMatchObject({ status: 502 });
	});
});
