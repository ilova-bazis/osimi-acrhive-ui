import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { loginWithBackendMock, setSessionCookieMock } = vi.hoisted(() => ({
	loginWithBackendMock: vi.fn(),
	setSessionCookieMock: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({
	loginWithBackend: loginWithBackendMock,
	setSessionCookie: setSessionCookieMock
}));

import { actions } from './+page.server';

const makeEvent = (request: Request) =>
	({
		request,
		cookies: { set: vi.fn() },
		fetch: vi.fn()
	}) as never;

const makeLoginRequest = (form: FormData, headers?: HeadersInit): Request =>
	new Request('https://example.test/login', {
		method: 'POST',
		body: form,
		headers
	});

describe('/login +page.server', () => {
	beforeEach(() => {
		loginWithBackendMock.mockReset();
		setSessionCookieMock.mockReset();
		loginWithBackendMock.mockResolvedValue({ token: 'token-1' });
	});

	it('rejects invalid request origins with a stable code', async () => {
		const form = new FormData();
		form.set('username', 'admin');
		form.set('password', 'secret');

		const result = await actions.default(
			makeEvent(makeLoginRequest(form, { origin: 'https://evil.test' }))
		);

		expect(result).toMatchObject({
			status: 403,
			data: { errorCode: 'invalidOrigin' }
		});
		expect(loginWithBackendMock).not.toHaveBeenCalled();
	});

	it('returns a stable code for missing credentials', async () => {
		const form = new FormData();
		form.set('username', ' admin ');

		const result = await actions.default(makeEvent(makeLoginRequest(form)));

		expect(result).toMatchObject({
			status: 400,
			data: { errorCode: 'credentialsRequired', username: 'admin' }
		});
		expect(loginWithBackendMock).not.toHaveBeenCalled();
	});

	it('sets the session cookie and redirects after successful login', async () => {
		const form = new FormData();
		form.set('username', ' admin ');
		form.set('password', ' secret ');
		form.set('tenantId', ' tenant-1 ');
		const event = makeEvent(makeLoginRequest(form));

		await expect(actions.default(event)).rejects.toMatchObject({ status: 303, location: '/' });

		expect(loginWithBackendMock).toHaveBeenCalledWith(expect.any(Function), 'admin', 'secret', 'tenant-1');
		expect(setSessionCookieMock).toHaveBeenCalledWith(expect.any(Object), 'token-1');
	});

	it('maps backend auth errors to a stable code without leaking messages', async () => {
		const form = new FormData();
		form.set('username', 'admin');
		form.set('password', 'wrong');
		loginWithBackendMock.mockRejectedValue(
			new ApiClientError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid credentials' })
		);

		const result = await actions.default(makeEvent(makeLoginRequest(form)));

		expect(result).toMatchObject({
			status: 401,
			data: { errorCode: 'invalidCredentials', username: 'admin' }
		});
		expect((result as { data: Record<string, unknown> }).data).not.toHaveProperty('message');
		expect((result as { data: Record<string, unknown> }).data).not.toHaveProperty('error');
		expect(setSessionCookieMock).not.toHaveBeenCalled();
	});

	it('maps unexpected login errors to a stable code without leaking messages', async () => {
		const form = new FormData();
		form.set('username', 'admin');
		form.set('password', 'secret');
		loginWithBackendMock.mockRejectedValue(new Error('backend unavailable'));

		const result = await actions.default(makeEvent(makeLoginRequest(form)));

		expect(result).toMatchObject({
			status: 401,
			data: { errorCode: 'loginFailed', username: 'admin' }
		});
		expect(JSON.stringify(result)).not.toContain('backend unavailable');
	});
});
