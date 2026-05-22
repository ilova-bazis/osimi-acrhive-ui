import {
	defaultClassificationForItemKind,
	defaultItemKindForClassification,
	isItemKindAllowedForClassification,
	type ClassificationType,
	type ItemKind
} from '$lib/ingestion/kindMappings';

export type BatchIntent = {
	classificationType: ClassificationType;
	itemKind: ItemKind;
};

type ResolveBatchIntentInput = {
	classificationType: ClassificationType;
	storedItemKind?: ItemKind | null;
	metadataItemKind?: ItemKind | null;
};

export const resolveBatchIntent = ({
	classificationType,
	storedItemKind,
	metadataItemKind
}: ResolveBatchIntentInput): BatchIntent => {
	const itemKind =
		storedItemKind ?? metadataItemKind ?? defaultItemKindForClassification(classificationType);

	return isItemKindAllowedForClassification(classificationType, itemKind)
		? { classificationType, itemKind }
		: {
				classificationType,
				itemKind: defaultItemKindForClassification(classificationType)
			};
};

export const applyClassificationSelection = (
	current: BatchIntent,
	classificationType: ClassificationType
): BatchIntent => ({
	classificationType,
	itemKind: isItemKindAllowedForClassification(classificationType, current.itemKind)
		? current.itemKind
		: defaultItemKindForClassification(classificationType)
});

export const applyItemKindSelection = (current: BatchIntent, itemKind: ItemKind): BatchIntent => ({
	classificationType: isItemKindAllowedForClassification(current.classificationType, itemKind)
		? current.classificationType
		: defaultClassificationForItemKind(itemKind),
	itemKind
});

export const isBatchIntentEqual = (left: BatchIntent, right: BatchIntent): boolean =>
	left.classificationType === right.classificationType && left.itemKind === right.itemKind;
