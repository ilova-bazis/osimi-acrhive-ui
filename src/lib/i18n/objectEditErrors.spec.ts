import { describe, expect, it } from 'vitest';

import { objectEditErrorKeys, objectEditFieldErrorKeys } from './objectEditErrors';
import { translate } from './translate';
import { translations } from './translations';

describe('object edit error mappings', () => {
	it('localizes every form error code in both locales', () => {
		for (const key of Object.values(objectEditErrorKeys)) {
			expect(translate(translations.en, key)).not.toBe(key);
			expect(translate(translations.ru, key)).not.toBe(key);
		}
	});

	it('localizes every field error code in both locales', () => {
		for (const key of Object.values(objectEditFieldErrorKeys)) {
			expect(translate(translations.en, key)).not.toBe(key);
			expect(translate(translations.ru, key)).not.toBe(key);
		}
	});
});
