import { get } from 'svelte/store';
import { afterEach, describe, expect, it } from 'vitest';

import { detectLocaleFromLanguages, locale, resolveInitialLocale } from './locale';

describe('locale store (server-safe contract)', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('defaults to English', () => {
		expect(get(locale)).toBe('en');
	});

	it('init is a safe no-op outside the browser', () => {
		expect(() => locale.init()).not.toThrow();
		expect(get(locale)).toBe('en');
	});

	it('setLocale updates in-memory state without browser APIs', () => {
		locale.setLocale('ru');
		expect(get(locale)).toBe('ru');
	});
});

describe('detectLocaleFromLanguages', () => {
	it('detects a supported language from an exact tag', () => {
		expect(detectLocaleFromLanguages(['ru'])).toBe('ru');
		expect(detectLocaleFromLanguages(['en'])).toBe('en');
	});

	it('detects a supported language from a regional variant', () => {
		expect(detectLocaleFromLanguages(['ru-RU'])).toBe('ru');
		expect(detectLocaleFromLanguages(['en-US'])).toBe('en');
		expect(detectLocaleFromLanguages(['en-GB'])).toBe('en');
	});

	it('normalizes casing and underscore separators', () => {
		expect(detectLocaleFromLanguages(['RU'])).toBe('ru');
		expect(detectLocaleFromLanguages(['ru_RU'])).toBe('ru');
		expect(detectLocaleFromLanguages(['  en-US  '])).toBe('en');
	});

	it('prefers the first supported entry in the preference list', () => {
		expect(detectLocaleFromLanguages(['de-DE', 'ru-RU', 'en-US'])).toBe('ru');
		expect(detectLocaleFromLanguages(['fr', 'en-GB'])).toBe('en');
	});

	it('returns null when no entry is supported', () => {
		expect(detectLocaleFromLanguages(['de-DE', 'fr-FR'])).toBeNull();
		expect(detectLocaleFromLanguages([])).toBeNull();
	});

	it('ignores empty entries', () => {
		expect(detectLocaleFromLanguages(['', '   ', 'ru'])).toBe('ru');
		expect(detectLocaleFromLanguages(['', '   '])).toBeNull();
	});

	it('rejects inherited property names', () => {
		expect(detectLocaleFromLanguages(['constructor'])).toBeNull();
		expect(detectLocaleFromLanguages(['toString'])).toBeNull();
		expect(detectLocaleFromLanguages(['__proto__'])).toBeNull();
	});
});

describe('resolveInitialLocale', () => {
	it('honors a saved English choice over browser detection', () => {
		expect(resolveInitialLocale('en', ['ru-RU'])).toBe('en');
	});

	it('honors a saved Russian choice over browser detection', () => {
		expect(resolveInitialLocale('ru', ['en-US'])).toBe('ru');
	});

	it('detects the browser language when nothing is saved', () => {
		expect(resolveInitialLocale(null, ['ru-RU'])).toBe('ru');
		expect(resolveInitialLocale(null, ['en-US'])).toBe('en');
	});

	it('ignores an unsupported saved value', () => {
		expect(resolveInitialLocale('de', ['ru-RU'])).toBe('ru');
		expect(resolveInitialLocale('constructor', ['ru-RU'])).toBe('ru');
		expect(resolveInitialLocale('', ['ru-RU'])).toBe('ru');
		expect(resolveInitialLocale('__proto__', ['ru-RU'])).toBe('ru');
	});

	it('falls back to English when nothing is saved and detection fails', () => {
		expect(resolveInitialLocale(null, ['de-DE'])).toBe('en');
		expect(resolveInitialLocale(null, [])).toBe('en');
	});
});
