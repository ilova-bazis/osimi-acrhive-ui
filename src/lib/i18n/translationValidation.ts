export const PLACEHOLDER_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export type PlaceholderOccurrence = {
	name: string;
	token: string;
	start: number;
	end: number;
};

export type TemplateSyntaxIssue =
	| { code: 'unmatched-opening-brace'; index: number }
	| { code: 'unmatched-closing-brace'; index: number }
	| { code: 'nested-opening-brace'; index: number; placeholderStart: number }
	| { code: 'placeholder-whitespace'; index: number; token: string }
	| { code: 'invalid-placeholder-name'; index: number; token: string; name: string };

export type ParsedTemplate = {
	occurrences: PlaceholderOccurrence[];
	issues: TemplateSyntaxIssue[];
};

export type TranslationNode = Record<string, unknown>;
export type TranslationLocales = Record<string, TranslationNode>;

export const parseTemplate = (template: string): ParsedTemplate => {
	const occurrences: PlaceholderOccurrence[] = [];
	const issues: TemplateSyntaxIssue[] = [];
	let index = 0;

	while (index < template.length) {
		const char = template[index];
		if (char === '}') {
			issues.push({ code: 'unmatched-closing-brace', index });
			index += 1;
			continue;
		}
		if (char !== '{') {
			index += 1;
			continue;
		}

		const placeholderStart = index;
		const close = template.indexOf('}', index + 1);
		if (close === -1) {
			issues.push({ code: 'unmatched-opening-brace', index });
			break;
		}
		const inner = template.slice(index + 1, close);
		const nestedOpen = inner.indexOf('{');
		if (nestedOpen !== -1) {
			issues.push({
				code: 'nested-opening-brace',
				index: index + 1 + nestedOpen,
				placeholderStart
			});
			index = close + 1;
			continue;
		}
		const token = template.slice(index, close + 1);
		if (/\s/.test(inner)) {
			issues.push({ code: 'placeholder-whitespace', index, token });
			index = close + 1;
			continue;
		}
		if (!PLACEHOLDER_NAME_PATTERN.test(inner)) {
			issues.push({ code: 'invalid-placeholder-name', index, token, name: inner });
			index = close + 1;
			continue;
		}
		occurrences.push({ name: inner, token, start: index, end: close + 1 });
		index = close + 1;
	}

	return { occurrences, issues };
};

export const placeholderSignature = (
	occurrences: readonly PlaceholderOccurrence[]
): readonly (readonly [name: string, count: number])[] => {
	const counts = new Map<string, number>();
	for (const occurrence of occurrences) {
		counts.set(occurrence.name, (counts.get(occurrence.name) ?? 0) + 1);
	}
	return [...counts.entries()]
		.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
		.map(([name, count]) => [name, count] as const);
};

