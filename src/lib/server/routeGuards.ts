import { json, type RequestEvent } from '@sveltejs/kit';

import type { Session } from '$lib/auth/types';
import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import { isTrustedOrigin } from '$lib/server/csrf';

export type AuthenticatedMutation = {
	session: Session;
	token: string;
};

export const mapApiErrorStatus = (status: number): number => {
	if (status === 400 || status === 401 || status === 403 || status === 404 || status === 409 || status === 423) {
		return status;
	}

	return 502;
};

export const requireMutationAuth = (
	event: Pick<RequestEvent, 'request' | 'locals' | 'cookies'>
): AuthenticatedMutation | Response => {
	const expectedOrigin = new URL(event.request.url).origin;
	if (!isTrustedOrigin(event.request, expectedOrigin)) {
		return json({ error: 'Invalid request origin.' }, { status: 403 });
	}

	const token = event.cookies.get(AUTH_COOKIE_NAME);
	if (!event.locals.session || !token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	return { session: event.locals.session, token };
};

export const isAuthFailureResponse = (value: AuthenticatedMutation | Response): value is Response =>
	value instanceof Response;
