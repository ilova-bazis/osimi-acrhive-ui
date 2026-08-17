import { describe, expect, it } from 'vitest';

import { formatCount, formatDateTime, formatFileSize, selectPluralForm } from './format';

const FIXED_UTC_EXPECTATIONS: Record<string, [string, string, string]> = {
	en: ['2026-08-04T23:59:00.000Z', 'Aug 4, 2026, 11:59 PM', ''],
	ru: ['2026-08-04T23:59:00.000Z', '4 авг. 2026 г., 23:59', '']
};

describe('formatting helper browser runtime parity', () => {
	it('produces fixed UTC output in the browser for English', () => {
		expect(formatDateTime('2026-08-04T12:34:56.000Z', 'en')).toMatch(/12:34/);
		expect(formatDateTime('not-a-date', 'en', 'Unknown')).toBe('Unknown');
	});

	it('produces fixed UTC output in the browser for Russian', () => {
		expect(formatDateTime('2026-08-04T23:59:00.000Z', 'ru')).toMatch(/23:59/);
	});

	it('matches the fixed server-side expectations exactly', () => {
		for (const locale of Object.keys(FIXED_UTC_EXPECTATIONS) as ('en' | 'ru')[]) {
			const [value, expected] = FIXED_UTC_EXPECTATIONS[locale];
			expect(formatDateTime(value, locale)).toBe(expected);
		}
	});

	it('produces locale-aware counts and sizes in the browser', () => {
		expect(formatCount(1234, 'en')).toBe('1,234');
		expect(formatCount(1234, 'ru')).toMatch(/1[ \u00a0\u202f]234/);
		expect(formatFileSize(1536, 'en')).toBe('1.5 KB');
		expect(formatFileSize(1536, 'ru')).toBe('1,5 KB');
		expect(formatFileSize(Number.NaN, 'en')).toBe('0 B');
	});

	it('selects identical plural categories in the browser', () => {
		expect(selectPluralForm(1, 'ru')).toBe('one');
		expect(selectPluralForm(2, 'ru')).toBe('few');
		expect(selectPluralForm(5, 'ru')).toBe('many');
		expect(selectPluralForm(21, 'ru')).toBe('one');
	});
});
