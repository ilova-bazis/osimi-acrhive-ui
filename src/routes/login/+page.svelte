<script lang="ts">
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { translate } from '$lib/i18n/translate';

	let { form } = $props<{ form?: { error?: string; username?: string } }>();

	let username = $state('');
	let password = $state('');
	let isSubmitting = $state(false);
	const errorMessage = $derived(form?.error ?? '');
	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);
</script>

<div class="min-h-screen bg-alabaster-grey text-text-ink">
	<main class="mx-auto grid min-h-screen max-w-5xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
		<section class="order-2 space-y-6 lg:order-1">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('login.library')}</p>
			<h1 class="font-display text-3xl text-burnt-peach">{t('login.title')}</h1>
			<p class="max-w-lg text-sm text-text-muted">
				{t('login.description')}
			</p>
			<div class="max-w-md rounded-2xl border border-border-soft bg-surface-white/70 p-4 text-xs text-text-muted">
				{t('login.authHint')}
			</div>
		</section>

		<section class="order-1 flex w-full flex-col gap-4 rounded-2xl border border-border-soft bg-surface-white p-6 shadow-[0_18px_45px_rgba(79,109,122,0.15)] lg:order-2">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('login.signIn')}</p>
				<h2 class="mt-2 font-display text-2xl text-text-ink">{t('login.continue')}</h2>
				<p class="mt-2 text-sm text-text-muted">{t('login.demoHint')}</p>
			</div>
			<form class="space-y-4" method="POST" onsubmit={() => (isSubmitting = true)}>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="username">
						{t('login.username')}
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
						{t('login.password')}
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
					{isSubmitting ? t('login.signingIn') : t('login.signIn')}
				</button>
			</form>
			<p class="text-xs text-text-muted">
				{t('login.byContinuing')}
			</p>
		</section>
	</main>
</div>
