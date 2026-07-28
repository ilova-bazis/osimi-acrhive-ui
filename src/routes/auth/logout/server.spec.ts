import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clearSessionCookieMock, logoutWithBackendMock } = vi.hoisted(() => ({
	clearSessionCookieMock: vi.fn(),
	logoutWithBackendMock: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({
	AUTH_COOKIE_NAME: 'osimi_session',
	clearSessionCookie: clearSessionCookieMock,
	logoutWithBackend: logoutWithBackendMock
}));

import { POST } from './+server';

const makeEvent = (request: Request, token: string | undefined = 'token-1') => ({
	request,
	url: new URL(request.url),
	cookies: { get: () => token },
	fetch: vi.fn()
}) as never;

describe('/auth/logout +server', () => {
	beforeEach(() => {
		clearSessionCookieMock.mockReset();
		logoutWithBackendMock.mockReset();
		logoutWithBackendMock.mockResolvedValue(undefined);
	});

	it('rejects invalid request origins', async () => {
		const response = await POST(makeEvent(new Request('https://example.test/auth/logout', {
			method: 'POST',
			headers: { origin: 'https://evil.test' }
		})));

		expect(response.status).toBe(403);
		expect(clearSessionCookieMock).not.toHaveBeenCalled();
	});

	it('logs out with backend and clears local session cookie', async () => {
		const response = await POST(makeEvent(new Request('https://example.test/auth/logout', { method: 'POST' })));

		expect(response.status).toBe(200);
		expect(logoutWithBackendMock).toHaveBeenCalledWith(expect.any(Function), 'token-1');
		expect(clearSessionCookieMock).toHaveBeenCalledTimes(1);
	});

	it('clears local session cookie when backend logout fails', async () => {
		logoutWithBackendMock.mockRejectedValue(new Error('backend unavailable'));

		const response = await POST(makeEvent(new Request('https://example.test/auth/logout', { method: 'POST' })));

		expect(response.status).toBe(200);
		expect(clearSessionCookieMock).toHaveBeenCalledTimes(1);
	});
});
