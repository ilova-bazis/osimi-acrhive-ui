import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';

import BaseDialog from './BaseDialog.svelte';

const snippet = (html: string) =>
	createRawSnippet(() => ({
		render: () => `<div>${html}</div>`
	}));

const dialogElement = (): HTMLDialogElement | null => document.querySelector('dialog');

type RenderedView = { unmount: () => unknown };
const mountedViews: RenderedView[] = [];

const renderTracked = (props: Record<string, unknown>): ReturnType<typeof render> => {
	const view = render(BaseDialog, props);
	mountedViews.push(view);
	return view;
};

const unmountTracked = async (view: RenderedView): Promise<void> => {
	const index = mountedViews.indexOf(view);
	if (index !== -1) mountedViews.splice(index, 1);
	await view.unmount();
};

const renderDialog = (
	overrides: Record<string, unknown> = {},
	html = '<button>Close</button><button>Confirm</button>'
) => {
	const onClose = vi.fn();
	const view = renderTracked({
		open: true,
		onClose,
		children: snippet(html),
		...overrides
	});
	return { view, onClose };
};

afterEach(async () => {
	while (mountedViews.length > 0) {
		const view = mountedViews.pop();
		await view?.unmount();
	}
	document.querySelectorAll('dialog').forEach((dialog) => dialog.remove());
	document.querySelectorAll('[data-modal-scroll-root]').forEach((node) => node.remove());
	document.body.style.overflow = '';
	document.documentElement.style.overflow = '';
});

