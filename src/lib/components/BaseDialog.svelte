<script lang="ts">
	let {
		open,
		labelledBy,
		onClose,
		children
	} = $props<{
		open: boolean;
		labelledBy: string;
		onClose: () => void;
		children?: () => unknown;
	}>();

	let dialogEl = $state<HTMLDivElement>();
	let restoreFocusTo = $state<HTMLElement | null>(null);

	const focusable = (): HTMLElement[] => {
		if (!dialogEl) return [];
		return Array.from(
			dialogEl.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		).filter((element) => !element.hasAttribute('disabled'));
	};

	$effect(() => {
		if (open) {
			restoreFocusTo = document.activeElement as HTMLElement | null;
			queueMicrotask(() => {
				(focusable()[0] ?? dialogEl)?.focus();
			});
			return;
		}

		restoreFocusTo?.focus();
		restoreFocusTo = null;
	});

	const handleKeydown = (event: KeyboardEvent) => {
		if (!open || !dialogEl) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
			return;
		}

		if (event.key !== 'Tab') return;

		const focusables = focusable();
		if (focusables.length === 0) return;

		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement as HTMLElement | null;

		if (event.shiftKey && (active === first || !dialogEl.contains(active))) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && (active === last || !dialogEl.contains(active))) {
			event.preventDefault();
			first.focus();
		}
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-blue-slate/45 p-4"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) onClose();
		}}
	>
		<div
			bind:this={dialogEl}
			role="dialog"
			aria-modal="true"
			aria-labelledby={labelledBy}
			tabindex="-1"
			class="w-full max-w-lg rounded-2xl border border-border-soft bg-surface-white p-6 shadow-xl outline-none"
		>
			{@render children?.()}
		</div>
	</div>
{/if}
