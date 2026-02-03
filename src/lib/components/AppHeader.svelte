<script lang="ts">
	let {
		library,
		title,
		username,
		role,
		logoutLabel = 'Sign out'
	} = $props<{
		library: string;
		title: string;
		username: string;
		role: string;
		logoutLabel?: string;
	}>();
</script>

<header class="border-b border-border-soft bg-surface-white px-6 py-4">
	<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{library}</p>
			<h1 class="font-display text-2xl text-burnt-peach">{title}</h1>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<div class="rounded-full border border-border-soft bg-surface-white px-4 py-2 text-xs text-blue-slate">
				{username} · {role}
			</div>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/35"
				>
					{logoutLabel}
				</button>
			</form>
		</div>
	</div>
</header>
