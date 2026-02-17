<script lang="ts">
	let { form } = $props<{ form?: { error?: string; username?: string } }>();

	let username = $state('');
	let password = $state('');
	let isSubmitting = $state(false);
	const errorMessage = $derived(form?.error ?? '');
</script>

<div class="min-h-screen bg-alabaster-grey text-text-ink">
	<main class="mx-auto grid min-h-screen max-w-5xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
		<section class="order-2 space-y-6 lg:order-1">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Osimi Digital Library</p>
			<h1 class="font-display text-3xl text-burnt-peach">Authorized Access</h1>
			<p class="max-w-lg text-sm text-text-muted">
				This interface is reserved for authorized archivists. Sign in to continue the ingestion workflow.
			</p>
			<div class="max-w-md rounded-2xl border border-border-soft bg-surface-white/70 p-4 text-xs text-text-muted">
				Authentication is handled by the backend. Use your assigned credentials to continue.
			</div>
		</section>

		<section class="order-1 flex w-full flex-col gap-4 rounded-2xl border border-border-soft bg-surface-white p-6 shadow-[0_18px_45px_rgba(79,109,122,0.15)] lg:order-2">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Sign in</p>
				<h2 class="mt-2 font-display text-2xl text-text-ink">Continue to ingestion</h2>
				<p class="mt-2 text-sm text-text-muted">Use one of the demo accounts to test roles.</p>
			</div>
			<form class="space-y-4" method="POST" onsubmit={() => (isSubmitting = true)}>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="username">
						Username
					</label>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={username}
						required
					/>
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="password">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={password}
						required
					/>
				</div>
				{#if errorMessage}
					<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
						{errorMessage}
					</p>
				{/if}
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full rounded-xl bg-blue-slate px-4 py-3 text-sm font-medium text-surface-white transition hover:opacity-90"
				>
					{isSubmitting ? 'Signing in...' : 'Sign in'}
				</button>
			</form>
			<p class="text-xs text-text-muted">
				By continuing, you confirm that this session will handle sensitive archival material.
			</p>
		</section>
	</main>
</div>
