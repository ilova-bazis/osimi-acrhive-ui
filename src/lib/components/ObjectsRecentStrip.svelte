<script lang="ts">
	import { resolve } from '$app/paths';
	import Chip from '$lib/components/Chip.svelte';
	import ObjectThumbnail from '$lib/components/ObjectThumbnail.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';
	import type { ObjectRow } from '$lib/services/objects';

	let { recent } = $props<{ recent: ObjectRow[] }>();

	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);

	const titleFallback = (row: ObjectRow) =>
		formatTemplate(t('objects.recent.untitled'), { suffix: row.objectId.slice(-6) });
	const availabilityLabel = (value: ObjectRow['availabilityState']) => value.replace(/_/g, ' ');
</script>

<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
	<div class="flex items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.recent.title')}</p>
			<p class="mt-1 text-sm text-text-muted">{t('objects.recent.subtitle')}</p>
		</div>
		<p class="text-xs text-text-muted">{formatTemplate(t('objects.recent.lastCount'), { count: recent.length })}</p>
	</div>
	<div class="mt-4 flex gap-4 overflow-x-auto pb-2">
		{#each recent as item (item.id)}
			<a
				href={resolve('/objects/[objectId]', { objectId: item.objectId })}
				class="min-w-[220px] rounded-xl border border-border-soft bg-alabaster-grey/60 p-3 shadow-[0_10px_20px_rgba(79,109,122,0.08)] transition hover:-translate-y-0.5 hover:border-blue-slate/45"
			>
				<ObjectThumbnail
					objectId={item.objectId}
					thumbnailArtifactId={item.thumbnailArtifactId}
					objectType={item.type}
					class="h-28 w-full"
				/>
				<p class="mt-3 text-sm font-medium text-text-ink">{item.title ?? titleFallback(item)}</p>
				<p class="mt-1 text-xs text-text-muted">{item.type}</p>
				<div class="mt-2 flex items-center gap-2">
					<Chip class="border-blue-slate/30 bg-pale-sky/20 text-[10px] text-blue-slate">
						{availabilityLabel(item.availabilityState)}
					</Chip>
					{#if !item.canDownload}
						<Chip class="border-burnt-peach/30 bg-pearl-beige text-[10px] text-burnt-peach">{t('objects.recent.restricted')}</Chip>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</section>
