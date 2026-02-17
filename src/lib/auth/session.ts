import { get } from 'svelte/store';
import { writable } from 'svelte/store';
import type { Session } from './types';

export const session = writable<Session | null>(null);

export const setSession = (currentSession: Session | null) => {
	session.set(currentSession);
};

export const hasSession = () => Boolean(get(session));
