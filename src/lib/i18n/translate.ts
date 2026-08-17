import type { LocaleKey } from './translations';
import { selectPluralForm, type PluralCategory } from './format';
import { parseTemplate } from './translationValidation';
import type { TranslationDictionary, TranslationKey } from './translations';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const lookupTranslation = (
	dictionary: Record<string, unknown>,
	key: string
): string | undefined => {
	const segments = key.split('.');
	let current: unknown = dictionary;
	for (const segment of segments) {
		if (
			!isRecord(current) ||
			!Object.prototype.hasOwnProperty.call(current, segment)
		) {
			return undefined;
		}
		current = current[segment];
	}
	return typeof current === 'string' ? current : undefined;
};

export const translate = (dictionary: TranslationDictionary, key: TranslationKey): string =>
	lookupTranslation(dictionary as Record<string, unknown>, key) ?? key;

export const translateDynamic = (
	dictionary: TranslationDictionary,
	key: string,
	fallback: string
): string => lookupTranslation(dictionary as Record<string, unknown>, key) ?? fallback;

export const formatTemplate = (template: string, values: Record<string, string | number>): string => {
	const parsed = parseTemplate(template);
	if (parsed.issues.length > 0) {
		return template;
	}
	let output = '';
	let cursor = 0;
	for (const occurrence of parsed.occurrences) {
		output += template.slice(cursor, occurrence.start);
		output += Object.prototype.hasOwnProperty.call(values, occurrence.name)
			? String(values[occurrence.name])
			: occurrence.token;
		cursor = occurrence.end;
	}
	output += template.slice(cursor);
	return output;
};

const pluralSuffix = (category: PluralCategory): 'One' | 'Few' | 'Many' | 'Other' => {
	switch (category) {
		case 'one':
			return 'One';
		case 'few':
			return 'Few';
		case 'many':
			return 'Many';
		case 'other':
			return 'Other';
	}
};

export const selectPluralTemplateKey = (base: string, category: PluralCategory): string =>
	`${base}${pluralSuffix(category)}`;

export const formatPlural = (
	dictionary: TranslationDictionary,
	base: string,
	count: number,
	locale: LocaleKey
): string => {
	const category = selectPluralForm(count, locale);
	return translate(dictionary, selectPluralTemplateKey(base, category) as TranslationKey);
};
