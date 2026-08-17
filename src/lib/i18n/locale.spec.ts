import { get } from 'svelte/store';
import { afterEach, describe, expect, it } from 'vitest';

import { locale } from './locale';

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
