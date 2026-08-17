import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';
import type { LoginErrorCode } from '$lib/auth/loginErrors';

import LoginPage from './+page.svelte';

describe('login page localization', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('renders English login copy with a visible locale switch', async () => {
		render(LoginPage, { form: undefined });

		await expect.element(page.getByText('Authorized Access')).toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: 'Interface language' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('switches login copy to Russian immediately', async () => {
		render(LoginPage, { form: undefined });

		await userEvent.click(page.getByRole('button', { name: 'RU' }));

		await expect.element(page.getByText('Авторизованный доступ')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Войти' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: 'Язык интерфейса' }))
			.toBeInTheDocument();
	});

	it('switches back to English without affecting the form', async () => {
		render(LoginPage, { form: undefined });

		await userEvent.click(page.getByRole('button', { name: 'RU' }));
		await userEvent.click(page.getByRole('button', { name: 'EN' }));

		await expect.element(page.getByText('Authorized Access')).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Username' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Password' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
	});

	it('renders credential errors in English with alert semantics', async () => {
		render(LoginPage, { form: { errorCode: 'invalidCredentials' } });

		const alert = page.getByRole('alert');
		await expect.element(alert).toBeInTheDocument();
		await expect.element(alert).toHaveTextContent('Invalid username or password.');
		await expect
			.element(page.getByRole('textbox', { name: 'Username' }))
			.toHaveAttribute('aria-invalid', 'true');
		await expect
			.element(page.getByRole('textbox', { name: 'Username' }))
			.toHaveAttribute('aria-describedby', 'login-error');
		await expect
			.element(page.getByRole('textbox', { name: 'Password' }))
			.toHaveAttribute('aria-invalid', 'true');
	});

	it('retranslates an existing error when the locale changes', async () => {
		render(LoginPage, { form: { errorCode: 'invalidCredentials' } });

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Invalid username or password.');

		await userEvent.click(page.getByRole('button', { name: 'RU' }));

		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Неверное имя пользователя или пароль.');
	});

	it('preserves the submitted username after a failed action', async () => {
		render(LoginPage, { form: { errorCode: 'loginFailed', username: 'archivist' } });

		await expect
			.element(page.getByRole('textbox', { name: 'Username' }))
			.toHaveValue('archivist');
	});

	it('never displays raw error codes to users', async () => {
		render(LoginPage, { form: { errorCode: 'invalidCredentials' } });

		await expect.element(page.getByText('invalidCredentials')).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
	});

	it.each<LoginErrorCode>([
		'invalidOrigin',
		'credentialsRequired',
		'invalidCredentials',
		'loginFailed'
	])('renders a visible localized message for %s', async (errorCode) => {
		render(LoginPage, { form: { errorCode } });

		await expect.element(page.getByRole('alert')).not.toHaveTextContent(errorCode);
		await expect.element(page.getByRole('alert')).not.toHaveTextContent(/^$/);
	});

	it('uses a visible generic message for an unexpected runtime code', async () => {
		render(LoginPage, { form: { errorCode: 'unexpected' as LoginErrorCode } });

		await expect.element(page.getByRole('alert')).toHaveTextContent('Sign-in failed. Please try again.');
	});
});
