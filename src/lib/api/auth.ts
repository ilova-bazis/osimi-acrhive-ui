import type { Session } from '$lib/auth/types';

const API_BASE = (import.meta.env.PUBLIC_API_BASE as string) || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

type LoginResponse = {
	token: string;
	token_type: 'Bearer';
	user: {
		id: string;
		username: string;
		tenant_id?: string | null;
		role: string;
	};
};

const readErrorMessage = async (res: Response, fallback: string) => {
	try {
		const body = await res.json();
		return body?.error?.message ?? fallback;
	} catch {
		return fallback;
	}
};

const mapUser = (user: LoginResponse['user']): Session => ({
	id: user.id,
	username: user.username,
	tenantId: user.tenant_id ?? null,
	role: user.role
});

export const getAuthToken = () => {
	if (typeof window === 'undefined') {
		return null;
	}
	return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
	if (typeof window === 'undefined') {
		return;
	}
	localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
	if (typeof window === 'undefined') {
		return;
	}
	localStorage.removeItem(TOKEN_KEY);
};

export const login = async (username: string, password: string, tenantId?: string) => {
	const res = await fetch(`${API_BASE}/api/auth/login`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ username, password, tenant_id: tenantId })
	});

	if (!res.ok) {
		throw new Error(await readErrorMessage(res, 'Login failed'));
	}

	const body = (await res.json()) as LoginResponse;
	setAuthToken(body.token);
	return mapUser(body.user);
};

export const getMe = async () => {
	const token = getAuthToken();
	if (!token) {
		throw new Error('Unauthorized');
	}

	const res = await fetch(`${API_BASE}/api/auth/me`, {
		headers: { authorization: `Bearer ${token}` }
	});

	if (!res.ok) {
		throw new Error(await readErrorMessage(res, 'Unauthorized'));
	}

	const body = (await res.json()) as { user: LoginResponse['user'] };
	return mapUser(body.user);
};

export const logout = async () => {
	const token = getAuthToken();
	if (token) {
		await fetch(`${API_BASE}/api/auth/logout`, {
			method: 'POST',
			headers: { authorization: `Bearer ${token}` }
		}).catch(() => undefined);
	}
	clearAuthToken();
};
