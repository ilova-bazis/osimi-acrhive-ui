export type ItemDefaultsBadgeState =
	| 'matches-defaults'
	| 'mixed'
	| 'customized'
	| null;

export type PrecisionDateEditorLike = {
	precision?: 'none' | 'year' | 'month' | 'day';
	year?: string;
	month?: string;
	day?: string;
	approximate?: boolean;
};

export type ItemDateLike = {
	value: string | null;
	approximate?: boolean;
} | null | undefined;

export const getEffectiveDateFromEditor = (
	editor: PrecisionDateEditorLike | null | undefined
): { value: string; approximate: boolean } | null => {
	if (!editor || !editor.precision || editor.precision === 'none') {
		return null;
	}
	let raw = '';
	if (editor.precision === 'year') {
		raw = editor.year?.trim() ?? '';
	} else if (editor.precision === 'month') {
		raw = editor.month?.trim() ?? '';
	} else if (editor.precision === 'day') {
		raw = editor.day?.trim() ?? '';
	}
	const pattern =
		editor.precision === 'year'
			? /^\d{4}$/
			: editor.precision === 'month'
				? /^\d{4}-\d{2}$/
				: /^\d{4}-\d{2}-\d{2}$/;
	if (!pattern.test(raw)) return null;
	return {
		value: raw,
		approximate: Boolean(editor.approximate)
	};
};

export type ItemDefaultsComparisonInput = {
	objectMetadata: {
		title?: string | undefined;
		date?: ItemDateLike;
		tags?: readonly string[] | undefined;
		description?: string | undefined;
	} | null | undefined;
	defaults: {
		effectiveTitle?: string | undefined;
		publicationDate?: { value: string; approximate: boolean } | null | undefined;
		tags?: readonly string[] | undefined;
		description?: string | undefined;
	};
};

export const normalizeTags = (tags: readonly string[] | null | undefined): Set<string> => {
	const set = new Set<string>();
	if (!tags) return set;
	for (const tag of tags) {
		const trimmed = (tag ?? '').trim();
		if (trimmed) set.add(trimmed);
	}
	return set;
};

export const areTagSetsEqual = (a: Set<string>, b: Set<string>): boolean => {
	if (a.size !== b.size) return false;
	for (const item of a) {
		if (!b.has(item)) return false;
	}
	return true;
};

export const getItemDefaultsBadgeState = (
	input: ItemDefaultsComparisonInput
): ItemDefaultsBadgeState => {
	const objectMeta = input.objectMetadata ?? {};
	const defaults = input.defaults;

	const effectiveTitleDefault = (defaults.effectiveTitle ?? '').trim();
	const effectiveDescDefault = (defaults.description ?? '').trim();
	const defaultTagsSet = normalizeTags(defaults.tags);
	const defaultPubDate = defaults.publicationDate?.value ? defaults.publicationDate : null;

	const hasTitleDefault = effectiveTitleDefault.length > 0;
	const hasDescDefault = effectiveDescDefault.length > 0;
	const hasTagsDefault = defaultTagsSet.size > 0;
	const hasDateDefault = defaultPubDate !== null;

	const applicableDefaultsCount =
		(hasTitleDefault ? 1 : 0) +
		(hasDescDefault ? 1 : 0) +
		(hasTagsDefault ? 1 : 0) +
		(hasDateDefault ? 1 : 0);

	if (applicableDefaultsCount === 0) {
		return null;
	}

	let matchingFieldsCount = 0;

	if (hasTitleDefault) {
		const objTitle = (objectMeta.title ?? '').trim();
		if (objTitle === effectiveTitleDefault) {
			matchingFieldsCount += 1;
		}
	}

	if (hasDescDefault) {
		const objDesc = (objectMeta.description ?? '').trim();
		if (objDesc === effectiveDescDefault) {
			matchingFieldsCount += 1;
		}
	}

	if (hasTagsDefault) {
		const objTagsSet = normalizeTags(objectMeta.tags);
		if (areTagSetsEqual(objTagsSet, defaultTagsSet)) {
			matchingFieldsCount += 1;
		}
	}

	if (hasDateDefault) {
		const objDate = objectMeta.date;
		if (
			objDate &&
			objDate.value === defaultPubDate.value &&
			Boolean(objDate.approximate) === Boolean(defaultPubDate.approximate)
		) {
			matchingFieldsCount += 1;
		}
	}

	if (matchingFieldsCount === applicableDefaultsCount) {
		return 'matches-defaults';
	}
	if (matchingFieldsCount === 0) {
		return 'customized';
	}
	return 'mixed';
};
