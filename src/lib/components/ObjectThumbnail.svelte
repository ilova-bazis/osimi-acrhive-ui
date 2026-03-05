<script lang="ts">
	import { resolve } from '$app/paths';

	let {
		objectId,
		thumbnailArtifactId,
		objectType,
		class: className = ''
	} = $props<{
		objectId: string;
		thumbnailArtifactId: string | null;
		objectType: string;
		class?: string;
	}>();

	let failedThumbnailKey = $state<string | null>(null);

	const thumbnailHref = $derived(
		thumbnailArtifactId
			? resolve('/objects/[objectId]/artifacts/[artifactId]/download', {
					objectId,
					artifactId: thumbnailArtifactId
				})
			: null
	);

	const thumbnailKey = $derived(`${objectId}:${thumbnailArtifactId ?? ''}`);
	const imageFailed = $derived(failedThumbnailKey === thumbnailKey);

	const placeholderLabel = $derived.by(() => {
		switch (objectType.toUpperCase()) {
			case 'IMAGE':
				return 'IMG';
			case 'AUDIO':
				return 'AUD';
			case 'VIDEO':
				return 'VID';
			case 'DOCUMENT':
				return 'DOC';
			default:
				return 'FILE';
		}
	});

</script>

<div
	class={`relative overflow-hidden rounded-lg border border-border-soft bg-alabaster-grey/55 ${className}`.trim()}
>
	{#if thumbnailHref && !imageFailed}
		<img
			src={thumbnailHref}
			alt=""
			loading="lazy"
			decoding="async"
			onerror={() => {
				failedThumbnailKey = thumbnailKey;
			}}
			class="h-full w-full object-cover"
		/>
	{:else}
		<div class="flex h-full w-full flex-col items-center justify-center bg-alabaster-grey/70 text-blue-slate">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				class="h-5 w-5"
				aria-hidden="true"
			>
				<path d="M7 3.75h6.75L19.5 9.5v10.75a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-15.5a1 1 0 0 1 1-1Z" />
				<path d="M13.5 3.75v5.75H19.5" />
				<path d="M9 14.25h6" />
				<path d="M9 17.25h6" />
			</svg>
			<span class="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-text-muted">
				{placeholderLabel}
			</span>
		</div>
	{/if}
</div>
