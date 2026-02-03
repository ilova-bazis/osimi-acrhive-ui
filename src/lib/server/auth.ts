import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { validateDemoCredentials } from '$lib/auth/demoAccounts';
import type { Role, Session } from '$lib/auth/types';

const COOKIE_NAME = 'osimi_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SessionPayload = {
	sub: string;
	username: string;
	role: Role;
	iat: number;
	exp: number;
};

const toBase64Url = (value: string) => Buffer.from(value).toString('base64url');
const fromBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

const getSecret = () => {
	if (!env.AUTH_SECRET) {
		throw new Error('AUTH_SECRET is not set');
	}
	return env.AUTH_SECRET;
};

const signPayload = (payload: string) =>
	createHmac('sha256', getSecret()).update(payload).digest('base64url');

const isSignatureValid = (signature: string, payload: string) => {
	const expected = signPayload(payload);
	const signatureBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expected);
	if (signatureBuffer.length !== expectedBuffer.length) {
		return false;
	}
	return timingSafeEqual(signatureBuffer, expectedBuffer);
};

export const createSessionToken = (username: string, role: Role) => {
	const issuedAt = Math.floor(Date.now() / 1000);
	const expiresAt = issuedAt + SESSION_TTL_SECONDS;
	const payload: SessionPayload = {
		sub: `user-${role}`,
		username,
		role,
		iat: issuedAt,
		exp: expiresAt
	};
	const payloadEncoded = toBase64Url(JSON.stringify(payload));
	const signature = signPayload(payloadEncoded);
	return {
		token: `${payloadEncoded}.${signature}`,
		payload
	};
};

export const verifySessionToken = (token: string | undefined | null): SessionPayload | null => {
	if (!token) {
		return null;
	}
	const [payloadEncoded, signature] = token.split('.');
	if (!payloadEncoded || !signature) {
		return null;
	}
	if (!isSignatureValid(signature, payloadEncoded)) {
		return null;
	}
	try {
		const payload = JSON.parse(fromBase64Url(payloadEncoded)) as SessionPayload;
		if (payload.exp <= Math.floor(Date.now() / 1000)) {
			return null;
		}
		return payload;
	} catch {
		return null;
	}
};

export const getSessionFromToken = (token: string | undefined | null): Session | null => {
	const payload = verifySessionToken(token);
	if (!payload) {
		return null;
	}
	return {
		userId: payload.sub,
		username: payload.username,
		role: payload.role,
		issuedAt: new Date(payload.iat * 1000).toISOString(),
		expiresAt: new Date(payload.exp * 1000).toISOString()
	};
};

export const getSessionCookieName = () => COOKIE_NAME;

export const authenticateDemoUser = (username: string, password: string) =>
	validateDemoCredentials(username, password);
