import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';

import ObjectSupportSheet from './ObjectSupportSheet.svelte';
import type { SupportSheetState, Tab } from './ObjectSupportSheet.svelte';

const TABS: Tab[] = [
	{ id: 'files', label: 'Files' },
	{ id: 'access', label: 'Access' },
	{ id: 'requests', label: 'Requests' },
	{ id: 'raw', label: 'Raw ingest' }
];

const body = createRawSnippet(() => ({
	render: () => '<div><p>Sheet panel body</p></div>'
}));

const sheetProps = (overrides: Record<string, unknown> = {}) => ({
	state: 'peek' as SupportSheetState,
	title: 'Files',
	activeTab: 'files',
	tabs: TABS,
	idPrefix: 'sheet',
	onStateChange: vi.fn(),
	onTabChange: vi.fn(),
	children: body,
	...overrides
});

afterEach(() => {
	document.querySelectorAll('dialog').forEach((dialog) => dialog.remove());
	document.querySelectorAll('[data-modal-scroll-root]').forEach((node) => node.remove());
	document.body.style.overflow = '';
});

describe('ObjectSupportSheet', () => {
	it('renders the peek state as a non-modal sheet without a dialog', () => {
		render(ObjectSupportSheet, sheetProps());

		expect(page.getByRole('dialog').elements().length).toBe(0);
		expect(page.getByRole('button', { name: 'Expand support panel' }).elements().length).toBe(1);
		expect(document.body.style.overflow).toBe('');
	});

	it('opens the expanded state as a modal dialog with an accessible name', async () => {
		render(ObjectSupportSheet, sheetProps({ state: 'expanded' }));

		await expect.element(page.getByRole('dialog', { name: 'Support' })).toBeInTheDocument();
		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});
	});

	it('focuses the selected tab when expanded', async () => {
		render(ObjectSupportSheet, sheetProps({ state: 'expanded', activeTab: 'access' }));

		await expect.element(page.getByRole('tab', { name: 'Access' })).toHaveFocus();
	});

	it('exposes tablist, tab, and tabpanel semantics with stable ids', async () => {
		render(ObjectSupportSheet, sheetProps({ state: 'expanded' }));

		const tablist = page.getByRole('tablist');
		await expect.element(tablist).toBeInTheDocument();
		await expect.element(tablist).toHaveAttribute('aria-orientation', 'horizontal');

		for (const tab of TABS) {
			const tabElement = page.getByRole('tab', { name: tab.label });
			await expect.element(tabElement).toHaveAttribute('id', `sheet-tab-${tab.id}`);
			await expect
				.element(tabElement)
				.toHaveAttribute('aria-controls', `sheet-panel-${tab.id}`);
			await expect
				.element(tabElement)
				.toHaveAttribute('aria-selected', String(tab.id === 'files'));

			const panel = document.getElementById(`sheet-panel-${tab.id}`);
			expect(panel?.getAttribute('role')).toBe('tabpanel');
			expect(panel?.getAttribute('aria-labelledby')).toBe(`sheet-tab-${tab.id}`);
			expect(panel?.hasAttribute('hidden')).toBe(tab.id !== 'files');
		}

		expect(page.getByRole('tabpanel').elements()).toHaveLength(1);
		await expect
			.element(page.getByRole('tabpanel'))
			.toHaveAttribute('id', 'sheet-panel-files');
		await expect
			.element(page.getByRole('tabpanel'))
			.toHaveAttribute('aria-labelledby', 'sheet-tab-files');
	});

	it('uses roving tabindex with only the focused tab reachable', async () => {
		render(ObjectSupportSheet, sheetProps({ state: 'expanded' }));

		await expect
			.element(page.getByRole('tab', { name: 'Files' }))
			.toHaveAttribute('tabindex', '0');
		for (const tab of TABS.slice(1)) {
			await expect
				.element(page.getByRole('tab', { name: tab.label }))
				.toHaveAttribute('tabindex', '-1');
		}
	});

	it('moves focus with ArrowRight and ArrowLeft without activating', async () => {
		const onTabChange = vi.fn();
		render(
			ObjectSupportSheet,
			sheetProps({ state: 'expanded', onTabChange })
		);

		await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
		await userEvent.keyboard('{ArrowRight}');
		await expect.element(page.getByRole('tab', { name: 'Access' })).toHaveFocus();
		expect(onTabChange).not.toHaveBeenCalled();

		await userEvent.keyboard('{ArrowLeft}');
		await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
		expect(onTabChange).not.toHaveBeenCalled();
	});

	it('wraps arrow navigation and supports Home and End', async () => {
		render(ObjectSupportSheet, sheetProps({ state: 'expanded' }));

		await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
		await userEvent.keyboard('{ArrowLeft}');
		await expect.element(page.getByRole('tab', { name: 'Raw ingest' })).toHaveFocus();

		await userEvent.keyboard('{Home}');
		await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
		await userEvent.keyboard('{End}');
		await expect.element(page.getByRole('tab', { name: 'Raw ingest' })).toHaveFocus();
	});

	it('activates a tab with Enter and moves selection semantics', async () => {
		const onTabChange = vi.fn();
		render(
			ObjectSupportSheet,
			sheetProps({ state: 'expanded', onTabChange })
		);

		await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.keyboard('{Enter}');
		expect(onTabChange).toHaveBeenCalledWith('access');
	});

	it('activates a tab on click without closing the sheet', async () => {
		const onTabChange = vi.fn();
		const onStateChange = vi.fn();
		render(
			ObjectSupportSheet,
			sheetProps({ state: 'expanded', onTabChange, onStateChange })
		);

		await userEvent.click(page.getByRole('tab', { name: 'Requests' }));
		expect(onTabChange).toHaveBeenCalledWith('requests');
		expect(onStateChange).not.toHaveBeenCalled();
	});

	it('moves focus with Up and Down in vertical orientation', async () => {
		render(
			ObjectSupportSheet,
			sheetProps({ state: 'expanded', orientation: 'vertical' })
		);

		const tablist = page.getByRole('tablist');
		await expect.element(tablist).toHaveAttribute('aria-orientation', 'vertical');

		await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
		await userEvent.keyboard('{ArrowDown}');
		await expect.element(page.getByRole('tab', { name: 'Access' })).toHaveFocus();
		await userEvent.keyboard('{ArrowUp}');
		await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
	});

	for (const intermediate of ['peek', 'hidden'] as const) {
		it(`resets roving focus when the sheet passes through ${intermediate} and re-expands`, async () => {
			const onStateChange = vi.fn();
			const onTabChange = vi.fn();
			const view = render(
				ObjectSupportSheet,
				sheetProps({ state: 'expanded', onStateChange, onTabChange })
			);

			await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
			await userEvent.keyboard('{ArrowRight}');
			await expect.element(page.getByRole('tab', { name: 'Access' })).toHaveFocus();
			expect(onTabChange).not.toHaveBeenCalled();

			await view.rerender(
				sheetProps({ state: intermediate, onStateChange, onTabChange })
			);
			await view.rerender(
				sheetProps({ state: 'expanded', onStateChange, onTabChange })
			);

			await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
			await expect
				.element(page.getByRole('tab', { name: 'Files' }))
				.toHaveAttribute('tabindex', '0');
			await expect
				.element(page.getByRole('tab', { name: 'Access' }))
				.toHaveAttribute('tabindex', '-1');
			expect(onTabChange).not.toHaveBeenCalled();
		});
	}

	for (const activeTab of [undefined, 'missing']) {
		it(`falls back to the first tab when activeTab is ${activeTab === undefined ? 'missing' : 'invalid'}`, async () => {
			render(ObjectSupportSheet, sheetProps({ state: 'expanded', activeTab }));

			await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
			await expect
				.element(page.getByRole('tab', { name: 'Files' }))
				.toHaveAttribute('aria-selected', 'true');
			for (const tab of TABS.slice(1)) {
				await expect
					.element(page.getByRole('tab', { name: tab.label }))
					.toHaveAttribute('aria-selected', 'false');
			}
			expect(document.getElementById('sheet-panel-files')?.hasAttribute('hidden')).toBe(false);
			for (const tab of TABS.slice(1)) {
				expect(document.getElementById(`sheet-panel-${tab.id}`)?.hasAttribute('hidden')).toBe(
					true
				);
			}
		});
	}

	it('renders ordinary content without tab semantics when no tabs are provided', async () => {
		render(ObjectSupportSheet, sheetProps({ state: 'expanded', tabs: [], activeTab: undefined }));

		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});
		expect(page.getByRole('tablist').elements()).toHaveLength(0);
		expect(page.getByRole('tabpanel').elements()).toHaveLength(0);
		expect(document.getElementById('sheet-panel-files')).toBeNull();
		await expect.element(page.getByText('Sheet panel body')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Close support panel' }))
			.toHaveFocus();
	});

	it('falls back roving tabindex when the focused tab is removed', async () => {
		const remainingTabs = TABS.filter((tab) => tab.id !== 'access');
		const view = render(ObjectSupportSheet, sheetProps({ state: 'expanded' }));

		await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();
		await userEvent.keyboard('{ArrowRight}');
		await expect.element(page.getByRole('tab', { name: 'Access' })).toHaveFocus();

		await view.rerender(sheetProps({ state: 'expanded', tabs: remainingTabs }));

		await expect
			.element(page.getByRole('tab', { name: 'Files' }))
			.toHaveAttribute('tabindex', '0');
		for (const tab of remainingTabs.slice(1)) {
			await expect
				.element(page.getByRole('tab', { name: tab.label }))
				.toHaveAttribute('tabindex', '-1');
		}
		for (const tab of remainingTabs) {
			expect(document.getElementById(`sheet-panel-${tab.id}`)).not.toBeNull();
		}
		expect(document.getElementById('sheet-panel-access')).toBeNull();
	});

	it('closes to hidden on Escape through the consumer', async () => {
		const onStateChange = vi.fn();
		render(
			ObjectSupportSheet,
			sheetProps({ state: 'expanded', onStateChange })
		);

		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});
		await userEvent.keyboard('{Escape}');
		expect(onStateChange).toHaveBeenCalledWith('hidden');
	});

	it('closes through the backdrop and informs the consumer', async () => {
		const onStateChange = vi.fn();
		render(
			ObjectSupportSheet,
			sheetProps({ state: 'expanded', onStateChange })
		);

		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});
		const dialog = document.querySelector('dialog')!;
		dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		dialog.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
		expect(onStateChange).toHaveBeenCalledWith('hidden');
	});

	it('collapses to peek and restores focus to the peek handle', async () => {
		const onStateChange = vi.fn();
		const view = render(
			ObjectSupportSheet,
			sheetProps({ state: 'expanded', onStateChange })
		);

		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});
		await userEvent.click(page.getByRole('button', { name: 'Collapse support panel' }));
		expect(onStateChange).toHaveBeenCalledWith('peek');

		await view.rerender(sheetProps({ state: 'peek', onStateChange }));
		await expect
			.element(page.getByRole('button', { name: 'Expand support panel' }))
			.toHaveFocus();
	});

	it('restores focus to the provided launcher when closing to hidden', async () => {
		const launcher = document.createElement('button');
		launcher.textContent = 'Support launcher';
		document.body.appendChild(launcher);
		launcher.focus();

		const onStateChange = vi.fn();
		const view = render(
			ObjectSupportSheet,
			sheetProps({ state: 'expanded', onStateChange, launcherFocus: () => launcher })
		);

		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.open).toBe(true);
		});
		await view.rerender(
			sheetProps({ state: 'hidden', onStateChange, launcherFocus: () => launcher })
		);
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(launcher);
		});
		launcher.remove();
	});

	it('locks scrolling only in the expanded state', async () => {
		const scrollRoot = document.createElement('div');
		scrollRoot.setAttribute('data-modal-scroll-root', '');
		document.body.appendChild(scrollRoot);
		scrollRoot.style.overflow = 'auto';

		const view = render(ObjectSupportSheet, sheetProps({ state: 'peek' }));
		expect(scrollRoot.style.overflow).toBe('auto');

		await view.rerender(sheetProps({ state: 'expanded' }));
		await vi.waitFor(() => {
			expect(scrollRoot.style.overflow).toBe('hidden');
		});

		await view.rerender(sheetProps({ state: 'peek' }));
		await vi.waitFor(() => {
			expect(scrollRoot.style.overflow).toBe('auto');
		});
	});

	for (const viewport of [
		{ width: 1280, height: 720, label: 'desktop' },
		{ width: 375, height: 667, label: 'mobile' }
	]) {
		it(`keeps expanded modal and tab behavior at ${viewport.label} size`, async () => {
			await page.viewport(viewport.width, viewport.height);
			try {
				const backgroundButton = document.createElement('button');
				backgroundButton.textContent = 'background';
				document.body.appendChild(backgroundButton);

				const onTabChange = vi.fn();
				render(
					ObjectSupportSheet,
					sheetProps({ state: 'expanded', onTabChange })
				);

				await expect
					.element(page.getByRole('dialog', { name: 'Support' }))
					.toBeInTheDocument();
				await expect.element(page.getByRole('tab', { name: 'Files' })).toHaveFocus();

				backgroundButton.focus();
				await vi.waitFor(() => {
					expect(document.activeElement).not.toBe(backgroundButton);
				});
				backgroundButton.remove();

				await userEvent.keyboard('{ArrowRight}');
				await userEvent.keyboard('{Enter}');
				expect(onTabChange).toHaveBeenCalledWith('access');
			} finally {
				await page.viewport(1280, 720);
			}
		});
	}
});
