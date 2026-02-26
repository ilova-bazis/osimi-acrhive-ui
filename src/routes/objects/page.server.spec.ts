import { describe, expect, it } from 'vitest';
import { _parseObjectsFilters } from './+page.server';

describe('parseObjectsFilters', () => {
	it('normalizes allowed enum values and text params', () => {
		const url = new URL('https://example.test/objects?q=test&availability_state=AVAILABLE&access_level=family&sort=updated_at_desc&language=en&batch_label=batch-1&type=DOCUMENT&from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z&tag=history&cursor=abc&limit=50');

		const parsed = _parseObjectsFilters(url);

		expect(parsed).toMatchObject({
			q: 'test',
			availabilityState: 'AVAILABLE',
			accessLevel: 'family',
			sort: 'updated_at_desc',
			language: 'en',
			batchLabel: 'batch-1',
			type: 'DOCUMENT',
			from: '2026-01-01T00:00:00Z',
			to: '2026-12-31T23:59:59Z',
			tag: 'history',
			cursor: 'abc',
			limit: 50
		});
	});

	it('drops invalid enum values and clamps limit', () => {
		const url = new URL('https://example.test/objects?availability_state=INVALID&access_level=oops&sort=bad&limit=500');

		const parsed = _parseObjectsFilters(url);

		expect(parsed.availabilityState).toBeUndefined();
		expect(parsed.accessLevel).toBeUndefined();
		expect(parsed.sort).toBe('created_at_desc');
		expect(parsed.limit).toBe(200);
	});
});
