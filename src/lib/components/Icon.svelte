<script lang="ts">
	let { name, size = 16, stroke = 1.4 } = $props<{ name: string; size?: number; stroke?: number }>();

	const p = $derived({
		width: size,
		height: size,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		'stroke-width': stroke,
		'stroke-linecap': 'round' as const,
		'stroke-linejoin': 'round' as const,
	});
</script>

{#if name === 'home'}
	<svg {...p}><path d="M3 12 12 4l9 8"/><path d="M5 10.5V21h5v-6h4v6h5V10.5"/></svg>
{:else if name === 'archive'}
	<svg {...p}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></svg>
{:else if name === 'plus'}
	<svg {...p}><path d="M12 5v14M5 12h14"/></svg>
{:else if name === 'search'}
	<svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
{:else if name === 'arrow-r'}
	<svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
{:else if name === 'arrow-l'}
	<svg {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
{:else if name === 'check'}
	<svg {...p}><path d="m5 12 5 5L20 7"/></svg>
{:else if name === 'x'}
	<svg {...p}><path d="M6 6l12 12M18 6l-12 12"/></svg>
{:else if name === 'upload'}
	<svg {...p}><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>
{:else if name === 'file'}
	<svg {...p}><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/></svg>
{:else if name === 'image'}
	<svg {...p}><rect x="3" y="3" width="18" height="18" rx="1"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
{:else if name === 'audio'}
	<svg {...p}><path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>
{:else if name === 'video'}
	<svg {...p}><rect x="3" y="6" width="13" height="12" rx="1"/><path d="m16 10 5-3v10l-5-3z"/></svg>
{:else if name === 'book'}
	<svg {...p}><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/></svg>
{:else if name === 'manuscript'}
	<svg {...p}><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5z"/><path d="M8 9h6M8 13h8M8 17h5"/></svg>
{:else if name === 'eye'}
	<svg {...p}><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
{:else if name === 'pencil'}
	<svg {...p}><path d="M14 4l6 6L9 21H3v-6z"/></svg>
{:else if name === 'trash'}
	<svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/></svg>
{:else if name === 'cog'}
	<svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
{:else if name === 'chevron-r'}
	<svg {...p}><path d="m9 6 6 6-6 6"/></svg>
{:else if name === 'chevron-d'}
	<svg {...p}><path d="m6 9 6 6 6-6"/></svg>
{:else if name === 'info'}
	<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8h0M11 12h1v5h1"/></svg>
{:else if name === 'warn'}
	<svg {...p}><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h0"/></svg>
{:else if name === 'sparkle'}
	<svg {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M5.5 18.5l4-4M14.5 9.5l4-4"/></svg>
{:else if name === 'lock'}
	<svg {...p}><rect x="4" y="11" width="16" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
{:else if name === 'users'}
	<svg {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20a6 6 0 0 1 6-6"/></svg>
{:else if name === 'pages'}
	<svg {...p}><rect x="4" y="3" width="14" height="18" rx="1"/><path d="M8 8h6M8 12h6M8 16h4"/></svg>
{:else if name === 'clock'}
	<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
{:else if name === 'globe'}
	<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
{:else if name === 'folder'}
	<svg {...p}><path d="M3 6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></svg>
{:else if name === 'grip'}
	<svg {...p}><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>
{/if}
