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
		expect(english.length).toBe(1125);
	});
});
