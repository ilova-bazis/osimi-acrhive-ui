import { dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { AUTH_COOKIE_NAME, clearSessionCookie, getSessionFromToken } from '$lib/server/auth';

type PublicPathOptions = {
	allowPrototype?: boolean;
};

const isPrototypePath = (pathname: string): boolean =>
	pathname === '/prototype' ||
	pathname.startsWith('/prototype/') ||
	pathname === '/ingestion-proto' ||
	pathname.startsWith('/ingestion-proto/');

export const isPublicPath = (
	pathname: string,
	{ allowPrototype = dev }: PublicPathOptions = {}
): boolean =>
	pathname === '/login' ||
	pathname.startsWith('/login/') ||
	(allowPrototype && isPrototypePath(pathname)) ||
	pathname === '/auth/logout';

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.route.id) {
		return resolve(event);
	}

	const token = event.cookies.get(AUTH_COOKIE_NAME);
	let session = null;

	if (token) {
		session = await getSessionFromToken(event.fetch, token);
		if (!session) {
			clearSessionCookie(event.cookies);
		}
	}

	event.locals.session = session;

	if (!isPublicPath(event.url.pathname) && !session) {
		throw redirect(303, '/login');
	}

	if (event.url.pathname === '/login' && session) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
