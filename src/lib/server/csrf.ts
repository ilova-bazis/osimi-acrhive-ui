export const isTrustedOrigin = (request: Request, expectedOrigin: string): boolean => {
	const origin = request.headers.get('origin');
	if (origin) {
		return origin === expectedOrigin;
	}

	const referer = request.headers.get('referer');
	if (referer) {
		try {
			return new URL(referer).origin === expectedOrigin;
		} catch {
			return false;
		}
	}

	return true;
};
