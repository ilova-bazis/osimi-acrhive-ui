import { describe, expect, it } from 'vitest';
import { normalizeObjectsReturnTo, withObjectsReturnTo } from './navigation';

describe('object navigation', () => {
	it('preserves production object-list filters', () => {
		expect(normalizeObjectsReturnTo('/objects?q=ledger&sort=title_asc')).toBe('/objects?q=ledger&sort=title_asc');
		expect(withObjectsReturnTo('/objects/OBJ-20260804-ABC123', '/objects?q=ledger')).toBe(
			'/objects/OBJ-20260804-ABC123?returnTo=%2Fobjects%3Fq%3Dledger',
		);
	});

	it('rejects non-list and prototype return targets', () => {
		expect(normalizeObjectsReturnTo('/prototype/objects')).toBe('/objects');
		expect(normalizeObjectsReturnTo('/objects/OBJ-20260804-ABC123')).toBe('/objects');
		expect(normalizeObjectsReturnTo('//example.test/objects')).toBe('/objects');
	});
});
