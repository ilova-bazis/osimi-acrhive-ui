import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

import IngestionPreviewOverlay from './IngestionPreviewOverlay.svelte';
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

const buildItems = (): IngestionPreviewItem[] => [
	makeItem('f1', 'page-1.tif', { status: 'ready', url: PIXEL }),
	makeItem('f2', 'page-2.tif', { status: 'ready', url: PIXEL }),
	makeItem('f3', 'page-3.tif', { status: 'pending' }),
	makeItem('f4', 'page-4.tif', { status: 'check-timeout' }),
	makeItem('f5', 'page-5.tif', { status: 'failed' }),
	makeItem('f6', 'page-6.tif', { status: 'purged' }),
	makeItem('f7', 'page-7.wav', { status: 'unsupported' })
];

const renderOverlay = (overrides: Record<string, unknown> = {}) => {
	const onClose = vi.fn();
	const onSelect = vi.fn();
	const onCheckAgain = vi.fn();
	const view = render(IngestionPreviewOverlay, {
		open: true,
		items: buildItems(),
		activeIndex: 0,
		onSelect,
		onCheckAgain,
		onClose,
		...overrides
	});
	return { view, onClose, onSelect, onCheckAgain };
};

const dialogElement = (): HTMLDialogElement =>
	document.querySelector('dialog') as HTMLDialogElement;

