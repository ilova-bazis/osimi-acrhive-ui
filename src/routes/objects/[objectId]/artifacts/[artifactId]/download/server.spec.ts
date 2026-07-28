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
		expect(response.headers.get('content-disposition')).toBe('attachment; filename="file.pdf"');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
	});

	it('maps backend fetch rejection to a controlled 502', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));

		await expect(GET(makeEvent(fetchMock))).rejects.toMatchObject({ status: 502 });
	});
});
