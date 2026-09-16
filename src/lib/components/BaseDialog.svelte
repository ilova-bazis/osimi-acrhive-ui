<script module lang="ts">
	type ModalEntry = {
		element: HTMLDialogElement;
		activate: () => boolean;
		deactivate: () => void;
		onActivationFailure: () => void;
	};

	const modalQueue: ModalEntry[] = [];
	let activeModal: ModalEntry | null = null;

	const activateNextModal = (): void => {
		const failed: ModalEntry[] = [];

		while (!activeModal) {
			const entry = modalQueue.find((candidate) => candidate.element.isConnected);
			if (!entry) break;

			activeModal = entry;
			if (entry.activate()) break;

			const index = modalQueue.indexOf(entry);
			if (index !== -1) modalQueue.splice(index, 1);
			activeModal = null;
			failed.push(entry);
		}

		let firstFailure: unknown = null;
		for (const entry of failed) {
			try {
				entry.onActivationFailure();
			} catch (error) {
				firstFailure ??= error;
			}
		}
		if (firstFailure !== null) {
			console.error('BaseDialog: activation-failure callback threw', firstFailure);
		}
	};

	const registerModalDialog = (entry: ModalEntry): void => {
		modalQueue.push(entry);
		activateNextModal();
	};

	const releaseModalDialog = (entry: ModalEntry): void => {
		const index = modalQueue.indexOf(entry);
		if (index !== -1) modalQueue.splice(index, 1);
		if (activeModal !== entry) return;
		activeModal = null;

		let deactivationError: unknown = null;
		try {
			entry.deactivate();
		} catch (error) {
			deactivationError = error;
		}
		activateNextModal();

		if (deactivationError !== null) {
			console.error('BaseDialog: deactivation failed', deactivationError);
		}
	};
</script>