describe('IngestionPreviewOverlay', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('stays closed without showModal when open is false', async () => {
		renderOverlay({ open: false });
		expect(dialogElement().open).toBe(false);
	});

	it('opens as a modal with the current file, counter and meta', async () => {
		renderOverlay();

		expect(dialogElement().open).toBe(true);
		await expect
			.element(page.getByRole('dialog'))
			.toHaveAccessibleName('Preview: page-1.tif');
		await expect.element(page.getByText('1 of 7')).toBeInTheDocument();
		await expect
			.element(page.getByRole('img', { name: 'page-1.tif' }))
			.toHaveAttribute('src', PIXEL);
		await expect.element(page.getByText('image/tiff · 12 MB')).toBeInTheDocument();
	});

	it('focuses the close button when opened', async () => {
		renderOverlay();
		await expect
			.element(page.getByRole('button', { name: 'Close preview' }))
			.toHaveFocus();
	});

	it('navigates with the next and previous buttons', async () => {
		const { view, onSelect } = renderOverlay();

		await userEvent.click(page.getByRole('button', { name: 'Next file' }));
		expect(onSelect).toHaveBeenLastCalledWith(1);

		await view.rerender({
			open: true,
			items: buildItems(),
			activeIndex: 1,
			onSelect,
			onCheckAgain: vi.fn(),
			onClose: vi.fn()
		});
		await userEvent.click(page.getByRole('button', { name: 'Previous file' }));
		expect(onSelect).toHaveBeenLastCalledWith(0);
	});

	it('disables previous at the first file and next at the last file', async () => {
		const first = renderOverlay();
		await expect
			.element(page.getByRole('button', { name: 'Previous file' }))
			.toBeDisabled();
		await first.view.unmount();

		const last = renderOverlay({ activeIndex: 6 });
		await expect
			.element(page.getByRole('button', { name: 'Next file' }))
			.toBeDisabled();
		await last.view.unmount();
	});

	it('supports arrow, home and end keyboard navigation', async () => {
		const { onSelect } = renderOverlay();

		await userEvent.keyboard('{ArrowRight}');
		expect(onSelect).toHaveBeenLastCalledWith(1);

		await userEvent.keyboard('{End}');
		expect(onSelect).toHaveBeenLastCalledWith(6);

		await userEvent.keyboard('{Home}');
		expect(onSelect).toHaveBeenLastCalledWith(0);

		await userEvent.keyboard('{ArrowLeft}');
		expect(onSelect).toHaveBeenLastCalledWith(0);
	});

	it('selects files directly from the filmstrip', async () => {
		const { onSelect } = renderOverlay();

		await userEvent.click(
			page.getByRole('button', { name: 'Preview page-3.tif, 3 of 7' })
		);
		expect(onSelect).toHaveBeenLastCalledWith(2);
	});

	it('renders each non-ready state panel', async () => {
		const pending = renderOverlay({ activeIndex: 2 });
		await expect.element(page.getByText('Preparing')).toBeInTheDocument();
		await pending.view.unmount();

		const failed = renderOverlay({ activeIndex: 4 });
		await expect.element(page.getByText('Preview failed')).toBeInTheDocument();
		await failed.view.unmount();

		const purged = renderOverlay({ activeIndex: 5 });
		await expect.element(page.getByText('Preview purged')).toBeInTheDocument();
		await purged.view.unmount();

		const unsupported = renderOverlay({ activeIndex: 6 });
		await expect
			.element(page.getByText('No visual preview', { exact: true }))
			.toBeInTheDocument();
		await unsupported.view.unmount();
	});

	it('offers Check again only for the timed-out state', async () => {
		const { onCheckAgain } = renderOverlay({ activeIndex: 3 });

		await userEvent.click(page.getByRole('button', { name: 'Check again' }));
		expect(onCheckAgain).toHaveBeenCalledWith('f4');
	});

	it('does not offer Check again for backend failure', async () => {
		renderOverlay({ activeIndex: 4 });

		await expect
			.element(page.getByRole('button', { name: 'Check again' }))
			.not.toBeInTheDocument();
	});

	it('hides navigation and filmstrip in single-file mode', async () => {
		renderOverlay({
			items: [buildItems()[0]],
			activeIndex: 0
		});

		await expect
			.element(page.getByRole('button', { name: 'Previous file' }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Next file' }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: 'Object files' }))
			.not.toBeInTheDocument();
	});

	it('closes via the close button exactly once', async () => {
		const { onClose } = renderOverlay();

		await userEvent.click(page.getByRole('button', { name: 'Close preview' }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('closes via Escape through the native cancel path exactly once', async () => {
		const { onClose } = renderOverlay();

		await userEvent.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('closes when the backdrop area of the dialog is clicked', async () => {
		const { onClose } = renderOverlay();

		dialogElement().dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('does not close when content inside the dialog is clicked', async () => {
		const { onClose } = renderOverlay();

		await userEvent.click(page.getByText('image/tiff · 12 MB'));
		expect(onClose).not.toHaveBeenCalled();
	});

	it('keeps keyboard focus inside the open modal', async () => {
		renderOverlay();

		const dialog = dialogElement();
		expect(dialog.matches(':modal')).toBe(true);
		const focusableCount = dialog.querySelectorAll('button:not(:disabled)').length;
		for (let i = 0; i < focusableCount - 1; i++) {
			await userEvent.tab();
			expect(dialog.contains(document.activeElement)).toBe(true);
		}
	});

	it('restores focus to the invoking element after closing', async () => {
		const opener = document.createElement('button');
		opener.textContent = 'opener';
		document.body.appendChild(opener);
		opener.focus();

		const { view, onClose } = renderOverlay({ open: false });
		await view.rerender({ open: true, items: buildItems(), activeIndex: 0, onSelect: vi.fn(), onCheckAgain: vi.fn(), onClose });
		expect(dialogElement().open).toBe(true);

		await view.rerender({ open: false, items: buildItems(), activeIndex: 0, onSelect: vi.fn(), onCheckAgain: vi.fn(), onClose });
		expect(dialogElement().open).toBe(false);
		await expect.element(page.getByText('opener')).toHaveFocus();

		opener.remove();
	});

	it('falls back when the preview image fails to load', async () => {
		renderOverlay();

		page
			.getByRole('img', { name: 'page-1.tif' })
			.element()
			.dispatchEvent(new Event('error'));

		await expect
			.element(page.getByText('Preview could not be loaded'))
			.toBeInTheDocument();
	});

	it('localizes labels in Russian', async () => {
		locale.setLocale('ru');
		renderOverlay({ activeIndex: 3 });

		await expect.element(page.getByText('4 из 7')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Закрыть предпросмотр' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Предпросмотр не готов')).toBeInTheDocument();
	});
});
