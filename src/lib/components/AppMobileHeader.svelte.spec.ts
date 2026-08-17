import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import AppMobileHeader from './AppMobileHeader.svelte';

const renderHeader = (currentPath = '/') => {
	const onLogout = vi.fn();
	const view = render(AppMobileHeader, { currentPath, onLogout });
	return { view, onLogout };
};

describe('AppMobileHeader', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('renders brand identity, navigation, and the locale switch', async () => {
		renderHeader();

		await expect.element(page.getByText('Digital Library')).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: 'Primary navigation' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Overview' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'New batch' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Objects' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: 'Interface language' }))
			.toBeInTheDocument();
	});

	it('keeps the adjacent brand logo decorative', async () => {
		renderHeader();

		const logo = document.querySelector('header img[src="/logo.png"]');
		expect(logo).not.toBeNull();
		expect(logo).toHaveAttribute('alt', '');
		await expect.element(page.getByText('Digital Library')).toBeInTheDocument();
	});

	it('marks nested ingestion routes as active on Overview', async () => {
		renderHeader('/ingestion/batch-1/setup');

		await expect
			.element(page.getByRole('link', { name: 'Overview' }))
			.toHaveAttribute('aria-current', 'page');
	});

	it('activates New batch instead of Overview at /ingestion/new', async () => {
		renderHeader('/ingestion/new');

		await expect
			.element(page.getByRole('link', { name: 'New batch' }))
			.toHaveAttribute('aria-current', 'page');
		await expect
			.element(page.getByRole('link', { name: 'Overview' }))
			.not.toHaveAttribute('aria-current', 'page');
	});

	it('updates labels reactively when switching to Russian', async () => {
		renderHeader('/objects');

		await userEvent.click(page.getByRole('button', { name: 'RU' }));

		await expect.element(page.getByText('Цифровая библиотека')).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Обзор' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Объекты' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: 'Основная навигация' }))
			.toBeInTheDocument();
	});

	it('exposes a localized sign-out action and invokes the callback', async () => {
		const { onLogout } = renderHeader();

		const signOut = page.getByRole('button', { name: 'Sign out' });
		await expect.element(signOut).toBeInTheDocument();
		await userEvent.click(signOut);
		expect(onLogout).toHaveBeenCalledOnce();
	});
});
