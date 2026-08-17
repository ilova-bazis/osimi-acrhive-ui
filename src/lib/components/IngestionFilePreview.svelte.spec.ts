import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

import IngestionFilePreview from './IngestionFilePreview.svelte';
import type { IngestionPreviewItem } from '$lib/ingestion/previewPresentation';

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

const makeItem = (
	id: string,
	name: string,
	preview: IngestionPreviewItem['preview']
): IngestionPreviewItem => ({
	id,
	name,
	mediaType: 'image',
	contentType: 'image/tiff',
	sizeBytes: 12 * 1024 * 1024,
	preview
});

const buildFiles = (): IngestionPreviewItem[] => [
	makeItem('f1', 'page-1.tif', { status: 'ready', url: PIXEL }),
	makeItem('f2', 'page-2.tif', { status: 'ready', url: PIXEL }),
	makeItem('f3', 'page-3.tif', { status: 'pending' }),
	makeItem('f4', 'page-4.tif', { status: 'check-timeout' }),
	makeItem('f5', 'page-5.tif', { status: 'failed' }),
	makeItem('f6', 'page-6.tif', { status: 'purged' }),
	makeItem('f7', 'page-7.wav', { status: 'unsupported' })
];

const renderRail = (overrides: Record<string, unknown> = {}) => {
	const onPreview = vi.fn();
	const onCheckAgain = vi.fn();
	const view = render(IngestionFilePreview, {
		files: buildFiles(),
		onPreview,
		onCheckAgain,
		...overrides
	});
	return { view, onPreview, onCheckAgain };
};

describe('IngestionFilePreview', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('renders every file in order without truncation controls', async () => {
		renderRail();

		await expect.element(page.getByText('7 items')).toBeInTheDocument();
		await expect.element(page.getByText('page-1.tif')).toBeInTheDocument();
		await expect.element(page.getByText('page-7.wav')).toBeInTheDocument();
		await expect.element(page.getByText('Show less')).not.toBeInTheDocument();
	});

	it('opens the viewer for the clicked file', async () => {
		const { onPreview } = renderRail();

		await userEvent.click(
			page.getByRole('button', { name: 'Preview page-2.tif, 2 of 7' })
		);
		expect(onPreview).toHaveBeenCalledWith('f2');
	});

	it('renders ready images with load-failure fallback', async () => {
		renderRail();

		const images = document.querySelectorAll('img');
		expect(images.length).toBeGreaterThanOrEqual(2);
		expect(images[0]).toHaveAttribute('src', PIXEL);

		images[0]?.dispatchEvent(new Event('error'));

		await expect
			.element(page.getByText('Preview could not be loaded'))
			.toBeInTheDocument();
	});

	it('renders pending and terminal states without extra actions', async () => {
		renderRail();

		await expect.element(page.getByText('Preparing')).toBeInTheDocument();
		await expect.element(page.getByText('Preview failed')).toBeInTheDocument();
		await expect.element(page.getByText('Preview purged')).toBeInTheDocument();
		await expect
			.element(page.getByText('No visual preview', { exact: true }))
			.toBeInTheDocument();
	});

	it('offers Check again only for the timed-out file', async () => {
		const { onCheckAgain } = renderRail();

		await userEvent.click(page.getByRole('button', { name: 'Check again' }));
		expect(onCheckAgain).toHaveBeenCalledWith('f4');
	});

	it('omits Check again when no handler is provided', async () => {
		renderRail({ onCheckAgain: undefined });

		await expect
			.element(page.getByRole('button', { name: 'Check again' }))
			.not.toBeInTheDocument();
	});

	it('keeps tile and secondary action as sibling controls', async () => {
		renderRail();

		const tile = page
			.getByRole('button', { name: 'Preview page-1.tif, 1 of 7' })
			.element();
		expect(tile.querySelectorAll('button').length).toBe(0);
	});

	it('localizes labels in Russian', async () => {
		locale.setLocale('ru');
		renderRail();

		await expect.element(page.getByText('Файлы объекта')).toBeInTheDocument();
		await expect.element(page.getByText('Файлов: 7')).toBeInTheDocument();
		await expect
			.element(
				page.getByRole('button', { name: 'Предпросмотр page-2.tif, 2 из 7' })
			)
			.toBeInTheDocument();
	});
});
