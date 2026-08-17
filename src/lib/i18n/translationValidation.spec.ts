import { describe, expect, it } from 'vitest';
import {
	parseTemplate,
	placeholderSignature,
	validateTranslationDictionaries,
	collectTranslationLeaves
} from './translationValidation';

const dictionaries = (entries: Record<string, unknown>): Record<string, Record<string, unknown>> =>
	entries as Record<string, Record<string, unknown>>;

describe('parseTemplate', () => {
	it('parses a template without placeholders', () => {
		expect(parseTemplate('Plain text')).toEqual({ occurrences: [], issues: [] });
	});

	it('parses one valid placeholder', () => {
		const parsed = parseTemplate('Hello {name}');
		expect(parsed.issues).toEqual([]);
		expect(parsed.occurrences).toHaveLength(1);
		expect(parsed.occurrences[0]).toMatchObject({ name: 'name', token: '{name}', start: 6, end: 12 });
	});

	it('accepts underscore starts and digits after the first character', () => {
		expect(parseTemplate('{_name} {name2}').issues).toEqual([]);
		expect(parseTemplate('{fileName} {SUPPORTED}').issues).toEqual([]);
	});

	it('keeps Unicode surrounding text intact', () => {
		const parsed = parseTemplate('Привет, {name}!');
		expect(parsed.issues).toEqual([]);
		expect(parsed.occurrences[0]?.name).toBe('name');
	});

	it('rejects a leading digit', () => {
		const parsed = parseTemplate('{9name}');
		expect(parsed.issues).toEqual([
			{ code: 'invalid-placeholder-name', index: 0, token: '{9name}', name: '9name' }
		]);
		expect(parsed.occurrences).toEqual([]);
	});

	it.each([
		['{a-b}', 'a-b'],
		['{a.b}', 'a.b'],
		['{é}', 'é'],
		['{}', '']
	])('rejects the invalid name %s', (template, name) => {
		const parsed = parseTemplate(template);
		expect(parsed.issues).toEqual([
			{ code: 'invalid-placeholder-name', index: 0, token: template, name }
		]);
		expect(parsed.occurrences).toEqual([]);
	});

	it.each([
		['{ name}', '{ name}'],
		['{name }', '{name }'],
		['{first name}', '{first name}']
	])('rejects whitespace inside %s', (template, token) => {
		const parsed = parseTemplate(template);
		expect(parsed.issues).toEqual([{ code: 'placeholder-whitespace', index: 0, token }]);
		expect(parsed.occurrences).toEqual([]);
	});

	it('rejects an unmatched opening brace', () => {
		expect(parseTemplate('Use {name').issues).toEqual([
			{ code: 'unmatched-opening-brace', index: 4 }
		]);
	});

	it('rejects an unmatched closing brace', () => {
		expect(parseTemplate('Use } now').issues).toEqual([
			{ code: 'unmatched-closing-brace', index: 4 }
		]);
	});

	it('rejects doubled braces as nesting, not an escape', () => {
		expect(parseTemplate('{{name}}').issues).toEqual([
			{ code: 'nested-opening-brace', index: 1, placeholderStart: 0 },
			{ code: 'unmatched-closing-brace', index: 7 }
		]);
		expect(parseTemplate('{{name}}').occurrences).toEqual([]);
	});

	it('never exposes an inner token of a nested construct', () => {
		const parsed = parseTemplate('{outer{inner}}');
		expect(parsed.occurrences).toEqual([]);
		expect(parsed.issues).toContainEqual({
			code: 'nested-opening-brace',
			index: 6,
			placeholderStart: 0
		});
	});

	it('does not treat valid duplicate tokens as syntax issues', () => {
		const parsed = parseTemplate('{count} and {count}');
		expect(parsed.issues).toEqual([]);
		expect(parsed.occurrences).toHaveLength(2);
	});
});

describe('placeholderSignature', () => {
	it('sorts entries by name instead of insertion order', () => {
		const first = parseTemplate('{first} {second}');
		const second = parseTemplate('{second} {first}');
		expect(placeholderSignature(first.occurrences)).toEqual([
			['first', 1],
			['second', 1]
		]);
		expect(placeholderSignature(second.occurrences)).toEqual(
			placeholderSignature(first.occurrences)
		);
	});

	it('counts repeated names', () => {
		const parsed = parseTemplate('{a} {b} {a}');
		expect(placeholderSignature(parsed.occurrences)).toEqual([
			['a', 2],
			['b', 1]
		]);
	});
});

