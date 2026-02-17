import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { AUTH_COOKIE_NAME, clearSessionCookie, getSessionFromToken } from '$lib/server/auth';

const isPublicRoute = (pathname: string): boolean =>
	pathname === '/login' ||
	pathname.startsWith('/login/') ||
	pathname === '/prototype' ||
	pathname.startsWith('/prototype/');

export const load: LayoutServerLoad = async ({ cookies, fetch, url }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	let currentSession = null;

	if (token) {
		currentSession = await getSessionFromToken(fetch, token);
		if (!currentSession) {
			clearSessionCookie(cookies);
		}
	}

	if (!isPublicRoute(url.pathname) && !currentSession) {
		throw redirect(303, '/login');
	}

	if (url.pathname === '/login' && currentSession) {
		throw redirect(303, '/');
	}

	return {
		session: currentSession
	};
};
