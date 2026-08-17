import { describe, expect, it } from 'vitest';

import { translations } from './translations';
import { formatTemplate, lookupTranslation, translate, translateDynamic } from './translate';

const en = translations.en;
const ru = translations.ru;

describe('translation lookup', () => {
	it('resolves shallow and deeply nested keys', () => {
		expect(lookupTranslation(en, 'common.cancel')).toBe('Cancel');
		expect(lookupTranslation(en, 'objects.detail.tabs.files')).toBe('Files');
		expect(lookupTranslation(ru, 'objects.detail.tabs.files')).toBe('Файлы');
	});

	it('resolves a translated value equal to its own key', () => {
		expect(lookupTranslation({ x: { y: 'x.y' } }, 'x.y')).toBe('x.y');
	});

	it('returns undefined for a missing first segment', () => {
		expect(lookupTranslation(en, 'missing.cancel')).toBeUndefined();
	});

	it('returns undefined for a missing middle segment', () => {
		expect(lookupTranslation(en, 'objects.missing.tabs.files')).toBeUndefined();
	});

	it('returns undefined for a missing final segment', () => {
		expect(lookupTranslation(en, 'objects.detail.tabs.missing')).toBeUndefined();
	});

	it('returns undefined for an object-valued terminal path', () => {
		expect(lookupTranslation(en, 'objects.detail')).toBeUndefined();
	});

	it('returns undefined when traversal passes through a string leaf', () => {
		expect(lookupTranslation(en, 'common.cancel.deep')).toBeUndefined();
	});

	it('never traverses inherited prototype properties', () => {
		expect(lookupTranslation(en, 'constructor')).toBeUndefined();
		expect(lookupTranslation(en, 'toString')).toBeUndefined();
		expect(lookupTranslation(en, '__proto__.toString')).toBeUndefined();
		expect(lookupTranslation(en, 'prototype')).toBeUndefined();
	});

	it('tolerates arrays and null nodes without throwing', () => {
		expect(lookupTranslation({ a: [1, 2] } as unknown as Record<string, unknown>, 'a.b')).toBeUndefined();
		expect(lookupTranslation({ a: null } as unknown as Record<string, unknown>, 'a.b')).toBeUndefined();
	});

	it('treats a translation equal to its key as a successful lookup', () => {
		const dictionary = { dup: { key: 'dup.key' } } as unknown as typeof en;
		expect(translateDynamic(dictionary, 'dup.key', 'fallback')).toBe('dup.key');
	});

	it('returns the key only as a defensive fallback for static translate', () => {
		const dictionary = {} as unknown as typeof en;
		expect(translate(dictionary, 'objects.detail.tabs.files')).toBe('objects.detail.tabs.files');
	});
});

describe('translateDynamic', () => {
	it('returns the explicit fallback for missing keys', () => {
		expect(translateDynamic(en, 'statuses.mystery', 'mystery')).toBe('mystery');
	});

	it('returns the localized value when the key exists', () => {
		expect(translateDynamic(en, 'statuses.uploaded', 'uploaded')).toBe('Uploaded');
		expect(translateDynamic(ru, 'statuses.uploaded', 'uploaded')).toBe('Загружен');
	});

	it('returns the fallback for prototype-related keys', () => {
		expect(translateDynamic(en, 'constructor', 'safe')).toBe('safe');
	});
});

describe('formatTemplate', () => {
	it('replaces string, numeric, and zero values', () => {
		expect(formatTemplate('{a} {b} {c}', { a: 'x', b: 2, c: 0 })).toBe('x 2 0');
	});

	it('replaces repeated placeholders', () => {
		expect(formatTemplate('{n} and {n}', { n: 1 })).toBe('1 and 1');
	});

	it('leaves missing values visible', () => {
		expect(formatTemplate('{a} {b}', { a: 1 })).toBe('1 {b}');
	});

	it('ignores extra supplied values', () => {
		expect(formatTemplate('{a}', { a: 1, b: 2 })).toBe('1');
	});

	it('replaces strict placeholder names only', () => {
		expect(formatTemplate('{_name2}', { _name2: 'ok' })).toBe('ok');
	});

	it('returns malformed templates unchanged', () => {
		expect(formatTemplate('{ name}', { name: 'x' })).toBe('{ name}');
		expect(formatTemplate('{9name}', { '9name': 'x' })).toBe('{9name}');
		expect(formatTemplate('{a-b}', { 'a-b': 'x' })).toBe('{a-b}');
	});

	it('returns unmatched braces unchanged', () => {
		expect(formatTemplate('Open {name', { name: 'x' })).toBe('Open {name');
		expect(formatTemplate('Close } now', {})).toBe('Close } now');
	});

	it('never partially interpolates a nested construct', () => {
		expect(formatTemplate('{outer{inner}}', { inner: 'x' })).toBe('{outer{inner}}');
	});

	it('returns doubled braces unchanged instead of escaping them', () => {
		expect(formatTemplate('{{name}}', { name: 'x' })).toBe('{{name}}');
	});

	it('does not recursively expand replacement values', () => {
		expect(formatTemplate('{value}', { value: '{other}' })).toBe('{other}');
	});

	it('never substitutes inherited prototype values', () => {
		expect(
			formatTemplate('{a}', Object.create({ a: 'inherited' }) as Record<string, string | number>)
		).toBe('{a}');
	});
});

describe('TranslationKey compile-time typing', () => {
	it('accepts valid static keys at runtime', () => {
		expect(translate(en, 'objects.detail.tabs.files')).toBe('Files');
		expect(translate(en, 'ingestionReview.table.moreFilesOther')).toBe('+{count} more files');
	});

	it('rejects invalid key shapes at compile time', () => {
		// @ts-expect-error detail namespace does not exist at the top level
		void translate(en, 'detail.tabs.files');
		// @ts-expect-error object-valued path is not a leaf
		void translate(en, 'objects.detail.tabs');
		// @ts-expect-error misspelled namespace
		void translate(en, 'objects.details.tabs.files');
		// @ts-expect-error arbitrary string cannot be a static key
		void translate(en, 'arbitrary.backend.value');
		expect(true).toBe(true);
	});

	it('rejects open string values at compile time', () => {
		const dynamicKey: string = 'statuses.uploaded';
		// @ts-expect-error open strings must use translateDynamic
		void translate(en, dynamicKey);
		expect(translateDynamic(en, dynamicKey, 'uploaded')).toBe('Uploaded');
	});

	it('accepts closed template-literal unions', () => {
		type TabId = 'files' | 'access' | 'requests' | 'raw';
		const tab: TabId = 'files';
		expect(translate(en, `objects.detail.tabs.${tab}`)).toBe('Files');
	});
});
