export const translate = (dictionary: Record<string, unknown>, key: string): string => {
	const segments = key.split('.');
	let current: Record<string, unknown> = dictionary;
	for (const segment of segments) {
		if (typeof current[segment] === 'undefined') {
			return key;
		}
		current = current[segment] as Record<string, unknown>;
	}
	return current as unknown as string;
};

export const formatTemplate = (template: string, values: Record<string, string | number>): string =>
	template.replace(/\{(\w+)\}/g, (match, key) =>
		Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
	);
