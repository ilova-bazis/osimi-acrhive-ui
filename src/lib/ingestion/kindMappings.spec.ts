import { describe, expect, it } from 'vitest';
import {
	defaultItemKindForClassification,
	getAllowedItemKinds,
	getAllowedMediaKinds,
	isMediaKindAllowedForItemKind
} from './kindMappings';

describe('kindMappings', () => {
	it('keeps backend ordering for classification to item kind mapping', () => {
		expect(getAllowedItemKinds('document')).toEqual(['scanned_document', 'document']);
		expect(getAllowedItemKinds('interview')).toEqual(['audio', 'video', 'scanned_document']);
		expect(defaultItemKindForClassification('book')).toBe('scanned_document');
	});

	it('allows scanned documents to accept images and documents', () => {
		expect(getAllowedMediaKinds('scanned_document')).toEqual(['image', 'document']);
		expect(isMediaKindAllowedForItemKind('scanned_document', 'image')).toBe(true);
		expect(isMediaKindAllowedForItemKind('scanned_document', 'document')).toBe(true);
		expect(isMediaKindAllowedForItemKind('document', 'image')).toBe(false);
	});
});
