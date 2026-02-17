import { env } from "$env/dynamic/private";
import type { Cookies } from "@sveltejs/kit";
import {
  loginRequestSchema,
  loginResponseSchema,
  meResponseSchema,
  logoutResponseSchema,
} from "$lib/api/schemas/auth";
import type { Session } from "$lib/auth/types";
import { backendRequest, isUnauthorizedError } from "$lib/server/apiClient";

export const AUTH_COOKIE_NAME = "osimi_session";

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

const mapUserToSession = (user: {
  id: string;
  username: string;
  tenant_id?: string | null;
  role: string;
}): Session => ({
  id: user.id,
  username: user.username,
  tenantId: user.tenant_id ?? null,
  role: user.role,
});

export const setSessionCookie = (cookies: Cookies, token: string): void => {
  cookies.set(AUTH_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
};

export const clearSessionCookie = (cookies: Cookies): void => {
  cookies.delete(AUTH_COOKIE_NAME, { path: "/" });
};

export const loginWithBackend = async (
  fetchFn: typeof fetch,
  username: string,
  password: string,
  tenantId?: string,
): Promise<{ token: string; session: Session }> => {
  const body = await backendRequest({
    fetchFn,
    path: "/api/auth/login",
    context: "auth.login",
    method: "POST",
    body: { username, password, tenant_id: tenantId },
    requestSchema: loginRequestSchema,
    responseSchema: loginResponseSchema,
  });

  return {
    token: body.token,
    session: mapUserToSession(body.user),
  };
};

export const getSessionFromToken = async (
  fetchFn: typeof fetch,
  token: string,
): Promise<Session | null> => {
  try {
    const body = await backendRequest({
      fetchFn,
      path: "/api/auth/me",
      context: "auth.me",
      method: "GET",
      token,
      responseSchema: meResponseSchema,
    });
    return mapUserToSession(body.user);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return null;
    }

    throw error;
  }
};

export const logoutWithBackend = async (
  fetchFn: typeof fetch,
  token: string,
): Promise<void> => {
  try {
    await backendRequest({
      fetchFn,
      path: "/api/auth/logout",
      context: "auth.logout",
      method: "POST",
      token,
      responseSchema: logoutResponseSchema,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return;
    }

    throw error;
  }
};
