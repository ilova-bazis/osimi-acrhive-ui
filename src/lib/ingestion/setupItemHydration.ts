import type { ObjectGroup, ObjectItemMetadata } from '$lib/models';
import type { IngestionDetailItem } from '$lib/services/ingestionDetail';

const DATE_VALUE_PATTERN = /^(\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/;

type UnknownRecord = Record<string, unknown>;

export type HydratedSetupItems = {
	groups: ObjectGroup[];
	metadata: Record<string, ObjectItemMetadata>;
	serverItemIds: Record<string, string>;
};

const asRecord = (value: unknown): UnknownRecord | null => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
	return value as UnknownRecord;
};

const readStringArray = (value: unknown): string[] | undefined => {
	if (!Array.isArray(value)) return undefined;

	return [...new Set(
		value
			.filter((entry): entry is string => typeof entry === 'string')
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0)
	)];
};

const readPublishedDate = (summary: UnknownRecord): ObjectItemMetadata['date'] | undefined => {
	const dates = asRecord(summary.dates);
	const published = asRecord(dates?.published);
	if (!published || typeof published.approximate !== 'boolean') return undefined;

	const value = published.value;
	if (value !== null && (typeof value !== 'string' || !DATE_VALUE_PATTERN.test(value))) {
		return undefined;
	}

	return {
		value,
		approximate: published.approximate
	};
};

export const mapIngestionItemMetadata = (item: IngestionDetailItem): ObjectItemMetadata => {
	const metadata: ObjectItemMetadata = {};
	const title = item.label?.trim();
	if (title) metadata.title = title;

	const summary = item.summary;
	const classification = asRecord(summary.classification);
	const tags = readStringArray(classification?.tags);
	if (tags) metadata.tags = tags;

	if (typeof classification?.summary === 'string') {
		metadata.description = classification.summary;
	}

	const people = readStringArray(asRecord(summary.people)?.mentioned);
	if (people) metadata.people = people;

	const date = readPublishedDate(summary);
	if (date) metadata.date = date;

	return metadata;
};

export const hydrateIngestionItems = (
	items: readonly IngestionDetailItem[],
	backendToLocal: ReadonlyMap<string, number>,
	createGroupId: () => string
): HydratedSetupItems => {
	const groups: ObjectGroup[] = [];
	const metadata: Record<string, ObjectItemMetadata> = {};
	const serverItemIds: Record<string, string> = {};

	for (const item of [...items].sort((a, b) => a.itemIndex - b.itemIndex)) {
		const localFileIds = [...item.files]
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((file) => backendToLocal.get(file.ingestionFileId))
			.filter((id): id is number => id !== undefined);

		if (localFileIds.length === 0) continue;

		const isGroup = localFileIds.length >= 2;
		const key = isGroup ? createGroupId() : `file:${localFileIds[0]}`;
		metadata[key] = mapIngestionItemMetadata(item);
		serverItemIds[key] = item.id;

		if (isGroup) {
			groups.push({
				id: key,
				...(item.label ? { label: item.label } : {}),
				fileIds: localFileIds,
				serverId: item.id
			});
		}
	}

	return { groups, metadata, serverItemIds };
};