<script lang="ts">
	import { createFocusTrap, type FocusTrap } from 'focus-trap';
	import type { Snippet } from 'svelte';

	const DEFAULT_PANEL_CLASS =
		'w-full max-w-lg rounded-2xl border border-border-soft bg-surface-white p-6 shadow-xl';
	const DEFAULT_CONTAINER_CLASS = 'place-items-center p-4';
	const DEFAULT_BACKDROP_CLASS = 'backdrop:bg-blue-slate/45';

	let {
		open,
		labelledBy,
		label,
		describedBy,
		role = 'dialog',
		closeOnBackdrop = true,
		containerClass,
		panelClass,
		backdropClass,
		restoreFocus,
		onClose,
		children
	} = $props<{
		open: boolean;
		labelledBy?: string;
		label?: string;
		describedBy?: string;
		role?: 'dialog' | 'alertdialog';
		closeOnBackdrop?: boolean;
		containerClass?: string;
		panelClass?: string;
		backdropClass?: string;
		restoreFocus?: () => HTMLElement | null;
		onClose: () => void;
		children: Snippet;
	}>();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);

	let savedInvoker: HTMLElement | null = null;
	let pointerDownOutside = false;
	const scrollLockValues: Array<{ element: HTMLElement; overflow: string }> = [];
	let modalEntry: ModalEntry | null = null;
	let isActive = false;
	let activeFocusTrap: FocusTrap | null = null;
	type PendingCloseKind = 'coordinator' | 'external-notified';
	let pendingCloseKind: PendingCloseKind | null = null;
	let awaitingOpenReset = false;

	const createDialogFocusTrap = (dialog: HTMLDialogElement): FocusTrap => {
		return createFocusTrap(dialog, {
			fallbackFocus: dialog,
			initialFocus:
				() => dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]') ?? undefined,
			escapeDeactivates: false,
			clickOutsideDeactivates: false,
			returnFocusOnDeactivate: false,
			allowOutsideClick: true
		});
	};

	const lockScrolling = (): void => {
		const targets = [document.documentElement, document.body];
		const routeRoot = document.querySelector<HTMLElement>('[data-modal-scroll-root]');
		if (routeRoot) targets.push(routeRoot);
		for (const target of targets) {
			scrollLockValues.push({ element: target, overflow: target.style.overflow });
			target.style.overflow = 'hidden';
		}
	};

	const unlockScrolling = (): void => {
		while (scrollLockValues.length > 0) {
			const entry = scrollLockValues.pop();
			if (entry) entry.element.style.overflow = entry.overflow;
		}
	};

	const restoreInvoker = (): void => {
		try {
			const target = restoreFocus ? restoreFocus() : savedInvoker;
			if (target?.isConnected) target.focus();
		} finally {
			savedInvoker = null;
		}
	};

	const activate = (): boolean => {
		const dialog = dialogEl;
		if (!dialog || isActive || dialog.open) return false;

		savedInvoker =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;

		lockScrolling();

		try {
			dialog.showModal();
		} catch {
			unlockScrolling();
			savedInvoker = null;
			return false;
		}

		if (!dialog.open) {
			unlockScrolling();
			savedInvoker = null;
			return false;
		}

		isActive = true;
		activeFocusTrap = createDialogFocusTrap(dialog);
		activeFocusTrap.activate();

		return true;
	};

	const deactivate = (): void => {
		if (!isActive) return;

		isActive = false;
		pointerDownOutside = false;

		if (activeFocusTrap) {
			activeFocusTrap.deactivate();
			activeFocusTrap = null;
		}

		if (dialogEl?.open) {
			pendingCloseKind = 'coordinator';
			dialogEl.close();
		}

		unlockScrolling();
		restoreInvoker();
	};

	const releaseCurrentModal = (): void => {
		const entry = modalEntry;
		if (!entry) return;

		modalEntry = null;
		releaseModalDialog(entry);
	};

	const registerCurrentModal = (): void => {
		if (!open || !dialogEl || modalEntry || pendingCloseKind || awaitingOpenReset) return;

		const entry: ModalEntry = {
			element: dialogEl,
			activate,
			deactivate,
			onActivationFailure: () => handleActivationFailure(entry)
		};
		modalEntry = entry;
		registerModalDialog(entry);
	};

	const handleActivationFailure = (entry: ModalEntry): void => {
		if (modalEntry !== entry) return;

		modalEntry = null;
		awaitingOpenReset = true;
		onClose();
	};

	const handleNativeClose = (): void => {
		if (pendingCloseKind) {
			pendingCloseKind = null;
			registerCurrentModal();
			return;
		}

		if (!isActive || !modalEntry) return;

		awaitingOpenReset = true;
		releaseCurrentModal();
		onClose();
	};

	$effect(() => {
		const dialog = dialogEl;
		if (!dialog) return;

		if (!open) {
			awaitingOpenReset = false;

			if (isActive && !dialog.open && pendingCloseKind === null) {
				pendingCloseKind = 'external-notified';
				releaseCurrentModal();
				onClose();
				return;
			}

			releaseCurrentModal();
			return;
		}

		registerCurrentModal();
	});

	$effect(() => {
		return () => {
			releaseCurrentModal();
		};
	});

	const isOutsidePanel = (target: EventTarget | null): boolean => {
		if (!panelEl) return false;
		return target instanceof Node && !panelEl.contains(target);
	};

	const handlePointerDown = (event: PointerEvent): void => {
		if (!closeOnBackdrop) return;
		pointerDownOutside = isOutsidePanel(event.target);
	};

	const handlePointerUp = (event: PointerEvent): void => {
		if (!closeOnBackdrop || !pointerDownOutside) return;
		pointerDownOutside = false;
		if (isOutsidePanel(event.target)) onClose();
	};
</script>

<dialog
	bind:this={dialogEl}
	role={role}
	aria-labelledby={labelledBy ?? undefined}
	aria-label={labelledBy ? undefined : label}
	aria-describedby={describedBy ?? undefined}
	tabindex="-1"
	class={[
		'inset-0 m-0 h-full w-full max-h-none max-w-none bg-transparent p-0',
		backdropClass ?? DEFAULT_BACKDROP_CLASS
	].join(' ')}
	oncancel={(event) => {
		event.preventDefault();
		onClose();
	}}
	onclose={handleNativeClose}
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
>
	{#if open}
		<div class={['grid h-full w-full', containerClass ?? DEFAULT_CONTAINER_CLASS].join(' ')}>
			<div bind:this={panelEl} class={panelClass ?? DEFAULT_PANEL_CLASS}>
				{@render children()}
			</div>
		</div>
	{/if}
</dialog>
