import { redirect, type Handle } from '@sveltejs/kit';
import { getSessionCookieName, getSessionFromToken } from '$lib/server/auth';

const publicPrefixes = ['/login', '/prototype'];
const assetPrefixes = ['/_app', '/favicon', '/assets'];

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (assetPrefixes.some((prefix) => pathname.startsWith(prefix))) {
		return resolve(event);
	}

	if (publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
		return resolve(event);
	}

	const token = event.cookies.get(getSessionCookieName());
	const session = getSessionFromToken(token);

	if (!session) {
		throw redirect(303, '/login');
	}

	event.locals.session = session;
	return resolve(event);
};
