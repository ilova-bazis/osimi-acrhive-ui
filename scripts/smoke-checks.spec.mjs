import { describe, expect, it } from 'vitest';

import { normalizePathname, routeIdentityMismatch } from './smoke-checks.mjs';

describe('normalizePathname', () => {
	it('strips a trailing slash from non-root paths', () => {
		expect(normalizePathname('/objects/')).toBe('/objects');
		expect(normalizePathname('/objects/OBJ-1/edit/')).toBe('/objects/OBJ-1/edit');
	});

	it('keeps the root pathname as-is', () => {
		expect(normalizePathname('/')).toBe('/');
	});

	it('keeps paths without trailing slashes unchanged', () => {
		expect(normalizePathname('/objects')).toBe('/objects');
	});
});

describe('routeIdentityMismatch', () => {
	it('accepts an exact pathname match', () => {
		expect(routeIdentityMismatch('http://127.0.0.1:4600/objects', '/objects', 'http://127.0.0.1:4600')).toBeNull();
	});

	it('rejects a matching path on another origin', () => {
		expect(routeIdentityMismatch('https://example.test/objects', '/objects', 'http://127.0.0.1:4600')).toContain(
			'expected origin'
		);
	});

	it('rejects login prefix siblings', () => {
		expect(routeIdentityMismatch('http://127.0.0.1:4600/login-other', '/login', 'http://127.0.0.1:4600')).toContain(
			'expected pathname'
		);
		expect(routeIdentityMismatch('http://127.0.0.1:4600/login/attacker', '/login', 'http://127.0.0.1:4600')).toContain(
			'expected pathname'
		);
	});

	it('rejects a root redirect to another same-origin route', () => {
		expect(routeIdentityMismatch('http://127.0.0.1:4600/objects', '/')).toContain('expected pathname "/"');
	});

	it('rejects a prefix-sibling object id', () => {
		expect(
			routeIdentityMismatch(
				'http://127.0.0.1:4600/objects/OBJ-20260814-DOC001-other',
				'/objects/OBJ-20260814-DOC001'
			)
		).toContain('expected pathname');
	});

	it('rejects an unexpected query string', () => {
		expect(routeIdentityMismatch('http://127.0.0.1:4600/objects?page=2', '/objects')).toContain(
			'unexpected query string'
		);
	});

	it('normalizes a trailing slash to a match', () => {
		expect(routeIdentityMismatch('http://127.0.0.1:4600/objects/', '/objects')).toBeNull();
	});

	it('ignores hash fragments', () => {
		expect(routeIdentityMismatch('http://127.0.0.1:4600/objects#section', '/objects')).toBeNull();
	});

	it('rejects unparseable urls', () => {
		expect(routeIdentityMismatch('not a url', '/objects')).toContain('unparseable url');
	});

	it('rejects a partial pathname prefix match', () => {
		expect(routeIdentityMismatch('http://127.0.0.1:4600/ingestion/new2', '/ingestion/new')).toContain(
			'expected pathname'
		);
	});
});
