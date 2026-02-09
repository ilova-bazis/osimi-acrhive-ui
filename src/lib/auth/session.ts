import { get } from 'svelte/store';
import { writable } from 'svelte/store';
import { getMe, login, logout } from '$lib/api/auth';
import type { Session } from './types';

export const session = writable<Session | null>(null);
export const sessionLoading = writable(false);

export const loadSession = async () => {
	sessionLoading.set(true);
	try {
		const me = await getMe();
		session.set(me);
		return me;
	} catch {
		session.set(null);
		return null;
	} finally {
		sessionLoading.set(false);
	}
};

export const loginWithPassword = async (username: string, password: string) => {
	sessionLoading.set(true);
	try {
		const user = await login(username, password);
		session.set(user);
		return user;
	} finally {
		sessionLoading.set(false);
	}
};

export const logoutSession = async () => {
	await logout();
	session.set(null);
};

export const hasSession = () => Boolean(get(session));