describe('validateTranslationDictionaries', () => {
	it('accepts dictionaries with valid parity and no placeholders', () => {
		const diagnostics = validateTranslationDictionaries(
			dictionaries({
				en: { common: { cancel: 'Cancel', save: 'Save' } },
				ru: { common: { cancel: 'Отмена', save: 'Сохранить' } }
			}),
			'en'
		);
		expect(diagnostics).toEqual([]);
	});

	it('accepts a valid placeholder reordering across locales', () => {
		const diagnostics = validateTranslationDictionaries(
			dictionaries({
				en: { x: 'Meet {first} and {second}' },
				ru: { x: 'Встретьте {second} и {first}' }
			}),
			'en'
		);
		expect(diagnostics).toEqual([]);
	});

	it('rejects renamed placeholders with an exact diagnostic', () => {
		const diagnostics = validateTranslationDictionaries(
			dictionaries({
				en: { x: '{first} {second}' },
				ru: { x: '{first} {third}' }
			}),
			'en'
		);
		expect(diagnostics).toEqual([
			'locale "ru", key "x": placeholder mismatch with "en"; en=[["first",1],["second",1]] ru=[["first",1],["third",1]].'
		]);
	});

	it('rejects added, removed, and count-changed placeholders', () => {
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: '{first} {second}' }, ru: { x: '{first}' } }),
				'en'
			)
		).toHaveLength(1);
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: '{first}' }, ru: { x: '{first} {second}' } }),
				'en'
			)
		).toHaveLength(1);
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: '{first} {first}' }, ru: { x: '{first}' } }),
				'en'
			)
		).toHaveLength(2);
	});

	it('rejects malformed templates with exact diagnostics', () => {
		const diagnostics = validateTranslationDictionaries(
			dictionaries({
				en: { x: 'Invalid {9name}' },
				ru: { x: 'Invalid {9name}' }
			}),
			'en'
		);
		expect(diagnostics).toContain(
			'locale "en", key "x": invalid placeholder "{9name}" at index 8; expected /^[A-Za-z_][A-Za-z0-9_]*$/.'
		);
		expect(diagnostics).toContain(
			'locale "ru", key "x": invalid placeholder "{9name}" at index 8; expected /^[A-Za-z_][A-Za-z0-9_]*$/.'
		);
	});

	it('rejects unmatched braces with exact diagnostics', () => {
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: 'Open {name' }, ru: { x: 'Open {name' } }),
				'en'
			)
		).toContain('locale "en", key "x": unmatched opening brace "{" at index 5.');
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: 'Close } now' }, ru: { x: 'Close } now' } }),
				'en'
			)
		).toContain('locale "en", key "x": unmatched closing brace "}" at index 6.');
	});

	it('rejects whitespace placeholders with exact diagnostics', () => {
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: '{ name}' }, ru: { x: '{ name}' } }),
				'en'
			)
		).toContain('locale "en", key "x": placeholder "{ name}" at index 0 contains whitespace.');
	});

	it('rejects nested braces with exact diagnostics', () => {
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: '{{name}}' }, ru: { x: '{{name}}' } }),
				'en'
			)
		).toContain(
			'locale "en", key "x": nested opening brace "{" at index 1 in placeholder starting at index 0.'
		);
	});

	it('rejects duplicate placeholders with exact diagnostics', () => {
		const diagnostics = validateTranslationDictionaries(
			dictionaries({
				en: { x: '{count} of {count}' },
				ru: { x: '{count} из {count}' }
			}),
			'en'
		);
		expect(diagnostics).toContain(
			'locale "en", key "x": duplicate placeholder "{count}" at index 11; first occurrence is at index 0.'
		);
	});

	it('reports missing and extra keys deterministically', () => {
		const diagnostics = validateTranslationDictionaries(
			dictionaries({
				en: { a: 'A', b: 'B', c: 'C' },
				ru: { a: 'А', c: 'С', d: 'Д' }
			}),
			'en'
		);
		expect(diagnostics).toEqual([
			'locale "ru": missing key "b".',
			'locale "ru": extra key "d".'
		]);
	});

	it('reports empty translations', () => {
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: '   ' }, ru: { x: '   ' } }),
				'en'
			)
		).toContain('locale "en", key "x": translation is empty.');
	});

	it('reports non-string leaves', () => {
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: 7 }, ru: { x: 7 } }),
				'en'
			)
		).toContain('locale "en", key "x": value must be a string or plain object; received number.');
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: [1] }, ru: { x: [1] } }),
				'en'
			)
		).toContain('locale "en", key "x": value must be a string or plain object; received array.');
	});

	it('reports dotted property names', () => {
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { 'bad.name': 'x' }, ru: { 'bad.name': 'x' } }),
				'en'
			)
		).toContain('locale "en", key "bad.name": dictionary property "bad.name" contains ".".');
	});

	it('reports a missing reference locale', () => {
		expect(validateTranslationDictionaries(dictionaries({ ru: { x: 'x' } }), 'en')).toEqual([
			'reference locale "en" is missing.'
		]);
	});

	it('reports a non-object locale', () => {
		expect(
			validateTranslationDictionaries(
				dictionaries({ en: { x: 'X' }, ru: 'broken' as unknown as Record<string, unknown> }),
				'en'
			)
		).toContain('locale "ru": dictionary must be a plain object.');
	});

	it('suppresses parity diagnostics for leaves with syntax issues', () => {
		const diagnostics = validateTranslationDictionaries(
			dictionaries({ en: { x: '{9name}' }, ru: { x: '{name}' } }),
			'en'
		);
		expect(diagnostics.some((entry) => entry.includes('placeholder mismatch'))).toBe(false);
	});
});

describe('collectTranslationLeaves', () => {
	it('collects nested leaf paths', () => {
		expect(collectTranslationLeaves({ a: { b: 'x' }, c: 'y' })).toEqual(['a.b', 'c']);
	});

	it('throws for non-plain-object dictionaries', () => {
		expect(() => collectTranslationLeaves(null as unknown as Record<string, unknown>)).toThrow();
	});
});
