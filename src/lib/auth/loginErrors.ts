import type { TranslationKey } from '$lib/i18n/translations';

export type LoginErrorCode =
	| 'invalidOrigin'
	| 'credentialsRequired'
	| 'invalidCredentials'
	| 'loginFailed';

export const loginErrorKeys: Record<LoginErrorCode, TranslationKey> = {
	invalidOrigin: 'login.errors.invalidOrigin',
	credentialsRequired: 'login.errors.credentialsRequired',
	invalidCredentials: 'login.errors.invalidCredentials',
	loginFailed: 'login.errors.loginFailed'
};
