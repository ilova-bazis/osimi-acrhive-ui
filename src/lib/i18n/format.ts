import type { LocaleKey } from './translations';

export type PluralCategory = 'one' | 'few' | 'many' | 'other';

const SUPPORTED_PLURAL_CATEGORIES = new Set<string>(['one', 'few', 'many', 'other']);

export const selectPluralForm = (count: number, locale: LocaleKey): PluralCategory => {
	const safeCount = Number.isFinite(count) ? count : 0;
	const category = new Intl.PluralRules(locale).select(safeCount);
	return SUPPORTED_PLURAL_CATEGORIES.has(category) ? (category as PluralCategory) : 'other';
};

export const formatDateTime = (
	value: string | null,
	locale: LocaleKey,
	fallback = ''
): string => {
	if (!value) return fallback;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return fallback;
	return new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC'
	}).format(date);
};

export const formatCount = (value: number, locale: LocaleKey): string => {
	if (!Number.isFinite(value)) return '0';
	return new Intl.NumberFormat(locale).format(value);
};

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

export const formatFileSize = (bytes: number, locale: LocaleKey): string => {
	if (!Number.isFinite(bytes) || bytes <= 0) return `0 ${FILE_SIZE_UNITS[0]}`;
	const bounded = Math.min(bytes, Number.MAX_SAFE_INTEGER);
	const unitIndex = Math.min(
		Math.floor(bounded === 0 ? 0 : Math.log(bounded) / Math.log(1024)),
		FILE_SIZE_UNITS.length - 1
	);
	const value = bounded / Math.pow(1024, unitIndex);
	const formatter = new Intl.NumberFormat(locale, {
		maximumFractionDigits: unitIndex === 0 ? 0 : 1
	});
	return `${formatter.format(value)} ${FILE_SIZE_UNITS[unitIndex]}`;
};
