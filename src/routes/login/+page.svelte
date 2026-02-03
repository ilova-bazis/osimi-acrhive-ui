<script lang="ts">
	import type { ActionData } from './$types';
	import { listDemoAccounts } from '$lib/auth/demoAccounts';

	export let form: ActionData;

	let username = '';
	let password = '';

	const demoAccounts = listDemoAccounts();

	$: errorMessage = form?.error ?? '';
</script>

<div class="min-h-screen bg-alabaster-grey text-text-ink">
	<main class="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-8 px-6 py-12 lg:flex-row lg:items-center">
		<section class="flex-1 space-y-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Osimi Digital Library</p>
			<h1 class="font-display text-3xl text-burnt-peach">Authorized Access</h1>
			<p class="max-w-md text-sm text-text-muted">
				This interface is reserved for authorized archivists. Sign in to continue the ingestion workflow.
			</p>
			<div class="rounded-2xl border border-border-soft bg-surface-white p-5">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Demo credentials</p>
				<div class="mt-4 space-y-3 text-sm">
					{#each demoAccounts as account (account.role)}
						<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-soft bg-pale-sky/20 px-3 py-2">
							<span class="text-blue-slate">{account.role}</span>
							<span class="text-text-ink">{account.username}:{account.password}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="flex w-full max-w-md flex-1 flex-col gap-4 rounded-2xl border border-border-soft bg-surface-white p-6">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Sign in</p>
				<h2 class="mt-2 font-display text-2xl text-text-ink">Continue to ingestion</h2>
				<p class="mt-2 text-sm text-text-muted">Use one of the demo accounts to test roles.</p>
			</div>
			<form class="space-y-4" method="POST">
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
					class="w-full rounded-xl bg-blue-slate px-4 py-3 text-sm font-medium text-surface-white transition hover:opacity-90"
				>
					Sign in
				</button>
			</form>
			<p class="text-xs text-text-muted">
				By continuing, you confirm that this session will handle sensitive archival material.
			</p>
		</section>
	</main>
</div>
