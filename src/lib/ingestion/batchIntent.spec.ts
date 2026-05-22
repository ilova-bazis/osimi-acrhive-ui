import { describe, expect, it } from 'vitest';

import {
	applyClassificationSelection,
	applyItemKindSelection,
	resolveBatchIntent,
	type BatchIntent
} from './batchIntent';

describe('batchIntent helpers', () => {
	it('derives item kind from classification when backend item kind is missing', () => {
		expect(
			resolveBatchIntent({
				classificationType: 'magazine_article',
				metadataItemKind: undefined,
				storedItemKind: null
			})
		).toEqual({
			classificationType: 'magazine_article',
			itemKind: 'scanned_document'
		});
	});

	it('prefers stored item kind when it is compatible with the classification', () => {
		expect(
			resolveBatchIntent({
				classificationType: 'magazine_article',
				metadataItemKind: undefined,
				storedItemKind: 'document'
			})
		).toEqual({
			classificationType: 'magazine_article',
			itemKind: 'document'
		});
	});

	it('normalizes incompatible stored item kind back to a valid default', () => {
		expect(
			resolveBatchIntent({
				classificationType: 'image',
				metadataItemKind: undefined,
				storedItemKind: 'document'
			})
		).toEqual({
			classificationType: 'image',
			itemKind: 'photo'
		});
	});

	it('keeps classification and item kind paired when classification changes', () => {
		const current: BatchIntent = {
			classificationType: 'magazine_article',
			itemKind: 'document'
		};

		expect(applyClassificationSelection(current, 'image')).toEqual({
			classificationType: 'image',
			itemKind: 'photo'
		});
	});

	it('keeps classification and item kind paired when item kind changes', () => {
		const current: BatchIntent = {
			classificationType: 'image',
			itemKind: 'photo'
		};

		expect(applyItemKindSelection(current, 'scanned_document')).toEqual({
			classificationType: 'newspaper_article',
			itemKind: 'scanned_document'
		});
	});
});
