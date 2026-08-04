import { describe, expect, it } from 'vitest';

import { isPublicPath } from './hooks.server';

describe('isPublicPath', () => {
	it('allows login and logout routes', () => {
		expect(isPublicPath('/login')).toBe(true);
		expect(isPublicPath('/login/reset')).toBe(true);
		expect(isPublicPath('/auth/logout')).toBe(true);
	});

	it('protects app routes by default', () => {
		expect(isPublicPath('/')).toBe(false);
		expect(isPublicPath('/ingestion')).toBe(false);
		expect(isPublicPath('/objects/OBJ-1')).toBe(false);
		expect(isPublicPath('/prototype')).toBe(false);
		expect(isPublicPath('/ingestion-proto')).toBe(false);
	});
});
