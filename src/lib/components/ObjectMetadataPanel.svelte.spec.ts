import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import ObjectMetadataPanel from './ObjectMetadataPanel.svelte';
import type { IngestionPreviewItem } from '$lib/ingestion/previewPresentation';

const files: IngestionPreviewItem[] = [
	{
		id: 'f1',
		name: 'page-1.tif',
		mediaType: 'image',
		contentType: 'image/tiff',
		sizeBytes: 12 * 1024 * 1024,
		preview: { status: 'ready', url: 'https://example.test/1.jpg' }
	},
	{
		id: 'f2',
		name: 'page-2.tif',
		mediaType: 'image',
		contentType: 'image/tiff',
		sizeBytes: 13 * 1024 * 1024,
		preview: { status: 'check-timeout' }
	}
];

const renderPanel = (overrides: Record<string, unknown> = {}) => {
	const onMetadataChange = vi.fn();
	const onFilePreview = vi.fn();
	const onCheckPreviewAgain = vi.fn();
	const view = render(ObjectMetadataPanel, {
		objectKey: 'group-1',
		objectLabel: 'Object one',
		files,
		metadata: { title: 'Title', tags: ['a'], date: { value: '2020', approximate: false } },
		batchTitle: 'Batch title',
		batchTags: ['batch'],
		batchDate: { value: '2020', approximate: false },
		batchDescription: 'Batch description',
		onMetadataChange,
		onFilePreview,
		onCheckPreviewAgain,
		...overrides
	});
	return { view, onMetadataChange, onFilePreview, onCheckPreviewAgain };
};

describe('ObjectMetadataPanel', () => {
	it('renders the file rail beneath the object heading', async () => {
		renderPanel();

		await expect.element(page.getByText('Object files')).toBeInTheDocument();
		await expect.element(page.getByText('2 items')).toBeInTheDocument();
		await expect.element(page.getByText('page-1.tif')).toBeInTheDocument();
	});

	it('forwards rail preview activation', async () => {
		const { onFilePreview } = renderPanel();

		await userEvent.click(
			page.getByRole('button', { name: 'Preview page-1.tif, 1 of 2' })
		);
		expect(onFilePreview).toHaveBeenCalledWith('f1');
	});

	it('forwards Check again activation', async () => {
		const { onCheckPreviewAgain } = renderPanel();

		await userEvent.click(page.getByRole('button', { name: 'Check again' }));
		expect(onCheckPreviewAgain).toHaveBeenCalledWith('f2');
	});

	it('keeps metadata editing wired to onMetadataChange', async () => {
		const { onMetadataChange } = renderPanel();

		const title = page.getByRole('textbox', { name: 'Title' });
		await userEvent.type(title, ' updated');
		expect(onMetadataChange).toHaveBeenCalled();
	});

	it('renders the empty state without a rail when no object is active', async () => {
		renderPanel({ objectKey: null, files: [] });

		await expect
			.element(page.getByText('Select a file or group on the left to add its metadata.'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Object files')).not.toBeInTheDocument();
	});
});
