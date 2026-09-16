import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';

import ObjectDetailInfoDrawer from './ObjectDetailInfoDrawer.svelte';

const drawerProps = (overrides: Record<string, unknown> = {}) => ({
	open: false,
	title: 'War-time newspaper issue',
	description: 'A scanned newspaper page.',
	tags: ['Persia'],
	type: 'document',
	language: 'en',
	createdAt: 'Aug 4, 2026',
	updatedAt: 'Aug 4, 2026',
	sourceBatchLabel: 'BATCH-1',
	sourceIngestionId: 'ing-1',
	rightsNote: null,
	sensitivityNote: null,
	onClose: vi.fn(),
	...overrides
});

afterEach(() => {
	document.querySelectorAll('dialog').forEach((dialog) => dialog.remove());
	document.querySelectorAll('[data-modal-scroll-root]').forEach((node) => node.remove());
	document.body.style.overflow = '';
});

describe('ObjectDetailInfoDrawer', () => {
	it('stays closed without a dialog when open is false', () => {
		render(ObjectDetailInfoDrawer, drawerProps());

		expect(document.querySelector('dialog')?.open).toBe(false);
		expect(page.getByRole('dialog').elements().length).toBe(0);
	});

	it('opens as a modal drawer with an accessible name and close focus', async () => {
		const view = render(ObjectDetailInfoDrawer, drawerProps());
		await view.rerender(drawerProps({ open: true }));

		await expect
			.element(page.getByRole('dialog', { name: 'Object info War-time newspaper issue' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Close info panel' }))
			.toHaveFocus();
	});

	it('blocks background focus while open', async () => {
		const backgroundButton = document.createElement('button');
		backgroundButton.textContent = 'background';
		document.body.appendChild(backgroundButton);

		const view = render(ObjectDetailInfoDrawer, drawerProps());
		await view.rerender(drawerProps({ open: true }));
		await expect
			.element(page.getByRole('button', { name: 'Close info panel' }))
			.toHaveFocus();

		backgroundButton.focus();
		await vi.waitFor(() => {
			expect(document.activeElement).not.toBe(backgroundButton);
		});
		backgroundButton.remove();
	});

	it('closes on Escape and informs the consumer exactly once', async () => {
		const onClose = vi.fn();
		const view = render(ObjectDetailInfoDrawer, drawerProps({ onClose }));
		await view.rerender(drawerProps({ open: true, onClose }));

		await userEvent.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('closes through the backdrop', async () => {
		const onClose = vi.fn();
		const view = render(ObjectDetailInfoDrawer, drawerProps({ onClose }));
		await view.rerender(drawerProps({ open: true, onClose }));
		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});

		const dialog = document.querySelector('dialog')!;
		dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		dialog.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('locks the modal scroll root while open and releases on close', async () => {
		const scrollRoot = document.createElement('div');
		scrollRoot.setAttribute('data-modal-scroll-root', '');
		document.body.appendChild(scrollRoot);
		scrollRoot.style.overflow = 'auto';

		const view = render(ObjectDetailInfoDrawer, drawerProps());
		await view.rerender(drawerProps({ open: true }));
		await vi.waitFor(() => {
			expect(scrollRoot.style.overflow).toBe('hidden');
		});

		await view.rerender(drawerProps({ open: false }));
		await vi.waitFor(() => {
			expect(scrollRoot.style.overflow).toBe('auto');
		});
	});

	it('releases everything when unmounted while open', async () => {
		document.body.style.overflow = 'auto';
		const view = render(ObjectDetailInfoDrawer, drawerProps({ open: true }));
		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});
		expect(document.body.style.overflow).toBe('hidden');

		view.unmount();
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});
		expect(document.querySelector('dialog')).toBeNull();
	});

	for (const viewport of [
		{ width: 1280, height: 720, label: 'desktop' },
		{ width: 375, height: 667, label: 'mobile' }
	]) {
		it(`keeps modal behavior at ${viewport.label} size`, async () => {
			await page.viewport(viewport.width, viewport.height);
			try {
				const backgroundButton = document.createElement('button');
				backgroundButton.textContent = 'background';
				document.body.appendChild(backgroundButton);

				const view = render(ObjectDetailInfoDrawer, drawerProps());
				await view.rerender(drawerProps({ open: true }));

				await expect
					.element(page.getByRole('dialog', { name: 'Object info War-time newspaper issue' }))
					.toBeInTheDocument();
				await expect
					.element(page.getByRole('button', { name: 'Close info panel' }))
					.toHaveFocus();

				backgroundButton.focus();
				await vi.waitFor(() => {
					expect(document.activeElement).not.toBe(backgroundButton);
				});
				backgroundButton.remove();

				await userEvent.keyboard('{Escape}');
				await view.rerender(drawerProps({ open: false }));
				await vi.waitFor(() => {
					expect(document.querySelector('dialog')?.open).toBe(false);
				});
			} finally {
				await page.viewport(1280, 720);
			}
		});
	}
});
