import { describe, expect, it } from 'vitest';
import type { IngestionDetailItem } from '$lib/services/ingestionDetail';
import { hydrateIngestionItems, mapIngestionItemMetadata } from './setupItemHydration';

const makeItem = (overrides: Partial<IngestionDetailItem> = {}): IngestionDetailItem => ({
	id: 'item-1',
	itemIndex: 1,
	status: 'DRAFT',
	summary: {},
	files: [],
	...overrides
});

describe('setup item hydration', () => {
	it('maps persisted grouped item metadata and keeps file order', () => {
		const result = hydrateIngestionItems(
			[
				makeItem({
					id: 'item-group',
					label: 'Stored title',
					files: [
						{ id: 'link-2', ingestionFileId: 'file-2', sortOrder: 2 },
						{ id: 'link-1', ingestionFileId: 'file-1', sortOrder: 1 }
					],
					summary: {
						classification: {
							tags: [' archive ', 'archive', 'catalog'],
							summary: 'Stored description'
						},
						dates: {
							published: { value: '2024-05', approximate: true }
						},
						people: { mentioned: ['Ada Lovelace', ' Ada Lovelace '] }
					}
				})
			],
			new Map([
				['file-1', 7],
				['file-2', 8]
			]),
			() => 'group-1'
		);

		expect(result.groups).toEqual([
			{
				id: 'group-1',
				label: 'Stored title',
				fileIds: [7, 8],
				serverId: 'item-group'
			}
		]);
		expect(result.metadata).toEqual({
			'group-1': {
				title: 'Stored title',
				date: { value: '2024-05', approximate: true },
				tags: ['archive', 'catalog'],
				description: 'Stored description',
				people: ['Ada Lovelace']
			}
		});
		expect(result.serverItemIds).toEqual({ 'group-1': 'item-group' });
	});

	it('hydrates standalone items with metadata and their server item IDs', () => {
		const result = hydrateIngestionItems(
			[
				makeItem({
					id: 'item-standalone',
					files: [{ id: 'link-1', ingestionFileId: 'file-1', sortOrder: 1 }],
					label: 'Standalone title',
					summary: {
						classification: { tags: [], summary: null },
						dates: {
							published: { value: null, approximate: false }
						},
						people: { mentioned: [] }
					}
				})
			],
			new Map([['file-1', 3]]),
			() => 'unused-group'
		);

		expect(result.groups).toEqual([]);
		expect(result.metadata).toEqual({
			'file:3': {
				title: 'Standalone title',
				date: { value: null, approximate: false },
				tags: [],
				people: []
			}
		});
		expect(result.serverItemIds).toEqual({ 'file:3': 'item-standalone' });
	});

	it('ignores malformed nested values without failing item hydration', () => {
		const metadata = mapIngestionItemMetadata(
			makeItem({
				label: 'Valid title',
				summary: {
					classification: {
						tags: [' valid ', 42, ''],
						summary: 123
					},
					dates: {
						published: { value: 'not-a-date', approximate: true }
					},
					people: { mentioned: 'not-an-array' }
				}
			})
		);

		expect(metadata).toEqual({
			title: 'Valid title',
			tags: ['valid']
		});
	});
});
