import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import AppSidebar from './AppSidebar.svelte';

const renderSidebar = (overrides: Record<string, unknown> = {}) => {
	const onLogout = vi.fn();
	const view = render(AppSidebar, {
		currentPath: '/',
		username: 'archivist',
		role: 'admin',
		onLogout,
		...overrides
	});
	return { view, onLogout };
};

describe('AppSidebar', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('renders localized English shell labels', async () => {
		renderSidebar();

		await expect.element(page.getByText('Dashboard')).toBeInTheDocument();
		await expect.element(page.getByText('Overview')).toBeInTheDocument();
		await expect.element(page.getByText('New batch')).toBeInTheDocument();
		await expect.element(page.getByText('Objects')).toBeInTheDocument();
		await expect.element(page.getByText('Digital Library')).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: 'Primary navigation' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: 'Interface language' }))
			.toBeInTheDocument();
	});

	it('keeps the adjacent brand logo decorative', async () => {
		renderSidebar();

		const logo = document.querySelector('aside img[src="/logo.png"]');
		expect(logo).not.toBeNull();
		expect(logo).toHaveAttribute('alt', '');
		await expect.element(page.getByText('Digital Library')).toBeInTheDocument();
	});

	it('marks the current route with aria-current', async () => {
		renderSidebar({ currentPath: '/ingestion' });

		await expect
			.element(page.getByRole('link', { name: 'Overview' }))
			.toHaveAttribute('aria-current', 'page');
		await expect
			.element(page.getByRole('link', { name: 'Dashboard' }))
			.not.toHaveAttribute('aria-current', 'page');
	});

	it('activates New batch instead of Overview at /ingestion/new', async () => {
		renderSidebar({ currentPath: '/ingestion/new' });

		await expect
			.element(page.getByRole('link', { name: 'New batch' }))
			.toHaveAttribute('aria-current', 'page');
		await expect
			.element(page.getByRole('link', { name: 'Overview' }))
			.not.toHaveAttribute('aria-current', 'page');
	});

	it('activates Objects for nested object routes', async () => {
		renderSidebar({ currentPath: '/objects/obj-1/edit' });

		await expect
			.element(page.getByRole('link', { name: 'Objects' }))
			.toHaveAttribute('aria-current', 'page');
	});

	it('updates shell labels reactively when switching to Russian', async () => {
		renderSidebar();

		await userEvent.click(page.getByRole('button', { name: 'RU' }));

		await expect.element(page.getByText('Панель')).toBeInTheDocument();
		await expect.element(page.getByText('Обзор')).toBeInTheDocument();
		await expect.element(page.getByText('Новая партия')).toBeInTheDocument();
		await expect.element(page.getByText('Объекты')).toBeInTheDocument();
		await expect.element(page.getByText('Цифровая библиотека')).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: 'Основная навигация' }))
			.toBeInTheDocument();
	});

	it('localizes the active-batches heading and known statuses in Russian', async () => {
		locale.setLocale('ru');
		renderSidebar({
			activeBatches: [
				{
					id: 'b1',
					name: 'Газеты 1971',
					done: 2,
					total: 5,
					status: 'uploading',
					statusRaw: 'UPLOADING'
				},
				{
					id: 'b2',
					name: 'Batch two',
					done: 0,
					total: 3,
					status: null,
					statusRaw: 'mystery_status'
				}
			]
		});

		await expect.element(page.getByText('Активные партии')).toBeInTheDocument();
		await expect.element(page.getByText('Загрузка')).toBeInTheDocument();
		await expect.element(page.getByText('mystery_status')).toBeInTheDocument();
	});

	it('exposes a localized sign-out action and invokes the callback', async () => {
		const { onLogout } = renderSidebar();

		const signOut = page.getByRole('button', { name: 'Sign out' });
		await expect.element(signOut).toBeInTheDocument();
		await userEvent.click(signOut);
		expect(onLogout).toHaveBeenCalledOnce();
	});
});
