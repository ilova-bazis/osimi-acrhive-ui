export const normalizePathname = (pathname) => {
	const normalized = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
	return normalized;
};

export const routeIdentityMismatch = (rawUrl, expectedPath, expectedOrigin) => {
	let parsed;
	try {
		parsed = new URL(rawUrl);
	} catch {
		return `unparseable url: ${rawUrl}`;
	}
	if (expectedOrigin && parsed.origin !== expectedOrigin) {
		return `expected origin "${expectedOrigin}", got "${parsed.origin}"`;
	}
	const actual = normalizePathname(parsed.pathname);
	const expected = normalizePathname(expectedPath);
	if (actual !== expected) {
		return `expected pathname "${expected}", got "${actual}"`;
	}
	if (parsed.search) {
		return `unexpected query string "${parsed.search}"`;
	}
	return null;
};
