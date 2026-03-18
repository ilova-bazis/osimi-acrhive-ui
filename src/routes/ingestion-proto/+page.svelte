<script lang="ts">
	// ─── Types ───────────────────────────────────────────────────────────────────

	type StagingFile = {
		id: number;
		name: string;
		ext: string;
		mediaKind: 'image' | 'document' | 'audio';
		sizeLabel: string;
		groupId: string | null;
	};

	type ProtoGroup = {
		id: string;
		label: string;
		fileIds: number[];
		kind: 'document' | 'photo' | 'audio';
		collapsed: boolean;
		dragOver: boolean;
	};

	// ─── Mock Data ───────────────────────────────────────────────────────────────

	const INITIAL_FILES: StagingFile[] = [
		// Scanned newspaper pages — should auto-group
		{ id: 1,  name: 'scan_001.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '2.1 MB', groupId: null },
		{ id: 2,  name: 'scan_002.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '2.3 MB', groupId: null },
		{ id: 3,  name: 'scan_003.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '2.0 MB', groupId: null },
		{ id: 4,  name: 'scan_004.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '2.2 MB', groupId: null },
		{ id: 5,  name: 'scan_005.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '1.9 MB', groupId: null },
		{ id: 6,  name: 'scan_006.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '2.4 MB', groupId: null },
		{ id: 7,  name: 'scan_007.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '2.1 MB', groupId: null },
		{ id: 8,  name: 'scan_008.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '2.3 MB', groupId: null },
		// Individual portrait photos — auto-groups but user may split
		{ id: 9,  name: 'photo_01.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '3.4 MB', groupId: null },
		{ id: 10, name: 'photo_02.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '3.1 MB', groupId: null },
		{ id: 11, name: 'photo_03.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '3.7 MB', groupId: null },
		{ id: 12, name: 'photo_04.jpg', ext: 'jpg', mediaKind: 'image',    sizeLabel: '2.9 MB', groupId: null },
		// Interview audio — should auto-group
		{ id: 13, name: 'interview_part_1.wav', ext: 'wav', mediaKind: 'audio', sizeLabel: '18.2 MB', groupId: null },
		{ id: 14, name: 'interview_part_2.wav', ext: 'wav', mediaKind: 'audio', sizeLabel: '21.0 MB', groupId: null },
		{ id: 15, name: 'interview_part_3.wav', ext: 'wav', mediaKind: 'audio', sizeLabel: '15.8 MB', groupId: null },
		// Lone files — no numeric suffix, stay unassigned after auto-group
		{ id: 16, name: 'cover.jpg',        ext: 'jpg', mediaKind: 'image',    sizeLabel: '890 KB',  groupId: null },
		{ id: 17, name: 'masthead.png',      ext: 'png', mediaKind: 'image',    sizeLabel: '240 KB',  groupId: null },
		{ id: 18, name: 'supplement.pdf',    ext: 'pdf', mediaKind: 'document', sizeLabel: '4.1 MB',  groupId: null },
		{ id: 19, name: 'editorial_en.pdf',  ext: 'pdf', mediaKind: 'document', sizeLabel: '1.2 MB',  groupId: null },
		{ id: 20, name: 'index_card.tif',    ext: 'tif', mediaKind: 'image',    sizeLabel: '6.5 MB',  groupId: null },
	];

	// ─── State ───────────────────────────────────────────────────────────────────

	let files       = $state<StagingFile[]>(structuredClone(INITIAL_FILES));
	let groups      = $state<ProtoGroup[]>([]);

	let selectedFileIds    = $state<number[]>([]);
	let dragSourceId       = $state<number | null>(null);
	let dragTargetGroupId  = $state<string | null>(null);
	let dragTargetFileId   = $state<number | null>(null);
	let dragOverLeftPanel  = $state(false);

	let editingGroupId     = $state<string | null>(null);
	let editingLabelValue  = $state('');
	let autoGroupToast     = $state(false);
	let validationDismissed = $state(false);

	// ─── Derived ─────────────────────────────────────────────────────────────────

	const unassignedFiles = $derived(files.filter(f => f.groupId === null));
	const objectCount     = $derived(groups.length + unassignedFiles.length);
	const singleGroupWarning = $derived(
		groups.length === 0 && unassignedFiles.length >= 10 && !validationDismissed
	);

	// ─── Helper: detect drag type ─────────────────────────────────────────────────

	const hasFileDragType = (e: DragEvent) =>
		e.dataTransfer?.types.includes('application/x-proto-file-id') ?? false;

	// ─── File Icon Snippet ────────────────────────────────────────────────────────

	const kindEmoji = (kind: StagingFile['mediaKind']): string => {
		if (kind === 'audio')    return '🎵';
		if (kind === 'document') return '📄';
		return '🖼';
	};

	const groupKindEmoji = (kind: ProtoGroup['kind']): string => {
		if (kind === 'audio') return '🎵';
		if (kind === 'photo') return '🖼';
		return '📄';
	};

	const kindLabel = (kind: StagingFile['mediaKind']): string => {
		if (kind === 'audio')    return 'AUD';
		if (kind === 'document') return 'DOC';
		return 'IMG';
	};

	const kindLabelClasses = (kind: StagingFile['mediaKind']): string => {
		if (kind === 'audio')    return 'bg-alabaster-grey text-blue-slate';
		if (kind === 'document') return 'bg-pearl-beige text-blue-slate';
		return 'bg-pale-sky/50 text-blue-slate';
	};

	const groupCountLabel = (group: ProtoGroup): string => {
		const n = group.fileIds.length;
		if (n === 0) return 'empty';
		if (group.kind === 'document' && n > 1) return `${n} pages`;
		return n === 1 ? '1 file' : `${n} files`;
	};

	// ─── State Mutations ──────────────────────────────────────────────────────────

	const addFileToGroup = (fileId: number, targetGroupId: string) => {
		// Remove from any current group (keep groups with ≥1 file)
		groups = groups
			.map(g => ({ ...g, fileIds: g.fileIds.filter(id => id !== fileId) }))
			.filter(g => g.fileIds.length >= 1);
		// Add to target
		groups = groups.map(g =>
			g.id === targetGroupId ? { ...g, fileIds: [...g.fileIds, fileId] } : g
		);
		// Update file's groupId
		files = files.map(f => f.id === fileId ? { ...f, groupId: targetGroupId } : f);
	};

	const removeFileFromGroup = (fileId: number) => {
		groups = groups
			.map(g => ({ ...g, fileIds: g.fileIds.filter(id => id !== fileId) }))
			.filter(g => g.fileIds.length >= 1);
		files = files.map(f => f.id === fileId ? { ...f, groupId: null } : f);
	};

	const reorderInGroup = (groupId: string, srcId: number, targetId: number) => {
		groups = groups.map(g => {
			if (g.id !== groupId) return g;
			const arr = [...g.fileIds];
			const si = arr.indexOf(srcId);
			const ti = arr.indexOf(targetId);
			if (si === -1 || ti === -1 || si === ti) return g;
			arr.splice(si, 1);
			arr.splice(ti, 0, srcId);
			return { ...g, fileIds: arr };
		});
	};

	const ungroupFiles = (groupId: string) => {
		files = files.map(f => f.groupId === groupId ? { ...f, groupId: null } : f);
		groups = groups.filter(g => g.id !== groupId);
	};

	const groupSelectedFiles = () => {
		if (selectedFileIds.length < 2) return;
		const ids = [...selectedFileIds];
		// Remove from existing groups
		groups = groups
			.map(g => ({ ...g, fileIds: g.fileIds.filter(id => !ids.includes(id)) }))
			.filter(g => g.fileIds.length >= 1);
		const firstFile = files.find(f => f.id === ids[0]);
		const rawLabel = firstFile?.name.replace(/\.[^.]+$/, '').replace(/[-_]?\d+$/, '').replace(/[-_]+$/, '') ?? 'Document';
		const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
		const kind: ProtoGroup['kind'] =
			firstFile?.mediaKind === 'audio' ? 'audio' :
			firstFile?.mediaKind === 'document' ? 'document' : 'photo';
		const newId = crypto.randomUUID();
		groups = [...groups, { id: newId, label, fileIds: ids, kind, collapsed: false, dragOver: false }];
		files = files.map(f => ids.includes(f.id) ? { ...f, groupId: newId } : f);
		selectedFileIds = [];
	};

	const splitSelectedFiles = () => {
		const ids = [...selectedFileIds];
		groups = groups
			.map(g => ({ ...g, fileIds: g.fileIds.filter(id => !ids.includes(id)) }))
			.filter(g => g.fileIds.length >= 1);
		files = files.map(f => ids.includes(f.id) ? { ...f, groupId: null } : f);
		selectedFileIds = [];
	};

	const createNewGroup = () => {
		const newId = crypto.randomUUID();
		groups = [...groups, { id: newId, label: 'New Document', fileIds: [], kind: 'document', collapsed: false, dragOver: false }];
	};

	const autoGroupByFilename = () => {
		const NUMERIC_SUFFIX_RE = /^(.*?)[\s_-]?(\d+)$/i;
		const prefixMap: Record<string, StagingFile[]> = {};

		for (const file of files) {
			const base = file.name.replace(/\.[^.]+$/, '');
			const match = base.match(NUMERIC_SUFFIX_RE);
			if (!match) continue;
			const prefix = match[1].toLowerCase().replace(/[\s_-]+$/, '');
			if (!prefix) continue;
			(prefixMap[prefix] ??= []).push(file);
		}

		const newGroups: ProtoGroup[] = [...groups];
		const updatedFiles = [...files];

		for (const [prefix, groupFiles] of Object.entries(prefixMap)) {
			if (groupFiles.length < 2) continue;
			// Skip files already in a group
			const ungrouped = groupFiles.filter(f => f.groupId === null);
			if (ungrouped.length < 2) continue;

			const sorted = [...ungrouped].sort((a, b) => a.name.localeCompare(b.name));
			const ids = sorted.map(f => f.id);
			const rawLabel = prefix.trim().replace(/[-_]$/, '');
			const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
			const kind: ProtoGroup['kind'] =
				sorted[0].mediaKind === 'audio' ? 'audio' :
				sorted[0].mediaKind === 'document' ? 'document' : 'photo';
			const newId = crypto.randomUUID();

			newGroups.push({ id: newId, label, fileIds: ids, kind, collapsed: false, dragOver: false });
			for (const f of sorted) {
				const idx = updatedFiles.findIndex(u => u.id === f.id);
				if (idx !== -1) updatedFiles[idx] = { ...updatedFiles[idx], groupId: newId };
			}
		}

		groups = newGroups;
		files = updatedFiles;
		autoGroupToast = true;
		setTimeout(() => { autoGroupToast = false; }, 5000);
		validationDismissed = false;
	};

	const toggleFileSelection = (fileId: number) => {
		if (selectedFileIds.includes(fileId)) {
			selectedFileIds = selectedFileIds.filter(id => id !== fileId);
		} else {
			selectedFileIds = [...selectedFileIds, fileId];
		}
	};

	const toggleGroupCollapse = (groupId: string) => {
		groups = groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g);
	};

	const commitGroupLabel = (groupId: string) => {
		if (editingLabelValue.trim()) {
			groups = groups.map(g => g.id === groupId ? { ...g, label: editingLabelValue.trim() } : g);
		}
		editingGroupId = null;
	};

	// ─── Drag Handlers ────────────────────────────────────────────────────────────

	const onFileDragStart = (e: DragEvent, fileId: number) => {
		e.dataTransfer!.setData('application/x-proto-file-id', String(fileId));
		e.dataTransfer!.effectAllowed = 'move';
		dragSourceId = fileId;
	};

	const onFileDragEnd = () => {
		dragSourceId = null;
		dragTargetGroupId = null;
		dragTargetFileId = null;
		dragOverLeftPanel = false;
		groups = groups.map(g => ({ ...g, dragOver: false }));
	};

	const onGroupDragOver = (e: DragEvent, groupId: string) => {
		if (!hasFileDragType(e)) return;
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		dragTargetGroupId = groupId;
		groups = groups.map(g => ({ ...g, dragOver: g.id === groupId }));
	};

	const onGroupDragLeave = (groupId: string) => {
		if (dragTargetGroupId === groupId) dragTargetGroupId = null;
		groups = groups.map(g => g.id === groupId ? { ...g, dragOver: false } : g);
	};

	const onGroupDrop = (e: DragEvent, groupId: string) => {
		e.preventDefault();
		const srcId = dragSourceId;
		groups = groups.map(g => ({ ...g, dragOver: false }));
		dragTargetGroupId = null;
		if (srcId === null) return;
		addFileToGroup(srcId, groupId);
		dragSourceId = null;
	};

	const onLeftPanelDragOver = (e: DragEvent) => {
		if (!hasFileDragType(e)) return;
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		dragOverLeftPanel = true;
	};

	const onLeftPanelDrop = (e: DragEvent) => {
		e.preventDefault();
		const srcId = dragSourceId;
		dragOverLeftPanel = false;
		if (srcId === null) return;
		removeFileFromGroup(srcId);
		dragSourceId = null;
	};

	const onGroupFileDragOver = (e: DragEvent, fileId: number) => {
		if (!hasFileDragType(e)) return;
		e.preventDefault();
		e.stopPropagation();
		dragTargetFileId = fileId;
	};

	const onGroupFileDrop = (e: DragEvent, targetFileId: number, groupId: string) => {
		e.preventDefault();
		e.stopPropagation();
		const srcId = dragSourceId;
		dragTargetFileId = null;
		if (srcId === null || srcId === targetFileId) return;
		// Check if source is in same group → reorder; else → move into group
		const srcGroup = groups.find(g => g.fileIds.includes(srcId));
		if (srcGroup?.id === groupId) {
			reorderInGroup(groupId, srcId, targetFileId);
		} else {
			addFileToGroup(srcId, groupId);
		}
		dragSourceId = null;
	};
</script>

<div class="min-h-screen bg-alabaster-grey pb-24">

	<!-- ① Prototype banner -->
	<div class="border-b border-burnt-peach/30 bg-pearl-beige/60 px-6 py-2 text-center">
		<p class="text-[10px] uppercase tracking-[0.2em] text-burnt-peach">
			Prototype · Visual only · No backend calls
		</p>
	</div>

	<!-- ② Page header -->
	<header class="border-b border-border-soft bg-surface-white px-6 py-4">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-6">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Osimi Digital Library</p>
				<h1 class="font-display text-2xl text-burnt-peach">Organize Your Files</h1>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={autoGroupByFilename}
					class="rounded-full border border-blue-slate/50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 active:scale-[0.99]"
				>
					Auto-group by filename
				</button>
				<button
					onclick={createNewGroup}
					class="rounded-full bg-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-surface-white transition hover:bg-blue-slate/80 active:scale-[0.99]"
				>
					+ New Document
				</button>
			</div>
		</div>
	</header>

	<!-- ③ Context banner -->
	<div class="border-b border-border-soft bg-pale-sky/15 px-6 py-3">
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
			<p class="text-sm text-blue-slate">
				Each group below will become <span class="font-semibold">ONE object</span> in your library.
			</p>
			<p class="shrink-0 text-xs text-text-muted">
				{objectCount} {objectCount === 1 ? 'object' : 'objects'} · {files.length} files total
			</p>
		</div>
	</div>

	<!-- ④ Auto-group toast -->
	{#if autoGroupToast}
		<div class="border-b border-blue-slate/20 bg-pale-sky/20 px-6 py-2 transition">
			<div class="mx-auto flex max-w-7xl items-center gap-3">
				<span class="text-xs text-blue-slate">
					✓ Files grouped automatically by filename. Please review and adjust.
				</span>
				<button
					onclick={() => { autoGroupToast = false; }}
					class="ml-auto text-xs text-blue-slate/50 hover:text-blue-slate"
				>✕</button>
			</div>
		</div>
	{/if}

	<!-- ⑤ Quick actions bar -->
	{#if selectedFileIds.length > 0}
		<div class="border-b border-border-soft bg-pearl-beige/40 px-6 py-3">
			<div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
				<p class="text-xs text-text-muted">{selectedFileIds.length} {selectedFileIds.length === 1 ? 'file' : 'files'} selected</p>
				<button
					disabled={selectedFileIds.length < 2}
					onclick={groupSelectedFiles}
					class="rounded-full border border-blue-slate px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:cursor-not-allowed disabled:opacity-40"
				>
					Merge into one document
				</button>
				<button
					onclick={splitSelectedFiles}
					class="rounded-full border border-blue-slate/50 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate/75 transition hover:border-blue-slate hover:text-blue-slate"
				>
					Split into separate items
				</button>
				<button
					onclick={() => { selectedFileIds = []; }}
					class="ml-auto text-xs text-text-muted hover:text-text-ink"
				>
					Clear selection
				</button>
			</div>
		</div>
	{/if}

	<!-- ⑥ Validation warning -->
	{#if singleGroupWarning}
		<div class="border-b border-burnt-peach/35 bg-pearl-beige/60 px-6 py-3">
			<div class="mx-auto flex max-w-7xl flex-wrap items-center gap-4">
				<p class="text-sm text-burnt-peach">
					⚠ You have {unassignedFiles.length} files that will each become their own separate object. Is this correct?
				</p>
				<div class="ml-auto flex shrink-0 gap-2">
					<button
						onclick={autoGroupByFilename}
						class="rounded-full border border-burnt-peach/60 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-burnt-peach transition hover:bg-burnt-peach/10"
					>
						Auto-group
					</button>
					<button
						onclick={() => { validationDismissed = true; }}
						class="rounded-full border border-burnt-peach/40 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-burnt-peach/70 transition hover:border-burnt-peach/60 hover:text-burnt-peach"
					>
						Yes, that's correct
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ⑦ Two-column work area -->
	<div class="mx-auto grid max-w-7xl grid-cols-[minmax(280px,2fr)_3fr] gap-6 px-6 py-6">

		<!-- LEFT: Unassigned files -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<aside
			class={[
				'rounded-2xl border-2 transition',
				dragOverLeftPanel
					? 'border-blue-slate bg-pale-sky/10'
					: unassignedFiles.length === 0
						? 'border-dashed border-border-soft bg-surface-white/60'
						: 'border-border-soft bg-surface-white'
			].join(' ')}
			ondragover={onLeftPanelDragOver}
			ondragleave={() => { dragOverLeftPanel = false; }}
			ondrop={onLeftPanelDrop}
		>
			<div class="border-b border-border-soft px-5 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Unassigned Files</p>
				<p class="mt-1 text-sm text-text-muted">
					{unassignedFiles.length === 0
						? 'All files assigned — ready to continue!'
						: `${unassignedFiles.length} ${unassignedFiles.length === 1 ? 'file' : 'files'} waiting to be organized`}
				</p>
			</div>

			<div class="divide-y divide-border-soft">
				{#if unassignedFiles.length === 0}
					<div class="px-5 py-10 text-center text-sm italic text-text-muted">
						All files have been assigned to groups.
					</div>
				{/if}

				{#each unassignedFiles as file (file.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class={[
							'flex cursor-grab items-center gap-3 px-5 py-3 transition',
							'hover:bg-pale-sky/15',
							dragSourceId === file.id ? 'opacity-40' : '',
							dragTargetFileId === file.id ? 'ring-1 ring-inset ring-blue-slate/40' : '',
							selectedFileIds.includes(file.id) ? 'bg-pale-sky/12' : ''
						].join(' ')}
						draggable="true"
						ondragstart={(e) => onFileDragStart(e, file.id)}
						ondragend={onFileDragEnd}
						onclick={() => toggleFileSelection(file.id)}
					>
						<!-- Drag handle -->
						<span class="select-none text-text-muted/60" title="Drag to assign to a group">⠿</span>

						<!-- Checkbox -->
						<input
							type="checkbox"
							checked={selectedFileIds.includes(file.id)}
							onclick={(e) => e.stopPropagation()}
							onchange={() => toggleFileSelection(file.id)}
							class="h-4 w-4 shrink-0 cursor-pointer rounded border-border-soft accent-blue-slate"
						/>

						<!-- Kind emoji -->
						<span class="shrink-0 text-lg leading-none">{kindEmoji(file.mediaKind)}</span>

						<!-- Name + size -->
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-text-ink">{file.name}</p>
							<p class="text-[10px] text-text-muted">{file.ext.toUpperCase()} · {file.sizeLabel}</p>
						</div>

						<!-- Kind label pill -->
						<span class={`shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${kindLabelClasses(file.mediaKind)}`}>
							{kindLabel(file.mediaKind)}
						</span>
					</div>
				{/each}
			</div>

			<!-- Drop hint when dragging -->
			{#if dragSourceId !== null && dragOverLeftPanel}
				<div class="px-5 py-3 text-center text-xs text-blue-slate">
					Drop here to unassign from group
				</div>
			{/if}
		</aside>

		<!-- RIGHT: Object groups -->
		<section class="space-y-4">
			{#each groups as group (group.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class={[
						'rounded-2xl border transition',
						group.dragOver
							? 'border-blue-slate/50 bg-pale-sky/20 shadow-[0_0_0_3px_rgba(79,109,122,0.15)]'
							: 'border-border-soft bg-surface-white'
					].join(' ')}
					ondragover={(e) => onGroupDragOver(e, group.id)}
					ondragleave={() => onGroupDragLeave(group.id)}
					ondrop={(e) => onGroupDrop(e, group.id)}
				>
					<!-- Group header -->
					<div class="flex items-center gap-3 border-b border-border-soft px-5 py-3">
						<!-- Collapse toggle -->
						<button
							onclick={() => toggleGroupCollapse(group.id)}
							class="shrink-0 text-xs text-blue-slate/60 hover:text-blue-slate"
							title={group.collapsed ? 'Expand' : 'Collapse'}
						>
							{group.collapsed ? '▶' : '▾'}
						</button>

						<!-- Kind emoji -->
						<span class="shrink-0 text-lg leading-none" title={group.kind}>{groupKindEmoji(group.kind)}</span>

						<!-- Inline-editable label -->
						{#if editingGroupId === group.id}
							<input
								class="min-w-0 flex-1 rounded-lg border border-blue-slate/40 bg-transparent px-2 py-0.5 text-sm font-medium text-text-ink focus:outline-none focus:ring-1 focus:ring-blue-slate"
								bind:value={editingLabelValue}
								onblur={() => commitGroupLabel(group.id)}
								onkeydown={(e) => {
									if (e.key === 'Enter') commitGroupLabel(group.id);
									if (e.key === 'Escape') editingGroupId = null;
								}}
							/>
						{:else}
							<button
								class="min-w-0 flex-1 truncate text-left text-sm font-medium text-text-ink hover:text-blue-slate"
								onclick={() => { editingGroupId = group.id; editingLabelValue = group.label; }}
								title="Click to rename"
							>
								{group.label}
							</button>
						{/if}

						<!-- Empty group warning -->
						{#if group.fileIds.length === 0}
							<span class="shrink-0 text-[10px] text-burnt-peach" title="Group has no files">●</span>
						{/if}

						<!-- Page/file count badge -->
						<span class="shrink-0 rounded-full border border-border-soft px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-text-muted">
							{groupCountLabel(group)}
						</span>

						<!-- Ungroup button -->
						<button
							onclick={() => ungroupFiles(group.id)}
							class="shrink-0 rounded-full border border-blue-slate/30 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-blue-slate transition hover:border-burnt-peach/60 hover:text-burnt-peach"
						>
							Ungroup
						</button>
					</div>

					<!-- File list inside group -->
					{#if !group.collapsed}
						<div class="divide-y divide-border-soft">
							{#if group.fileIds.length === 0}
								<div class="px-5 py-6 text-center text-xs italic text-text-muted">
									Drop files here to add them to this group
								</div>
							{/if}

							{#each group.fileIds as fileId, index (fileId)}
								{@const file = files.find(f => f.id === fileId)}
								{#if file}
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div
										class={[
											'flex items-center gap-3 px-5 py-2.5 transition hover:bg-pale-sky/10',
											dragSourceId === fileId ? 'opacity-40' : '',
											dragTargetFileId === fileId ? 'ring-1 ring-inset ring-blue-slate/35' : ''
										].join(' ')}
										draggable="true"
										ondragstart={(e) => onFileDragStart(e, fileId)}
										ondragend={onFileDragEnd}
										ondragover={(e) => onGroupFileDragOver(e, fileId)}
										ondrop={(e) => onGroupFileDrop(e, fileId, group.id)}
									>
										<!-- Page index -->
										<span class="w-5 shrink-0 text-center text-[10px] text-text-muted">{index + 1}</span>

										<!-- Drag handle -->
										<span class="shrink-0 cursor-grab select-none text-text-muted/60" title="Drag to reorder">⠿</span>

										<!-- Kind emoji -->
										<span class="shrink-0 text-base leading-none">{kindEmoji(file.mediaKind)}</span>

										<!-- Name + size -->
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm text-text-ink">{file.name}</p>
											<p class="text-[10px] text-text-muted">{file.ext.toUpperCase()} · {file.sizeLabel}</p>
										</div>

										<!-- Remove from group -->
										<button
											onclick={() => removeFileFromGroup(fileId)}
											class="shrink-0 text-[10px] uppercase tracking-[0.12em] text-blue-slate/50 transition hover:text-burnt-peach"
											title="Remove from group (sends back to unassigned)"
										>
											Remove
										</button>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<!-- Collapsed: show drop hint when dragging -->
						{#if dragSourceId !== null}
							<div class="px-5 py-3 text-center text-xs text-blue-slate/60 italic">
								Drop to add to this group
							</div>
						{/if}
					{/if}
				</div>
			{/each}

			<!-- Empty state (no groups yet) -->
			{#if groups.length === 0}
				<div class="rounded-2xl border-2 border-dashed border-border-soft px-8 py-16 text-center">
					<p class="font-display text-xl text-text-muted">No groups yet</p>
					<p class="mt-2 text-sm text-text-muted">
						Click <strong>Auto-group by filename</strong> above, drag files from the left panel,<br>or use <strong>+ New Document</strong> to create a group manually.
					</p>
				</div>
			{/if}
		</section>
	</div>
</div>

<!-- ⑧ Sticky footer -->
<footer class="fixed bottom-0 left-0 right-0 border-t border-border-soft bg-surface-white px-6 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
	<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-sm text-text-muted">
				{objectCount} {objectCount === 1 ? 'object' : 'objects'} ready for ingestion
				{#if unassignedFiles.length > 0}
					· <span class="text-burnt-peach">{unassignedFiles.length} {unassignedFiles.length === 1 ? 'file' : 'files'} still unassigned</span>
				{/if}
			</p>
			{#if groups.some(g => g.fileIds.length === 0)}
				<p class="mt-0.5 text-xs text-burnt-peach">Some groups are empty and will be removed on continue.</p>
			{/if}
		</div>
		<div class="flex items-center gap-3">
			<a
				href="/ingestion"
				class="rounded-full border border-blue-slate/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
			>
				Back
			</a>
			<button
				disabled={unassignedFiles.length > 0}
				onclick={() => { alert('Prototype: this is where you would proceed to the metadata entry step.\n\nGroups that would be created:\n' + groups.filter(g => g.fileIds.length > 0).map(g => `• ${g.label} (${g.fileIds.length} file${g.fileIds.length !== 1 ? 's' : ''})`).join('\n')); }}
				class="rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white transition hover:bg-blue-slate/80 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Continue →
			</button>
		</div>
	</div>
</footer>
