import { describe, expect, it } from 'vitest';

import { mapApiErrorStatus } from './routeGuards';

describe('mapApiErrorStatus', () => {
	it('preserves backend validation failures', () => {
		expect(mapApiErrorStatus(422)).toBe(422);
	});

	it('maps unrecognized backend failures to 502', () => {
		expect(mapApiErrorStatus(500)).toBe(502);
	});
});
