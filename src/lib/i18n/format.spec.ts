import { describe, expect, it } from 'vitest';

import { formatCount, formatDateTime, formatFileSize, selectPluralForm } from './format';

describe('locale formatting helpers', () => {
	it('formats timestamps with date and time in UTC', () => {
		expect(formatDateTime('2026-08-04T12:34:56.000Z', 'en')).toMatch(/12:34/);
	});

	it('applies the active locale to timestamps', () => {
		expect(formatDateTime('2026-08-04T12:34:56.000Z', 'ru')).toMatch(/12:34/);
	});

	it('uses an explicit UTC timezone so server and browser agree', () => {
		expect(formatDateTime('2026-08-04T23:59:00.000Z', 'en')).toMatch(/11:59/);
	});

	it('does not roll the UTC date across a day boundary', () => {
		expect(formatDateTime('2026-08-04T23:59:00.000Z', 'en', 'Unknown')).toContain('Aug 4');
	});

	it('matches the fixed expected UTC strings used by the browser harness', () => {
		expect(formatDateTime('2026-08-04T23:59:00.000Z', 'en')).toBe('Aug 4, 2026, 11:59 PM');
		expect(formatDateTime('2026-08-04T23:59:00.000Z', 'ru')).toBe('4 авг. 2026 г., 23:59');
	});

	it('returns the fallback for invalid timestamps', () => {
		expect(formatDateTime('not-a-date', 'en', 'Unknown')).toBe('Unknown');
	});

	it('returns the fallback for missing timestamps', () => {
		expect(formatDateTime(null, 'en', 'Unknown')).toBe('Unknown');
	});

	it('formats counts with locale-aware grouping', () => {
		expect(formatCount(1234, 'en')).toBe('1,234');
		expect(formatCount(1234, 'ru')).toMatch(/1[ \u00a0\u202f]234/);
	});

	it('normalizes non-finite counts to zero', () => {
		expect(formatCount(Number.NaN, 'en')).toBe('0');
		expect(formatCount(Number.POSITIVE_INFINITY, 'ru')).toBe('0');
	});

	it('formats byte sizes below 1024 with locale-aware grouping', () => {
		expect(formatFileSize(999, 'en')).toBe('999 B');
	});

	it('formats kilobyte and megabyte ranges with one decimal digit', () => {
		expect(formatFileSize(1536, 'en')).toBe('1.5 KB');
		expect(formatFileSize(1048576, 'en')).toBe('1 MB');
	});

	it('formats gigabyte ranges', () => {
		expect(formatFileSize(2 * 1024 * 1024 * 1024, 'en')).toBe('2 GB');
	});

	it('uses a localized decimal separator above bytes', () => {
		expect(formatFileSize(1536, 'ru')).toBe('1,5 KB');
	});

	it('collapses non-positive byte values to zero bytes', () => {
		expect(formatFileSize(0, 'en')).toBe('0 B');
		expect(formatFileSize(-500, 'en')).toBe('0 B');
	});

	it('never emits NaN or undefined for invalid byte values', () => {
		expect(formatFileSize(Number.NaN, 'en')).toBe('0 B');
		expect(formatFileSize(Number.NEGATIVE_INFINITY, 'en')).toBe('0 B');
		expect(formatFileSize(Number.POSITIVE_INFINITY, 'en')).toBe('0 B');
	});

	it('clamps oversized byte values into the largest unit', () => {
		expect(formatFileSize(Number.MAX_SAFE_INTEGER, 'en')).toMatch(/PB$/);
	});

	describe('selectPluralForm', () => {
		it('selects English one/other categories', () => {
			expect(selectPluralForm(1, 'en')).toBe('one');
			expect(selectPluralForm(0, 'en')).toBe('other');
			expect(selectPluralForm(2, 'en')).toBe('other');
			expect(selectPluralForm(11, 'en')).toBe('other');
			expect(selectPluralForm(21, 'en')).toBe('other');
		});

		it('selects Russian one/few/many categories at boundaries', () => {
			expect(selectPluralForm(0, 'ru')).toBe('many');
			expect(selectPluralForm(1, 'ru')).toBe('one');
			expect(selectPluralForm(2, 'ru')).toBe('few');
			expect(selectPluralForm(5, 'ru')).toBe('many');
			expect(selectPluralForm(11, 'ru')).toBe('many');
			expect(selectPluralForm(21, 'ru')).toBe('one');
			expect(selectPluralForm(22, 'ru')).toBe('few');
			expect(selectPluralForm(25, 'ru')).toBe('many');
		});

		it('normalizes non-finite counts for plural selection', () => {
			expect(selectPluralForm(Number.NaN, 'ru')).toBe('many');
			expect(selectPluralForm(Number.POSITIVE_INFINITY, 'ru')).toBe('many');
		});
	});
});
