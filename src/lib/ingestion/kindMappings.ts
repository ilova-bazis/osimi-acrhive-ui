import type { classificationTypeSchema, itemKindSchema } from '$lib/api/schemas/ingestions';
import type { IngestionMediaKind } from '$lib/services/ingestionCapabilities';
import type { z } from 'zod';

export type ClassificationType = z.infer<typeof classificationTypeSchema>;
export type ItemKind = z.infer<typeof itemKindSchema>;

export const classificationToItemKinds: Record<ClassificationType, readonly ItemKind[]> = {
	newspaper_article: ['scanned_document', 'document'],
	magazine_article: ['scanned_document', 'document'],
	book_chapter: ['scanned_document', 'document'],
	book: ['scanned_document', 'document'],
	letter: ['scanned_document', 'document'],
	report: ['scanned_document', 'document'],
	manuscript: ['scanned_document', 'document'],
	document: ['scanned_document', 'document'],
	image: ['photo'],
	speech: ['audio', 'video', 'scanned_document'],
	interview: ['audio', 'video', 'scanned_document'],
	other: ['photo', 'audio', 'video', 'scanned_document', 'document', 'other']
};

export const itemKindToMediaKinds: Record<ItemKind, readonly IngestionMediaKind[]> = {
	photo: ['image'],
	audio: ['audio'],
	video: ['video'],
	scanned_document: ['image', 'document'],
	document: ['document'],
	other: ['image', 'audio', 'video', 'document']
};

export const classificationTypes = Object.keys(classificationToItemKinds) as ClassificationType[];

export const itemKinds = ['photo', 'audio', 'video', 'scanned_document', 'document', 'other'] as const satisfies readonly ItemKind[];

export const defaultItemKindForClassification = (classificationType: ClassificationType): ItemKind =>
	classificationToItemKinds[classificationType][0];

export const defaultClassificationForItemKind = (itemKind: ItemKind): ClassificationType => {
	for (const classificationType of classificationTypes) {
		if (classificationToItemKinds[classificationType].includes(itemKind)) {
			return classificationType;
		}
	}

	return 'other';
};

export const getAllowedItemKinds = (classificationType: ClassificationType): readonly ItemKind[] =>
	classificationToItemKinds[classificationType];

export const getAllowedMediaKinds = (itemKind: ItemKind): readonly IngestionMediaKind[] =>
	itemKindToMediaKinds[itemKind];

export const isItemKindAllowedForClassification = (
	classificationType: ClassificationType,
	itemKind: ItemKind
): boolean => classificationToItemKinds[classificationType].includes(itemKind);

export const isMediaKindAllowedForItemKind = (
	itemKind: ItemKind,
	mediaKind: IngestionMediaKind
): boolean => itemKindToMediaKinds[itemKind].includes(mediaKind);
