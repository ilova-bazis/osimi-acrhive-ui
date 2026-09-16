import { describe, expect, it } from 'vitest';
import {
	getEffectiveDateFromEditor,
	getItemDefaultsBadgeState,
	normalizeTags,
	areTagSetsEqual
} from './itemDefaultsBadge';

describe('getEffectiveDateFromEditor', () => {
	it('returns null when precision is none or missing', () => {
		expect(getEffectiveDateFromEditor(null)).toBeNull();
		expect(getEffectiveDateFromEditor(undefined)).toBeNull();
		expect(getEffectiveDateFromEditor({ precision: 'none', year: '1945' })).toBeNull();
	});

	it('extracts year precision without truncation from other fields', () => {
		expect(
			getEffectiveDateFromEditor({
				precision: 'year',
				year: '1945',
				month: '1945-08',
				approximate: true
			})
		).toEqual({
			value: '1945',
			approximate: true
		});
	});

	it('extracts month precision accurately', () => {
		expect(
			getEffectiveDateFromEditor({
				precision: 'month',
				year: '1945',
				month: '1945-08',
				approximate: false
			})
		).toEqual({
			value: '1945-08',
			approximate: false
		});
	});

	it('extracts day precision accurately', () => {
		expect(
			getEffectiveDateFromEditor({
				precision: 'day',
				year: '1945',
				month: '1945-08',
				day: '1945-08-14',
				approximate: false
			})
		).toEqual({
			value: '1945-08-14',
			approximate: false
		});
	});

	it('returns null for partial, malformed, or wrong-precision values', () => {
		expect(getEffectiveDateFromEditor({ precision: 'year', year: '1' })).toBeNull();
		expect(getEffectiveDateFromEditor({ precision: 'year', year: '194' })).toBeNull();
		expect(getEffectiveDateFromEditor({ precision: 'year', year: '1945-08' })).toBeNull();
		expect(getEffectiveDateFromEditor({ precision: 'month', month: '1945' })).toBeNull();
		expect(getEffectiveDateFromEditor({ precision: 'month', month: '1945-8' })).toBeNull();
		expect(getEffectiveDateFromEditor({ precision: 'day', day: '1945-08' })).toBeNull();
		expect(getEffectiveDateFromEditor({ precision: 'day', day: 'not-a-date' })).toBeNull();
		expect(
			getEffectiveDateFromEditor({ precision: 'month', year: '1945', month: '' })
		).toBeNull();
	});
});

describe('normalizeTags and areTagSetsEqual', () => {
	it('normalizes, trims, and deduplicates tags', () => {
		const tags = [' history ', 'archive', 'history', '', '  '];
		const set = normalizeTags(tags);
		expect(Array.from(set)).toEqual(['history', 'archive']);
	});

	it('compares tag sets regardless of order', () => {
		const a = normalizeTags(['a', 'b']);
		const b = normalizeTags(['b', 'a', 'b']);
		expect(areTagSetsEqual(a, b)).toBe(true);
	});
});

describe('getItemDefaultsBadgeState', () => {
	it('returns null when no applicable defaults exist', () => {
		const state = getItemDefaultsBadgeState({
			objectMetadata: { title: 'Some Title' },
			defaults: {
				effectiveTitle: '',
				description: '',
				tags: [],
				publicationDate: null
			}
		});
		expect(state).toBeNull();
	});

	it('returns matches-defaults when all applicable defaults match', () => {
		const state = getItemDefaultsBadgeState({
			objectMetadata: {
				title: 'Batch Title',
				description: 'Batch Description',
				tags: ['tag1', 'tag2'],
				date: { value: '1945', approximate: false }
			},
			defaults: {
				effectiveTitle: ' Batch Title ',
				description: 'Batch Description ',
				tags: ['tag2', 'tag1'],
				publicationDate: { value: '1945', approximate: false }
			}
		});
		expect(state).toBe('matches-defaults');
	});

	it('returns mixed when some applicable defaults match and some differ', () => {
		const state = getItemDefaultsBadgeState({
			objectMetadata: {
				title: 'Custom Title',
				description: 'Batch Description',
				tags: ['tag1', 'tag2'],
				date: { value: '1945', approximate: false }
			},
			defaults: {
				effectiveTitle: 'Batch Title',
				description: 'Batch Description',
				tags: ['tag1', 'tag2'],
				publicationDate: { value: '1945', approximate: false }
			}
		});
		expect(state).toBe('mixed');
	});

	it('returns customized when no applicable defaults match', () => {
		const state = getItemDefaultsBadgeState({
			objectMetadata: {
				title: 'Custom Title',
				description: 'Custom Description',
				tags: ['custom-tag'],
				date: { value: '1999', approximate: true }
			},
			defaults: {
				effectiveTitle: 'Batch Title',
				description: 'Batch Description',
				tags: ['tag1', 'tag2'],
				publicationDate: { value: '1945', approximate: false }
			}
		});
		expect(state).toBe('customized');
	});

	it('handles single-default matching and differing scenarios', () => {
		const matching = getItemDefaultsBadgeState({
			objectMetadata: { title: 'Batch Title' },
			defaults: { effectiveTitle: 'Batch Title' }
		});
		expect(matching).toBe('matches-defaults');

		const differing = getItemDefaultsBadgeState({
			objectMetadata: { title: 'Different Title' },
			defaults: { effectiveTitle: 'Batch Title' }
		});
		expect(differing).toBe('customized');
	});
});