const isPlainObject = (value: unknown): value is TranslationNode =>
	typeof value === 'object' &&
	value !== null &&
	!Array.isArray(value) &&
	(Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

const describeSyntaxIssue = (locale: string, path: string, issue: TemplateSyntaxIssue): string => {
	switch (issue.code) {
		case 'unmatched-opening-brace':
			return `locale "${locale}", key "${path}": unmatched opening brace "{" at index ${issue.index}.`;
		case 'unmatched-closing-brace':
			return `locale "${locale}", key "${path}": unmatched closing brace "}" at index ${issue.index}.`;
		case 'nested-opening-brace':
			return `locale "${locale}", key "${path}": nested opening brace "{" at index ${issue.index} in placeholder starting at index ${issue.placeholderStart}.`;
		case 'placeholder-whitespace':
			return `locale "${locale}", key "${path}": placeholder ${JSON.stringify(issue.token)} at index ${issue.index} contains whitespace.`;
		case 'invalid-placeholder-name':
			return `locale "${locale}", key "${path}": invalid placeholder ${JSON.stringify(issue.token)} at index ${issue.index}; expected /^[A-Za-z_][A-Za-z0-9_]*$/.`;
	}
};

export const validateTranslationDictionaries = (
	dictionaries: TranslationLocales,
	referenceLocale: string
): string[] => {
	const diagnostics: string[] = [];
	const reference = dictionaries[referenceLocale];
	if (!isPlainObject(reference)) {
		diagnostics.push(`reference locale "${referenceLocale}" is missing.`);
		return diagnostics;
	}

	type Collected = {
		leaves: Map<string, string>;
		cleanPlaceholders: Map<string, PlaceholderOccurrence[]>;
	};

	const collect = (dictionary: TranslationNode, locale: string): Collected => {
		const leaves = new Map<string, string>();
		const cleanPlaceholders = new Map<string, PlaceholderOccurrence[]>();
		const visit = (node: TranslationNode, path: string): void => {
			for (const [key, value] of Object.entries(node)) {
				if (key.includes('.')) {
					diagnostics.push(
						`locale "${locale}", key "${path}${key}": dictionary property "${key}" contains ".".`
					);
					continue;
				}
				const fullPath = path ? `${path}.${key}` : key;
				if (typeof value === 'string') {
					if (value.trim().length === 0) {
						diagnostics.push(`locale "${locale}", key "${fullPath}": translation is empty.`);
						continue;
					}
					leaves.set(fullPath, value);
					const parsed = parseTemplate(value);
					for (const issue of parsed.issues) {
						diagnostics.push(describeSyntaxIssue(locale, fullPath, issue));
					}
					if (parsed.issues.length === 0) {
						cleanPlaceholders.set(fullPath, parsed.occurrences);
					}
					const firstIndex = new Map<string, number>();
					for (const occurrence of parsed.occurrences) {
						const first = firstIndex.get(occurrence.name);
						if (first !== undefined) {
							diagnostics.push(
								`locale "${locale}", key "${fullPath}": duplicate placeholder ${JSON.stringify(occurrence.token)} at index ${occurrence.start}; first occurrence is at index ${first}.`
							);
						} else {
							firstIndex.set(occurrence.name, occurrence.start);
						}
					}
				} else if (isPlainObject(value)) {
					visit(value, fullPath);
				} else {
					diagnostics.push(
						`locale "${locale}", key "${fullPath}": value must be a string or plain object; received ${Array.isArray(value) ? 'array' : typeof value}.`
					);
				}
			}
		};
		visit(dictionary, '');
		return { leaves, cleanPlaceholders };
	};

	const referenceCollected = collect(reference, referenceLocale);
	for (const [locale, dictionary] of Object.entries(dictionaries)) {
		if (locale === referenceLocale) continue;
		if (!isPlainObject(dictionary)) {
			diagnostics.push(`locale "${locale}": dictionary must be a plain object.`);
			continue;
		}
		const collected = collect(dictionary, locale);

		const referencePaths = [...referenceCollected.leaves.keys()].sort();
		const otherPaths = [...collected.leaves.keys()].sort();
		const otherSet = new Set(otherPaths);
		const referenceSet = new Set(referencePaths);
		const missing = referencePaths.filter((path) => !otherSet.has(path));
		const extra = otherPaths.filter((path) => !referenceSet.has(path));
		for (const path of missing) {
			diagnostics.push(`locale "${locale}": missing key "${path}".`);
		}
		for (const path of extra) {
			diagnostics.push(`locale "${locale}": extra key "${path}".`);
		}

		for (const [path, referenceOccurrences] of referenceCollected.cleanPlaceholders) {
			const otherOccurrences = collected.cleanPlaceholders.get(path);
			if (!otherOccurrences) continue;
			const referenceSignature = placeholderSignature(referenceOccurrences);
			const otherSignature = placeholderSignature(otherOccurrences);
			if (JSON.stringify(referenceSignature) !== JSON.stringify(otherSignature)) {
				diagnostics.push(
					`locale "${locale}", key "${path}": placeholder mismatch with "${referenceLocale}"; ${referenceLocale}=${JSON.stringify(referenceSignature)} ${locale}=${JSON.stringify(otherSignature)}.`
				);
			}
		}
	}

	return diagnostics;
};

export const collectTranslationLeaves = (dictionary: TranslationNode): string[] => {
	if (!isPlainObject(dictionary)) {
		throw new Error('Dictionary must be a plain object.');
	}
	const paths: string[] = [];
	const visit = (node: TranslationNode, path: string): void => {
		for (const [key, value] of Object.entries(node)) {
			const fullPath = path ? `${path}.${key}` : key;
			if (typeof value === 'string') {
				paths.push(fullPath);
			} else if (isPlainObject(value)) {
				visit(value, fullPath);
			}
		}
	};
	visit(dictionary, '');
	return paths;
};