describe('BaseDialog', () => {
	it('stays closed without showModal when open is false', async () => {
		renderDialog({ open: false });
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(false);
		});
	});

	it('opens as a native modal with the expected role and labelled name', async () => {
		renderDialog(
			{ labelledBy: 'dialog-heading' },
			'<h2 id="dialog-heading">Confirm resync</h2><button>Close</button>'
		);

		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		await expect
			.element(page.getByRole('dialog', { name: 'Confirm resync' }))
			.toBeInTheDocument();
	});

	it('uses the direct label prop as the accessible name', async () => {
		renderDialog({ label: 'Preview archive file' });

		await expect
			.element(page.getByRole('dialog', { name: 'Preview archive file' }))
			.toBeInTheDocument();
	});

	it('focuses the first visible control, skipping hidden inputs', async () => {
		renderDialog(
			{},
			'<input type="hidden" /><input data-testid="target" value="visible" />'
		);

		await expect.element(page.getByTestId('target')).toHaveFocus();
	});

	it('skips controls inside hidden ancestors for initial focus', async () => {
		renderDialog({}, '<div hidden><button>Hidden button</button></div><button data-testid="target">Visible</button>');

		await expect.element(page.getByTestId('target')).toHaveFocus();
	});

	it('skips inert and disabled controls for initial focus', async () => {
		renderDialog(
			{},
			'<button disabled>Disabled</button><div inert><button>Inert</button></div><button data-testid="target">Visible</button>'
		);

		await expect.element(page.getByTestId('target')).toHaveFocus();
	});

	it('skips display none and hidden visibility controls for initial focus', async () => {
		renderDialog(
			{},
			'<button style="display:none">None</button><button style="visibility:hidden">Hidden</button><button data-testid="target">Visible</button>'
		);

		await expect.element(page.getByTestId('target')).toHaveFocus();
	});

	it('focuses the first disclosure summary for initial focus', async () => {
		renderDialog(
			{},
			'<details><summary data-testid="summary">Details</summary><p>Body</p></details><button>Fallback</button>'
		);

		await expect.element(page.getByTestId('summary')).toHaveFocus();
	});

	it('excludes later summaries from native candidate discovery', async () => {
		renderDialog(
			{},
			'<details><summary data-testid="first">First</summary><summary data-testid="second">Second</summary></details><button data-testid="fallback">Fallback</button>'
		);

		await expect.element(page.getByTestId('first')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('fallback')).toHaveFocus();
	});

	it('wraps Tab across a summary trap boundary', async () => {
		renderDialog(
			{},
			'<details><summary data-testid="first">Summary</summary><p>Body</p></details><button data-testid="last">Last</button>'
		);

		await expect.element(page.getByTestId('first')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('last')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('first')).toHaveFocus();
		await userEvent.tab({ shift: true });
		await expect.element(page.getByTestId('last')).toHaveFocus();
	});

	it('navigates through a contenteditable region natively', async () => {
		renderDialog(
			{},
			'<button data-testid="before">Before</button><div contenteditable="true" style="min-height:1rem" data-testid="editor">Edit</div><button data-testid="after">After</button>'
		);

		await vi.waitFor(() => {
			expect(document.activeElement?.getAttribute('data-testid')).toBe('before');
		});
		await userEvent.tab();
		await expect.element(page.getByTestId('editor')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('after')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('before')).toHaveFocus();
	});

	it('follows native radio-group semantics during navigation', async () => {
		renderDialog(
			{},
			'<button data-testid="before">Before</button><fieldset><input type="radio" name="trap-group" data-testid="unchecked" /><input type="radio" name="trap-group" checked data-testid="checked" /></fieldset><button data-testid="after">After</button>'
		);

		await expect.element(page.getByTestId('before')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('checked')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('after')).toHaveFocus();
	});

	it('respects positive tabindex ordering without breaking containment', async () => {
		renderDialog(
			{},
			'<button data-testid="zero">Zero</button><button tabindex="1" data-testid="positive">Positive</button>'
		);

		const positive = page.getByTestId('positive').element() as HTMLElement;
		positive.focus();
		await expect.element(page.getByTestId('positive')).toHaveFocus();

		await userEvent.tab();
		await expect.element(page.getByTestId('zero')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('positive')).toHaveFocus();
		await userEvent.tab({ shift: true });
		await expect.element(page.getByTestId('zero')).toHaveFocus();
	});

	it('keeps image-map navigation inside the modal without forcing candidates', async () => {
		renderDialog(
			{},
			'<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="20" height="20" usemap="#nav-map" alt=""><map name="nav-map"><area href="#region" shape="rect" coords="0,0,20,20"></map><button data-testid="fallback">Fallback</button>'
		);

		const fallback = page.getByTestId('fallback').element() as HTMLElement;
		fallback.focus();
		await expect.element(page.getByTestId('fallback')).toHaveFocus();

		await userEvent.tab({ shift: true });
		await vi.waitFor(() => {
			expect(document.querySelector('dialog')?.contains(document.activeElement)).toBe(true);
		});
	});

	it('keeps background controls unreachable around an embedded frame', async () => {
		const backgroundButton = document.createElement('button');
		backgroundButton.textContent = 'background';
		document.body.appendChild(backgroundButton);

		renderDialog(
			{},
			'<iframe srcdoc="<p>Static content</p>" title="Embedded preview" style="width:6rem;height:2.5rem"></iframe><button data-testid="inner">Inner</button>'
		);

		const inner = page.getByTestId('inner').element() as HTMLElement;
		inner.focus();
		await expect.element(page.getByTestId('inner')).toHaveFocus();

		backgroundButton.focus();
		await vi.waitFor(() => {
			expect(document.activeElement).not.toBe(backgroundButton);
			expect(document.querySelector('dialog')?.contains(document.activeElement)).toBe(true);
		});

		backgroundButton.remove();
	});

	it('contains an explicitly focusable embedded frame between controls', async () => {
		renderDialog(
			{},
			'<button data-testid="before">Before</button><iframe tabindex="0" srcdoc="<p>Static content</p>" title="Embedded preview" style="width:6rem;height:2.5rem" data-testid="frame"></iframe><button data-testid="after">After</button>'
		);

		await expect.element(page.getByTestId('before')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('frame')).toHaveFocus();
		for (let i = 0; i < 4; i++) {
			await userEvent.tab();
			await vi.waitFor(() => {
				expect(document.querySelector('dialog')?.contains(document.activeElement)).toBe(
					true
				);
			});
		}
	});

	it('applies the initial-focus marker even when it is programmatically focusable only', async () => {
		renderDialog(
			{},
			'<h2 tabindex="-1" data-dialog-initial-focus data-testid="heading">Title</h2><button>Fallback</button>'
		);

		await expect.element(page.getByTestId('heading')).toHaveFocus();
	});

	it('falls back to the native target when the marked element is hidden', async () => {
		renderDialog(
			{},
			'<button data-dialog-initial-focus style="display:none" data-testid="hidden-marker">Hidden</button><button data-testid="visible">Visible</button>'
		);

		await expect.element(page.getByTestId('visible')).toHaveFocus();
	});

	it('falls back to the native target when the marked element is disabled', async () => {
		renderDialog(
			{},
			'<button data-dialog-initial-focus disabled data-testid="disabled-marker">Disabled</button><button data-testid="enabled">Enabled</button>'
		);

		await expect.element(page.getByTestId('enabled')).toHaveFocus();
	});

	it('preserves a later native autofocus target when no marker exists', async () => {
		renderDialog(
			{},
			'<button>First</button><button autofocus data-testid="autofocused">Autofocus</button>'
		);

		await expect.element(page.getByTestId('autofocused')).toHaveFocus();
	});

	it('preserves native autofocus when the initial-focus marker is invalid', async () => {
		renderDialog(
			{},
			'<button data-dialog-initial-focus style="display:none">Hidden marker</button><button>First</button><button autofocus data-testid="autofocused">Autofocus</button>'
		);

		await expect.element(page.getByTestId('autofocused')).toHaveFocus();
	});

	it('overrides native autofocus with a valid marker', async () => {
		renderDialog(
			{},
			'<button data-dialog-initial-focus data-testid="marked">Marked</button><button autofocus>Autofocus</button>'
		);

		await expect.element(page.getByTestId('marked')).toHaveFocus();
	});

	it('skips controls disabled by a disabled fieldset', async () => {
		renderDialog(
			{},
			'<fieldset disabled><button>Disabled by fieldset</button></fieldset><button data-testid="target">Enabled</button>'
		);

		await expect.element(page.getByTestId('target')).toHaveFocus();
	});

	it('keeps first-legend controls enabled inside a disabled fieldset', async () => {
		renderDialog(
			{},
			'<fieldset disabled><legend><button data-testid="legend-control">Legend control</button></legend><button>Body control</button></fieldset><button>Fallback</button>'
		);

		await expect.element(page.getByTestId('legend-control')).toHaveFocus();
	});

	it('disables controls inside later legends of a disabled fieldset', async () => {
		renderDialog(
			{},
			'<fieldset disabled><legend></legend><legend><button>Second legend control</button></legend><button>Body control</button></fieldset><button data-testid="target">Fallback</button>'
		);

		await expect.element(page.getByTestId('target')).toHaveFocus();
	});

	it('keeps anchors tabbable despite a non-applicable disabled attribute', async () => {
		renderDialog(
			{},
			'<a href="#section" disabled data-testid="link">Link</a><button>Fallback</button>'
		);

		await expect.element(page.getByTestId('link')).toHaveFocus();
	});

	it('prefers the data-dialog-initial-focus marker for initial focus', async () => {
		renderDialog(
			{},
			'<button>First</button><button data-dialog-initial-focus data-testid="marked">Marked</button>'
		);

		await expect.element(page.getByTestId('marked')).toHaveFocus();
	});

	it('wraps forward Tab from the last control to the first', async () => {
		renderDialog({}, '<button data-testid="first">First</button><button data-testid="last">Last</button>');

		await expect.element(page.getByTestId('first')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('last')).toHaveFocus();
		await userEvent.tab();
		await expect.element(page.getByTestId('first')).toHaveFocus();
	});

	it('wraps backward Shift+Tab from the first control to the last', async () => {
		renderDialog({}, '<button data-testid="first">First</button><button data-testid="last">Last</button>');

		await expect.element(page.getByTestId('first')).toHaveFocus();
		await userEvent.tab({ shift: true });
		await expect.element(page.getByTestId('last')).toHaveFocus();
	});

	it('prevents background elements from receiving focus while modal', async () => {
		const backgroundButton = document.createElement('button');
		backgroundButton.textContent = 'background';
		document.body.appendChild(backgroundButton);

		renderDialog({}, '<button data-testid="inner">Inner</button>');

		await expect.element(page.getByTestId('inner')).toHaveFocus();
		backgroundButton.focus();
		await vi.waitFor(() => {
			expect(document.activeElement).not.toBe(backgroundButton);
		});

		backgroundButton.remove();
	});

	it('focuses the container and traps Tab when the dialog has no focusable controls', async () => {
		renderDialog({}, '<p>Nothing focusable here</p>');

		await vi.waitFor(() => {
			expect(document.activeElement).toBe(dialogElement());
		});
		await userEvent.tab();
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(dialogElement());
		});
	});

	it('calls onClose exactly once on Escape and honors a close guard', async () => {
		const { onClose } = renderDialog({}, '<button>Close</button>');

		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		await userEvent.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalledOnce();
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
	});

	it('closes through the backdrop when enabled', async () => {
		const { onClose } = renderDialog();

		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		const dialog = dialogElement()!;
		dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		dialog.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('does not close through the backdrop when disabled', async () => {
		const { onClose } = renderDialog({ closeOnBackdrop: false });

		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		const dialog = dialogElement()!;
		dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		dialog.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
		expect(onClose).not.toHaveBeenCalled();
	});

	it('does not close when a pointer drag starts inside the panel', async () => {
		const { onClose } = renderDialog({}, '<button data-testid="inside">Inside</button>');

		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		const inside = page.getByTestId('inside').element();
		inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		dialogElement()!.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
		expect(onClose).not.toHaveBeenCalled();
	});

	it('restores focus to a connected trigger on close', async () => {
		const trigger = document.createElement('button');
		trigger.textContent = 'opener';
		document.body.appendChild(trigger);
		trigger.focus();

		const { view, onClose } = renderDialog({ open: false });
		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		await view.rerender({
			open: false,
			onClose,
			children: snippet('<button>Close</button>')
		});

		await vi.waitFor(() => {
			expect(document.activeElement).toBe(trigger);
		});
		trigger.remove();
	});

	it('does not attempt to focus a removed trigger on close', async () => {
		const trigger = document.createElement('button');
		trigger.textContent = 'opener';
		document.body.appendChild(trigger);
		trigger.focus();

		const { view, onClose } = renderDialog({ open: false });
		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Close</button>')
		});
		trigger.remove();
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		await view.rerender({
			open: false,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(false);
		});
	});

	it('locks and restores page and scroll-root overflow values', async () => {
		const scrollRoot = document.createElement('div');
		scrollRoot.setAttribute('data-modal-scroll-root', '');
		document.body.appendChild(scrollRoot);
		scrollRoot.style.overflow = 'auto';
		document.body.style.overflow = 'auto';

		const { view, onClose } = renderDialog({ open: false });
		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		expect(document.body.style.overflow).toBe('hidden');
		expect(scrollRoot.style.overflow).toBe('hidden');

		await view.rerender({
			open: false,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});
		expect(scrollRoot.style.overflow).toBe('auto');
	});

	it('unmounts an open dialog cleanly, releasing scrolling and the coordinator', async () => {
		document.body.style.overflow = 'auto';
		const { view } = renderDialog();
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		expect(document.body.style.overflow).toBe('hidden');

		await unmountTracked(view);
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('queues a second dialog until the first one releases', async () => {
		const firstOnClose = vi.fn();
		const secondOnClose = vi.fn();
		const first = renderTracked({
			open: true,
			onClose: firstOnClose,
			children: snippet('<button>First</button>')
		});
		const second = renderTracked({
			open: true,
			onClose: secondOnClose,
			children: snippet('<button>Second</button>')
		});

		const dialogs = Array.from(document.querySelectorAll('dialog'));
		expect(dialogs).toHaveLength(2);
		await vi.waitFor(() => {
			expect(dialogs[0]?.open).toBe(true);
		});
		expect(dialogs[1]?.open).toBe(false);

		await first.rerender({
			open: false,
			onClose: firstOnClose,
			children: snippet('<button>First</button>')
		});
		await vi.waitFor(() => {
			expect(dialogs[1]?.open).toBe(true);
		});
		expect(dialogs[0]?.open).toBe(false);

		await unmountTracked(second);
		await unmountTracked(first);
	});

	it('removes an unmounted queued dialog from the coordinator', async () => {
		const firstOnClose = vi.fn();
		const secondOnClose = vi.fn();
		const first = renderTracked({
			open: true,
			onClose: firstOnClose,
			children: snippet('<button>First</button>')
		});
		const second = renderTracked({
			open: true,
			onClose: secondOnClose,
			children: snippet('<button>Second</button>')
		});
		const dialogs = Array.from(document.querySelectorAll('dialog'));
		await vi.waitFor(() => {
			expect(dialogs[0]?.open).toBe(true);
		});

		await unmountTracked(second);
		await first.rerender({
			open: false,
			onClose: firstOnClose,
			children: snippet('<button>First</button>')
		});
		await vi.waitFor(() => {
			expect(dialogs[0]?.open).toBe(false);
		});
		expect(document.querySelectorAll('dialog')).toHaveLength(1);

		await unmountTracked(first);
	});

	it('reconciles scroll, focus, and coordinator after an unexpected native close', async () => {
		const trigger = document.createElement('button');
		trigger.textContent = 'opener';
		document.body.appendChild(trigger);
		trigger.focus();

		const scrollRoot = document.createElement('div');
		scrollRoot.setAttribute('data-modal-scroll-root', '');
		document.body.appendChild(scrollRoot);
		scrollRoot.style.overflow = 'scroll';
		document.body.style.overflow = 'auto';

		const { view, onClose } = renderDialog({ open: false, restoreFocus: () => trigger });
		await view.rerender({
			open: true,
			restoreFocus: () => trigger,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		expect(document.body.style.overflow).toBe('hidden');
		expect(scrollRoot.style.overflow).toBe('hidden');

		dialogElement()!.close();
		await vi.waitFor(() => {
			expect(onClose).toHaveBeenCalledTimes(1);
		});
		expect(document.body.style.overflow).toBe('auto');
		expect(scrollRoot.style.overflow).toBe('scroll');
		expect(document.activeElement).toBe(trigger);

		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(onClose).toHaveBeenCalledTimes(1);

		trigger.remove();
		scrollRoot.remove();
	});

	it('activates a queued dialog immediately when the active one closes natively', async () => {
		const firstOnClose = vi.fn();
		const secondOnClose = vi.fn();
		document.body.style.overflow = 'auto';
		const first = renderTracked({
			open: true,
			onClose: firstOnClose,
			children: snippet('<button>First</button>')
		});
		const second = renderTracked({
			open: true,
			onClose: secondOnClose,
			children: snippet('<button>Second</button>')
		});

		const dialogs = Array.from(document.querySelectorAll('dialog'));
		expect(dialogs).toHaveLength(2);
		await vi.waitFor(() => {
			expect(dialogs[0]?.open).toBe(true);
		});
		expect(dialogs[1]?.open).toBe(false);

		dialogs[0]!.close();
		await vi.waitFor(() => {
			expect(dialogs[1]?.open).toBe(true);
		});
		expect(firstOnClose).toHaveBeenCalledTimes(1);
		expect(dialogs[0]?.open).toBe(false);
		expect(document.body.style.overflow).toBe('hidden');

		await second.rerender({
			open: false,
			onClose: secondOnClose,
			children: snippet('<button>Second</button>')
		});
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});

		await unmountTracked(second);
		await unmountTracked(first);
	});

	it('does not invoke onClose for the coordinator-driven native close event', async () => {
		const { view, onClose } = renderDialog();
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});

		let nativeCloseEvents = 0;
		dialogElement()!.addEventListener('close', () => {
			nativeCloseEvents += 1;
		});

		await view.rerender({
			open: false,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(nativeCloseEvents).toBe(1);
		});
		expect(onClose).not.toHaveBeenCalled();
	});

	it('supports a fresh lifecycle after an unexpected native close and resync', async () => {
		document.body.style.overflow = 'auto';
		const { view, onClose } = renderDialog({ open: false });
		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		expect(document.body.style.overflow).toBe('hidden');

		dialogElement()!.close();
		await view.rerender({
			open: false,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Reopened</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
			expect(document.body.style.overflow).toBe('hidden');
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('reopens cleanly when open cycles before the coordinator close event lands', async () => {
		document.body.style.overflow = 'auto';
		const { view, onClose } = renderDialog({ open: false });
		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});

		await view.rerender({
			open: false,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Reopened</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
			expect(document.body.style.overflow).toBe('hidden');
		});
		expect(onClose).not.toHaveBeenCalled();

		await view.rerender({
			open: false,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});
	});

	it('defers reopening until the outstanding native close event is consumed', async () => {
		document.body.style.overflow = 'auto';
		const { view, onClose } = renderDialog({ open: false });
		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});

		const dialog = dialogElement()!;
		dialog.removeAttribute('open');

		await view.rerender({
			open: false,
			onClose,
			children: snippet('<button>Close</button>')
		});
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(document.body.style.overflow).toBe('auto');

		await view.rerender({
			open: true,
			onClose,
			children: snippet('<button>Reopened</button>')
		});
		expect(dialog.open).toBe(false);

		dialog.dispatchEvent(new Event('close'));
		await vi.waitFor(() => {
			expect(dialog.open).toBe(true);
			expect(document.body.style.overflow).toBe('hidden');
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	const renderQueuedTrio = () => {
		const firstOnClose = vi.fn();
		const secondOnClose = vi.fn();
		const thirdOnClose = vi.fn();
		document.body.style.overflow = 'auto';
		const first = renderTracked({
			open: true,
			onClose: firstOnClose,
			children: snippet('<button>First</button>')
		});
		const second = renderTracked({
			open: true,
			onClose: secondOnClose,
			children: snippet('<button>Second</button>')
		});
		const third = renderTracked({
			open: true,
			onClose: thirdOnClose,
			children: snippet('<button>Third</button>')
		});
		const dialogs = Array.from(document.querySelectorAll('dialog'));
		return { first, second, third, dialogs, firstOnClose, secondOnClose, thirdOnClose };
	};

	it('advances the queue when showModal throws and notifies the failed consumer once', async () => {
		const trio = renderQueuedTrio();
		await vi.waitFor(() => {
			expect(trio.dialogs[0]?.open).toBe(true);
		});
		expect(trio.dialogs[1]?.open).toBe(false);
		expect(trio.dialogs[2]?.open).toBe(false);

		trio.dialogs[1]!.showModal = () => {
			throw new DOMException('simulated activation failure', 'InvalidStateError');
		};

		await trio.first.rerender({
			open: false,
			onClose: trio.firstOnClose,
			children: snippet('<button>First</button>')
		});

		await vi.waitFor(() => {
			expect(trio.dialogs[2]?.open).toBe(true);
		});
		expect(trio.dialogs[1]?.open).toBe(false);
		expect(trio.secondOnClose).toHaveBeenCalledTimes(1);
		expect(trio.firstOnClose).not.toHaveBeenCalled();
		expect(trio.thirdOnClose).not.toHaveBeenCalled();
		expect(document.body.style.overflow).toBe('hidden');

		await trio.third.rerender({
			open: false,
			onClose: trio.thirdOnClose,
			children: snippet('<button>Third</button>')
		});
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});

		await unmountTracked(trio.first);
		await unmountTracked(trio.second);
		await unmountTracked(trio.third);
	});

	it('advances the queue when showModal returns without opening', async () => {
		const trio = renderQueuedTrio();
		await vi.waitFor(() => {
			expect(trio.dialogs[0]?.open).toBe(true);
		});

		trio.dialogs[1]!.showModal = () => {};

		await trio.first.rerender({
			open: false,
			onClose: trio.firstOnClose,
			children: snippet('<button>First</button>')
		});

		await vi.waitFor(() => {
			expect(trio.dialogs[2]?.open).toBe(true);
		});
		expect(trio.dialogs[1]?.open).toBe(false);
		expect(trio.secondOnClose).toHaveBeenCalledTimes(1);
		expect(document.body.style.overflow).toBe('hidden');

		await trio.third.rerender({
			open: false,
			onClose: trio.thirdOnClose,
			children: snippet('<button>Third</button>')
		});
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});

		await unmountTracked(trio.first);
		await unmountTracked(trio.second);
		await unmountTracked(trio.third);
	});

	it('reconciles every failed activation even when a consumer callback throws', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		document.body.style.overflow = 'auto';
		const firstOnClose = vi.fn();
		const secondOnClose = vi.fn().mockImplementation(() => {
			throw new Error('consumer failure');
		});
		const thirdOnClose = vi.fn();
		const fourthOnClose = vi.fn();

		const first = renderTracked({
			open: true,
			onClose: firstOnClose,
			children: snippet('<button>First</button>')
		});
		const second = renderTracked({
			open: true,
			onClose: secondOnClose,
			children: snippet('<button>Second</button>')
		});
		const third = renderTracked({
			open: true,
			onClose: thirdOnClose,
			children: snippet('<button>Third</button>')
		});
		const fourth = renderTracked({
			open: true,
			onClose: fourthOnClose,
			children: snippet('<button>Fourth</button>')
		});

		const dialogs = Array.from(document.querySelectorAll('dialog'));
		await vi.waitFor(() => {
			expect(dialogs[0]?.open).toBe(true);
		});
		expect(dialogs[1]?.open).toBe(false);
		expect(dialogs[2]?.open).toBe(false);
		expect(dialogs[3]?.open).toBe(false);

		dialogs[1]!.showModal = () => {
			throw new DOMException('simulated failure', 'InvalidStateError');
		};
		dialogs[2]!.showModal = () => {
			throw new DOMException('simulated failure', 'InvalidStateError');
		};

		await first.rerender({
			open: false,
			onClose: firstOnClose,
			children: snippet('<button>First</button>')
		});

		await vi.waitFor(() => {
			expect(dialogs[3]?.open).toBe(true);
		});
		expect(secondOnClose).toHaveBeenCalledTimes(1);
		expect(thirdOnClose).toHaveBeenCalledTimes(1);
		expect(fourthOnClose).not.toHaveBeenCalled();
		expect(firstOnClose).not.toHaveBeenCalled();
		expect(document.body.style.overflow).toBe('hidden');
		expect(errorSpy).toHaveBeenCalledTimes(1);

		await fourth.rerender({
			open: false,
			onClose: fourthOnClose,
			children: snippet('<button>Fourth</button>')
		});
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});

		errorSpy.mockRestore();
		await unmountTracked(first);
		await unmountTracked(second);
		await unmountTracked(third);
		await unmountTracked(fourth);
	});

	it('advances the queue when focus restoration throws', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		document.body.style.overflow = 'auto';
		const restoreFocus = (): null => {
			throw new Error('restore failure');
		};
		const firstOnClose = vi.fn();
		const secondOnClose = vi.fn();

		const first = renderTracked({
			open: true,
			onClose: firstOnClose,
			restoreFocus,
			children: snippet('<button>First</button>')
		});
		const second = renderTracked({
			open: true,
			onClose: secondOnClose,
			children: snippet('<button>Second</button>')
		});

		const dialogs = Array.from(document.querySelectorAll('dialog'));
		await vi.waitFor(() => {
			expect(dialogs[0]?.open).toBe(true);
		});
		expect(dialogs[1]?.open).toBe(false);

		await first.rerender({
			open: false,
			onClose: firstOnClose,
			restoreFocus,
			children: snippet('<button>First</button>')
		});

		await vi.waitFor(() => {
			expect(dialogs[1]?.open).toBe(true);
		});
		expect(dialogs[0]?.open).toBe(false);
		expect(document.body.style.overflow).toBe('hidden');
		expect(errorSpy).toHaveBeenCalledTimes(1);

		await second.rerender({
			open: false,
			onClose: secondOnClose,
			children: snippet('<button>Second</button>')
		});
		await vi.waitFor(() => {
			expect(document.body.style.overflow).toBe('auto');
		});

		errorSpy.mockRestore();
		await unmountTracked(first);
		await unmountTracked(second);
	});

	it('does not focus the captured invoker when restoreFocus returns null', async () => {
		const trigger = document.createElement('button');
		trigger.textContent = 'opener';
		document.body.appendChild(trigger);
		trigger.focus();
		const focusSpy = vi.spyOn(trigger, 'focus');

		const { view, onClose } = renderDialog({ open: false, restoreFocus: () => null });
		await view.rerender({
			open: true,
			onClose,
			restoreFocus: () => null,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});
		const callsBeforeClose = focusSpy.mock.calls.length;

		await view.rerender({
			open: false,
			onClose,
			restoreFocus: () => null,
			children: snippet('<button>Close</button>')
		});
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(false);
		});
		expect(focusSpy.mock.calls.length).toBe(callsBeforeClose);

		trigger.remove();
	});

	it('treats form method="dialog" submission as an unexpected native close', async () => {
		const { onClose } = renderDialog(
			{},
			'<form method="dialog"><button type="submit" data-testid="form-close">Close</button></form><button>Other</button>'
		);
		await vi.waitFor(() => {
			expect(dialogElement()?.open).toBe(true);
		});

		await userEvent.click(page.getByTestId('form-close'));

		await vi.waitFor(() => {
			expect(onClose).toHaveBeenCalledTimes(1);
		});
		expect(dialogElement()?.open).toBe(false);
	});
});
