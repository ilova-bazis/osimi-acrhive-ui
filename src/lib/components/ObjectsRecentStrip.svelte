<script lang="ts">
	import { resolve } from '$app/paths';
	import Chip from '$lib/components/Chip.svelte';
	import ObjectThumbnail from '$lib/components/ObjectThumbnail.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations, type TranslationKey } from '$lib/i18n/translations';
	import { availabilityStateKeys, knownObjectTypeKey } from '$lib/i18n/domainLabels';
	import { formatCount } from '$lib/i18n/format';
	import { formatPlural, formatTemplate, translate } from '$lib/i18n/translate';
	import { withObjectsReturnTo } from '$lib/objects/navigation';
	import type { ObjectRow } from '$lib/services/objects';

	let { recent, returnTo } = $props<{ recent: ObjectRow[]; returnTo: string }>();
	const objectHref = (objectId: string): string =>
		withObjectsReturnTo(`/objects/${objectId}`, returnTo);

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	const titleFallback = (row: ObjectRow) =>
		formatTemplate(t('objects.recent.untitled'), { suffix: row.objectId.slice(-6) });
	const availabilityLabel = (value: ObjectRow['availabilityState']) => t(availabilityStateKeys[value]);
	const objectTypeLabel = (type: string): string => {
		const key = knownObjectTypeKey(type);
		return key ? t(key) : type;
	};

</script>

{#if recent.length > 0}
<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
	<div class="flex items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.recent.title')}</p>
			<p class="mt-1 text-sm text-text-muted">{t('objects.recent.subtitle')}</p>
		</div>
		<p class="text-xs text-text-muted">{formatTemplate(formatPlural(dictionary, 'objects.recent.lastCount', recent.length, $locale), { count: formatCount(recent.length, $locale) })}</p>
	</div>
	<div class="mt-4 flex gap-4 overflow-x-auto pb-2">
		{#each recent as item (item.id)}
			<a
				href={resolve(objectHref(item.objectId) as '/objects')}
				class="min-w-[220px] rounded-2xl border border-border-soft bg-alabaster-grey/60 p-3 shadow-[0_10px_20px_rgba(79,109,122,0.08)] transition hover:-translate-y-0.5 hover:border-blue-slate/45 hover:shadow-[0_14px_28px_rgba(79,109,122,0.14)]"
			>
				<ObjectThumbnail
					objectId={item.objectId}
					thumbnailArtifactId={item.thumbnailArtifactId}
					objectType={item.type}
					class="h-28 w-full"
				/>
				<p class="mt-3 line-clamp-2 text-sm font-medium text-text-ink">{item.title ?? titleFallback(item)}</p>
				<p class="mt-1 text-xs text-text-muted">{objectTypeLabel(item.type)}</p>
				<div class="mt-2 flex items-center gap-2">
					<Chip class="border-blue-slate/30 bg-pale-sky/20 text-xs text-blue-slate">
						{availabilityLabel(item.availabilityState)}
					</Chip>
					{#if !item.canDownload}
						<Chip class="border-burnt-peach/30 bg-pearl-beige text-xs text-burnt-peach">{t('objects.recent.restricted')}</Chip>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</section>
{/if}
