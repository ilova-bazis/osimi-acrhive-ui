import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import LocaleSwitcher from './LocaleSwitcher.svelte';
import { LOCALE_STORAGE_KEY, locale } from '$lib/i18n/locale';
import { translations } from '$lib/i18n/translations';
import { stubBrowserLanguages } from '$lib/testing/browserLanguages';

const STORAGE_KEY = LOCALE_STORAGE_KEY;

describe('LocaleSwitcher', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		locale.setLocale('en');
		window.localStorage.clear();
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
		stubBrowserLanguages(['en-US']);
		window.localStorage.setItem(STORAGE_KEY, 'ru');
		locale.init();

		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('ru');
	});

	it('falls back to English for an unknown persisted locale', async () => {
		stubBrowserLanguages(['en-US']);
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
			stubBrowserLanguages(['en-US']);
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
		stubBrowserLanguages(['en-US']);
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

describe('browser language detection', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		locale.setLocale('en');
		window.localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		locale.setLocale('en');
		window.localStorage.clear();
	});

	it('detects a Russian browser language when nothing is saved', async () => {
		stubBrowserLanguages(['ru-RU']);
		locale.init();

		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('ru');
	});

	it('detects an English browser language when nothing is saved', async () => {
		stubBrowserLanguages(['en-US']);
		locale.init();

		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('en');
	});

	it('uses the first supported browser language from the preference list', async () => {
		stubBrowserLanguages(['de-DE', 'ru-RU', 'en-US']);
		locale.init();

		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('falls back to English for an unsupported browser language', async () => {
		stubBrowserLanguages(['de-DE', 'fr-FR']);
		locale.init();

		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('en');
	});

	it('falls back to navigator.language when the languages list is empty', async () => {
		stubBrowserLanguages([], 'ru-RU');
		locale.init();

		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('does not persist an automatically detected locale', async () => {
		stubBrowserLanguages(['ru-RU']);
		locale.init();

		expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('does not persist the English fallback', async () => {
		stubBrowserLanguages(['de-DE', 'fr-FR']);
		locale.init();

		expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('honors an existing saved English choice over Russian browser detection', async () => {
		window.localStorage.setItem(STORAGE_KEY, 'en');

		stubBrowserLanguages(['ru-RU']);
		locale.init();

		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'EN' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('en');
	});

	it('honors an existing saved Russian choice over English browser detection', async () => {
		window.localStorage.setItem(STORAGE_KEY, 'ru');

		stubBrowserLanguages(['en-US']);
		locale.init();

		render(LocaleSwitcher);

		await expect
			.element(page.getByRole('button', { name: 'RU' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.lang).toBe('ru');
	});

	it('keeps a manual English selection against Russian browser detection', async () => {
		stubBrowserLanguages(['ru-RU']);
		locale.init();

		render(LocaleSwitcher);
		await userEvent.click(page.getByRole('button', { name: 'EN' }));

		expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en');
		expect(document.documentElement.lang).toBe('en');
	});

	it('keeps a manual selection across a later initialization', async () => {
		stubBrowserLanguages(['ru-RU']);
		locale.init();

		render(LocaleSwitcher);
		await userEvent.click(page.getByRole('button', { name: 'EN' }));

		locale.init();

		expect(document.documentElement.lang).toBe('en');
	});

	it('still detects the browser language when storage reads fail', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('storage denied');
		});

		stubBrowserLanguages(['ru-RU']);

		expect(() => locale.init()).not.toThrow();
		expect(document.documentElement.lang).toBe('ru');
	});
});
