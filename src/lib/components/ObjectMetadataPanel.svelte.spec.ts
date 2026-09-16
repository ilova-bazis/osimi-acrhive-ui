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
		await userEvent.type(title, ' ');
		expect(onMetadataChange).toHaveBeenLastCalledWith({ title: 'Title ' });
	});

	it('renders the empty state without a rail when no object is active', async () => {
		renderPanel({ objectKey: null, files: [] });

		await expect
			.element(page.getByText('Select a file or group on the left to add its metadata.'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Object files')).not.toBeInTheDocument();
	});

	it('renders updated placeholder copy and batch tag cues', async () => {
		renderPanel({
			batchTitle: '',
			batchDescription: '',
			metadata: { title: '', tags: [], date: { value: null, approximate: false } }
		});

		const titleInput = page.getByRole('textbox', { name: 'Title' });
		await expect.element(titleInput).toHaveAttribute('placeholder', 'Use the item title default');

		const descInput = page.getByRole('textbox', { name: 'Description' });
		await expect.element(descInput).toHaveAttribute('placeholder', 'Use the default description');

		const batchTag = document.querySelector('span[title="Batch metadata default"]');
		expect(batchTag).not.toBeNull();
		expect(batchTag?.textContent?.trim()).toBe('batch');
	});

	it('synchronizes date state when parent updates metadata.date', async () => {
		const { view } = renderPanel({
			metadata: { title: 'Title', tags: ['a'], date: undefined }
		});

		const select = page.getByRole('combobox');
		await expect.element(select).toHaveValue('none');

		await view.rerender({
			objectKey: 'group-1',
			objectLabel: 'Object one',
			files,
			metadata: { title: 'Title', tags: ['a'], date: { value: '1945-08-14', approximate: true } },
			batchTitle: 'Batch title',
			batchTags: ['batch'],
			batchDate: { value: '1945-08-14', approximate: true },
			batchDescription: 'Batch description',
			onMetadataChange: vi.fn(),
			onFilePreview: vi.fn(),
			onCheckPreviewAgain: vi.fn()
		});

		await expect.element(page.getByRole('combobox')).toHaveValue('day');
	});

	it('retains precision input when parent echoes local date edit', async () => {
		const onMetadataChange = vi.fn();
		const { view } = renderPanel({
			metadata: { title: 'Title', tags: ['a'], date: undefined },
			onMetadataChange
		});

		const select = page.getByRole('combobox');
		await userEvent.selectOptions(select, 'year');
		expect(onMetadataChange).toHaveBeenCalledWith({ date: { value: null, approximate: false } });

		// Parent echoes back the null value with year precision state
		await view.rerender({
			objectKey: 'group-1',
			objectLabel: 'Object one',
			files,
			metadata: { title: 'Title', tags: ['a'], date: { value: null, approximate: false } },
			batchTitle: 'Batch title',
			batchTags: ['batch'],
			batchDate: null,
			batchDescription: 'Batch description',
			onMetadataChange,
			onFilePreview: vi.fn(),
			onCheckPreviewAgain: vi.fn()
		});

		await expect.element(page.getByRole('combobox')).toHaveValue('year');
		expect(document.querySelector('input[type="number"]')).not.toBeNull();

		await view.rerender({
			objectKey: 'group-1',
			objectLabel: 'Object one',
			files,
			metadata: { title: 'Title', tags: ['a'], date: { value: '1945-08-14', approximate: true } },
			batchTitle: 'Batch title',
			batchTags: ['batch'],
			batchDate: { value: '1945-08-14', approximate: true },
			batchDescription: 'Batch description',
			onMetadataChange,
			onFilePreview: vi.fn(),
			onCheckPreviewAgain: vi.fn()
		});

		await expect.element(page.getByRole('combobox')).toHaveValue('day');
	});

	it('preserves uncommitted tag and person drafts during same-object parent date updates', async () => {
		const { view } = renderPanel({
			peopleEditable: true,
			metadata: { title: 'Title', tags: ['a'], people: ['p1'], date: { value: '2020', approximate: false } }
		});

		const tagInput = page.getByRole('textbox', { name: 'Tags' });
		await userEvent.type(tagInput, 'draft-tag');

		const personInput = page.getByRole('textbox', { name: 'People' });
		await userEvent.type(personInput, 'draft-person');

		// Parent date changes while same object is active
		await view.rerender({
			objectKey: 'group-1',
			objectLabel: 'Object one',
			files,
			peopleEditable: true,
			metadata: { title: 'Title', tags: ['a'], people: ['p1'], date: { value: '1999', approximate: false } },
			batchTitle: 'Batch title',
			batchTags: ['batch'],
			batchDate: { value: '1999', approximate: false },
			batchDescription: 'Batch description',
			onMetadataChange: vi.fn(),
			onFilePreview: vi.fn(),
			onCheckPreviewAgain: vi.fn()
		});

		await expect.element(page.getByRole('textbox', { name: 'Tags' })).toHaveValue('draft-tag');
		await expect.element(page.getByRole('textbox', { name: 'People' })).toHaveValue('draft-person');
	});

	it('clears uncommitted tag and person drafts when switching objectKey', async () => {
		const { view } = renderPanel({
			peopleEditable: true,
			metadata: { title: 'Title', tags: ['a'], people: ['p1'], date: { value: '2020', approximate: false } }
		});

		const tagInput = page.getByRole('textbox', { name: 'Tags' });
		await userEvent.type(tagInput, 'draft-tag');

		const personInput = page.getByRole('textbox', { name: 'People' });
		await userEvent.type(personInput, 'draft-person');

		// Switching to another object
		await view.rerender({
			objectKey: 'group-2',
			objectLabel: 'Object two',
			files,
			peopleEditable: true,
			metadata: { title: 'Title 2', tags: ['b'], people: ['p2'], date: { value: '2021', approximate: false } },
			batchTitle: 'Batch title',
			batchTags: ['batch'],
			batchDate: null,
			batchDescription: 'Batch description',
			onMetadataChange: vi.fn(),
			onFilePreview: vi.fn(),
			onCheckPreviewAgain: vi.fn()
		});

		await expect.element(page.getByRole('textbox', { name: 'Tags' })).toHaveValue('');
		await expect.element(page.getByRole('textbox', { name: 'People' })).toHaveValue('');
	});
});
