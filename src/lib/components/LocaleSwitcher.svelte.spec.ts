import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import LocaleSwitcher from './LocaleSwitcher.svelte';
import { locale } from '$lib/i18n/locale';
import { translations } from '$lib/i18n/translations';

const STORAGE_KEY = 'osimi-locale';

describe('LocaleSwitcher', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		window.localStorage.clear();
		locale.setLocale('en');
	});

	afterEach(() => {
		vi.restoreAllMocks();
		locale.setLocale('en');
		window.localStorage.clear();
	});

	it('starts with English selected', async () => {
		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'false');
	});

	it('switches to Russian, persisting storage and document language', async () => {
		render(LocaleSwitcher);

		await userEvent.click(page.getByRole('button', { name: 'RU' }));

		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'false');
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('ru');
		expect(document.documentElement.lang).toBe('ru');
	});

	it('switches back to English', async () => {
		render(LocaleSwitcher);

		await userEvent.click(page.getByRole('button', { name: 'RU' }));
		await userEvent.click(page.getByRole('button', { name: 'EN' }));

		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en');
		expect(document.documentElement.lang).toBe('en');
	});

	it('restores a valid persisted Russian locale during init', async () => {
		window.localStorage.setItem(STORAGE_KEY, 'ru');
		locale.init();
		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('ru');
	});

	it('falls back to English for an unknown persisted locale', async () => {
		window.localStorage.setItem(STORAGE_KEY, 'de');
		locale.init();
		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('en');
	});

	it.each(['constructor', 'toString', '__proto__', ''])(
		'falls back to English for the inherited or empty persisted value %j',
		async (value) => {
			window.localStorage.setItem(STORAGE_KEY, value);
			locale.init();
			render(LocaleSwitcher);

			await expect
				.element(page.getByRole('button', { name: 'EN' }))
				.toHaveAttribute('aria-pressed', 'true');
			expect(document.documentElement.lang).toBe('en');
		}
	);

	it('tolerates storage read failures during init', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('storage denied');
		});

		expect(() => locale.init()).not.toThrow();
		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('en');
	});

	it('tolerates storage write failures while switching', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('storage denied');
		});

		render(LocaleSwitcher);
		await userEvent.click(page.getByRole('button', { name: 'RU' }));

		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('ru');
	});

	it('renders one control per supported dictionary locale', async () => {
		render(LocaleSwitcher);

		const expected = (Object.keys(translations) as (keyof typeof translations)[]).map(
			(key) => key.toUpperCase()
		);

		for (const label of expected) {
			await expect.element(page.getByRole('button', { name: label })).toBeInTheDocument();
		}

		const group = page.getByRole('group', { name: 'Interface language' }).element();
		expect(group.querySelectorAll('button').length).toBe(expected.length);
	});

	it('exposes a localized accessible group name', async () => {
		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('group', { name: 'Interface language' }))
			.toBeInTheDocument();

		await userEvent.click(page.getByRole('button', { name: 'RU' }));

		await expect
			.element(page.getByRole('group', { name: 'Язык интерфейса' }))
			.toBeInTheDocument();
	});
});
