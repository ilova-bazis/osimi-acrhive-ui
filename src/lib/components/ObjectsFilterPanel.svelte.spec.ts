import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import ObjectsFilterPanel from './ObjectsFilterPanel.svelte';

const renderPanel = () =>
	render(ObjectsFilterPanel, {
		filters: { limit: 25 },
		availabilityOptions: [],
		accessOptions: [],
		sortOptions: []
	});

describe('ObjectsFilterPanel', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('describes indexed, materialized search fields in English', async () => {
		renderPanel();

		const search = page.getByPlaceholder('Title, object ID, indexed OCR/transcript...');
		await expect.element(search).toBeInTheDocument();
		await expect.element(search).toHaveAttribute('maxlength', '256');
		await expect
			.element(page.getByText('Materialized OCR/transcript text only. Press Enter to search.'))
			.toBeInTheDocument();
	});

	it('describes indexed, materialized search fields in Russian', async () => {
		locale.setLocale('ru');
		renderPanel();

		await expect
			.element(page.getByPlaceholder('Заголовок, ID объекта, индексированные OCR/транскрипты...'))
			.toBeInTheDocument();
		await expect
			.element(
				page.getByText(
					'Только материализованный текст OCR/транскриптов. Нажмите Enter для поиска.'
				)
			)
			.toBeInTheDocument();
	});
});
