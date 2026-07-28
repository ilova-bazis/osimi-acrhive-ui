import { describe, expect, it } from 'vitest';

import { isPublicPath } from './hooks.server';

describe('isPublicPath', () => {
	it('allows login and logout routes', () => {
		expect(isPublicPath('/login')).toBe(true);
		expect(isPublicPath('/login/reset')).toBe(true);
		expect(isPublicPath('/auth/logout')).toBe(true);
	});

	it('allows prototype routes when development prototypes are enabled', () => {
		expect(isPublicPath('/prototype')).toBe(true);
		expect(isPublicPath('/prototype/objects')).toBe(true);
		expect(isPublicPath('/ingestion-proto')).toBe(true);
		expect(isPublicPath('/ingestion-proto/example')).toBe(true);
	});

	it('protects prototype routes when development prototypes are disabled', () => {
		expect(isPublicPath('/prototype', { allowPrototype: false })).toBe(false);
		expect(isPublicPath('/prototype/objects', { allowPrototype: false })).toBe(false);
		expect(isPublicPath('/ingestion-proto', { allowPrototype: false })).toBe(false);
		expect(isPublicPath('/ingestion-proto/example', { allowPrototype: false })).toBe(false);
	});

	it('protects app routes by default', () => {
		expect(isPublicPath('/')).toBe(false);
		expect(isPublicPath('/ingestion')).toBe(false);
		expect(isPublicPath('/objects/OBJ-1')).toBe(false);
	});
});
