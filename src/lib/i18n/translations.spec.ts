import { describe, expect, it } from 'vitest';

import { translations } from './translations';
import {
	collectTranslationLeaves,
	validateTranslationDictionaries,
	type TranslationLocales
} from './translationValidation';

describe('production translation dictionaries', () => {
	it('satisfies the translation dictionary contract', () => {
		expect(validateTranslationDictionaries(translations as unknown as TranslationLocales, 'en')).toEqual(
			[]
		);
	});

	it('keeps a snapshot of the current English leaf count as a growth alarm', () => {
		const english = collectTranslationLeaves(translations.en as never);
		expect(english.length).toBe(1183);
	});
});

describe('object filter placeholders', () => {
	it('uses Russian examples for the batch and tag filters', () => {
		expect(translations.ru.objects.filters.batchPlaceholder).toBe('партия-2026');
		expect(translations.ru.objects.filters.tagPlaceholder).toBe('метка');
	});

	it('keeps the English filter examples unchanged', () => {
		expect(translations.en.objects.filters.batchPlaceholder).toBe('batch-2026');
		expect(translations.en.objects.filters.tagPlaceholder).toBe('tag');
	});
});
