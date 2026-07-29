import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'viewer' };

const makeEvent = (fetchMock: ReturnType<typeof vi.fn>) =>
	({
		params: { objectId: 'OBJ-1', artifactId: 'artifact-1' },
		locals: { session },
		cookies: { get: () => 'token-1', delete: vi.fn() },
		fetch: fetchMock,
	}) as never;

describe('/objects/[objectId]/artifacts/[artifactId]/download +server', () => {
	it('streams downloads with nosniff header', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('file', {
				status: 200,
				headers: {
					'content-type': 'application/pdf',
					'content-disposition': 'attachment; filename="file.pdf"',
				},
			}),
		);

		const response = await GET(makeEvent(fetchMock));

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/pdf');
		expect(response.headers.get('content-disposition')).toContain('attachment;');
		expect(response.headers.get('content-disposition')).toContain('filename="file.pdf"');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('cache-control')).toBe('private, no-store');
	});

	it('forces active content to download as a sanitized attachment', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response('<script></script>', {
				status: 200,
				headers: {
					'content-type': 'text/html',
					'content-disposition': 'inline; filename="../../unsafe.html"'
				}
			})
		);

		const response = await GET(makeEvent(fetchMock));
		expect(response.headers.get('content-disposition')).toContain('attachment;');
		expect(response.headers.get('content-disposition')).toContain('filename="unsafe.html"');
		expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
	});

	it('maps backend fetch rejection to a controlled 502', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));

		await expect(GET(makeEvent(fetchMock))).rejects.toMatchObject({ status: 502 });
	});
});
