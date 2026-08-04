export const normalizeObjectsReturnTo = (value: string | null | undefined): string => {
	if (value === '/objects' || value?.startsWith('/objects?')) return value;
	return '/objects';
};

export const withObjectsReturnTo = (objectHref: string, returnTo: string): string => {
	const normalizedReturnTo = normalizeObjectsReturnTo(returnTo);
	return `${objectHref}?returnTo=${encodeURIComponent(normalizedReturnTo)}`;
};
