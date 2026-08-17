import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

vi.mock('$app/forms', () => ({
	enhance: () => ({ destroy: () => {} })
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import NewIngestionPage from './+page.svelte';

const renderPage = () => render(NewIngestionPage, { form: null });

describe('/ingestion/new +page.svelte localization', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('renders the form in English', async () => {
		renderPage();

		await expect.element(page.getByText('New batch')).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Batch name' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('What does it represent?')).toBeInTheDocument();
		await expect.element(page.getByText('What kind of item is it?')).toBeInTheDocument();
		await expect.element(page.getByText('Scanned Pages', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Primary language')).toBeInTheDocument();
		await expect.element(page.getByText('Processing pipeline')).toBeInTheDocument();
		await expect.element(page.getByText('Visibility')).toBeInTheDocument();
		await expect.element(page.getByText('Provenance & notes')).toBeInTheDocument();
		await expect.element(page.getByText('Step 1 of 3')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
	});

	it('renders the form in Russian', async () => {
		locale.setLocale('ru');
		renderPage();

		await expect.element(page.getByText('Новая партия')).toBeInTheDocument();
		await expect.element(page.getByText('Название партии')).toBeInTheDocument();
		await expect.element(page.getByText('Что это представляет?')).toBeInTheDocument();
		await expect.element(page.getByText('Какой это тип элемента?')).toBeInTheDocument();
		await expect.element(page.getByText('Сканы страниц', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Основной язык')).toBeInTheDocument();
		await expect.element(page.getByText('Конвейер обработки')).toBeInTheDocument();
		await expect.element(page.getByText('Доступ')).toBeInTheDocument();
		await expect.element(page.getByText('Происхождение и примечания')).toBeInTheDocument();
		await expect.element(page.getByText('Шаг 1 из 3')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Настройка, шаг 1 из 3' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Продолжить' })).toBeInTheDocument();
	});

	it('updates labels reactively when the locale changes', async () => {
		renderPage();

		await expect.element(page.getByText('Batch name')).toBeInTheDocument();
		locale.setLocale('ru');

		await expect.element(page.getByText('Название партии')).toBeInTheDocument();
		await expect.element(page.getByText('Что это представляет?')).toBeInTheDocument();
	});

	it('adds tags interactively without breaking translated labels', async () => {
		renderPage();

		await userEvent.type(page.getByPlaceholder('People, places, themes — press Enter to add'), 'Tehran');
		await userEvent.keyboard('{Enter}');

		await expect.element(page.getByRole('button', { name: 'Remove tag Tehran' })).toBeInTheDocument();
		await expect.element(page.getByText('Batch name')).toBeInTheDocument();
	});

	it('exposes an accessible discard action on mobile', async () => {
		await page.viewport(375, 667);
		renderPage();

		const link = page.getByRole('link', { name: 'Discard' });
		await expect.element(link).toBeInTheDocument();
		await expect.element(link).toHaveAttribute('aria-label', 'Discard');

		await page.viewport(1280, 720);
	});

	it('exposes an accessible discard action on mobile in Russian', async () => {
		locale.setLocale('ru');
		await page.viewport(375, 667);
		renderPage();

		const link = page.getByRole('link', { name: 'Отменить' });
		await expect.element(link).toBeInTheDocument();
		await expect.element(link).toHaveAttribute('aria-label', 'Отменить');

		await page.viewport(1280, 720);
	});
});
