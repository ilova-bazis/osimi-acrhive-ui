<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { IngestionCapabilities, IngestionMediaKind } from '$lib/services/ingestionCapabilities';
	import type { IngestionDetailFile } from '$lib/services/ingestionDetail';
	import type { FileStatus } from '$lib/types';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { SvelteMap } from 'svelte/reactivity';
	import { untrack, onDestroy } from 'svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ObjectGroupRow from '$lib/components/ObjectGroupRow.svelte';
	import ObjectMetadataPanel from '$lib/components/ObjectMetadataPanel.svelte';
	import type { ObjectGroup, ObjectItemMetadata } from '$lib/models';
	import type { IngestionDetailItem } from '$lib/services/ingestionDetail';
	import Icon from '$lib/components/Icon.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import FootnoteBar from '$lib/components/FootnoteBar.svelte';

	let {
		data
	} = $props<{
		data: {
			batchId: string;
			capabilities: IngestionCapabilities;
			existingFiles: IngestionDetailFile[];
			items: IngestionDetailItem[];
			metadata: {
				classificationType: string;
				itemKind: 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other';
				languageCode: string;
				pipelinePreset: string;
				accessLevel: 'private' | 'family' | 'public';
				embargoUntil: string | null;
				rightsNote: string | null;
				sensitivityNote: string | null;
				summary: Record<string, unknown>;
			};
		};
	}>();

	const batchId = $derived(data.batchId);
	const capabilities = $derived(data.capabilities);
	const metadata = $derived(data.metadata);
	const existingFiles = $derived(data.existingFiles);
	const dictionary = $derived(translations[$locale]);

	const t = (key: string) => {
		const segments = key.split('.');
		let current: Record<string, unknown> = dictionary as Record<string, unknown>;
		for (const segment of segments) {
			if (typeof current[segment] === 'undefined') {
				return key;
			}
			current = current[segment] as Record<string, unknown>;
		}
		return current as unknown as string;
	};

	const format = (template: string, values: Record<string, string | number>) =>
		template.replace(/\{(\w+)\}/g, (match, key) =>
			Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
		);

	type LocalIngestionFile = {
		id: number;
		rawFile?: File;
		source: 'local' | 'server';
		name: string;
		type: string;
		mediaType: BatchMediaType;
		size: string;
		status: FileStatus;
		backendFileId?: string;
		uploadError?: string;
	};

	type BatchMediaType = IngestionMediaKind;

	let files = $state<LocalIngestionFile[]>([]);
	const filesById = $derived(new Map(files.map((file) => [file.id, file])));
	let nextFileId = 1;
	let dragDepth = $state(0);
	let isDragging = $state(false);
	let isGlobalDragging = $state(false);
	let fileInput: HTMLInputElement | null = null;
	let previewUrls = $state<Record<number, string>>({});

	const classificationTypes = [
		'document',
		'newspaper_article',
		'magazine_article',
		'book_chapter',
		'book',
		'letter',
		'speech',
		'interview',
		'report',
		'manuscript',
		'image',
		'other'
	] as const;

	const languages = ['en', 'ru', 'fa', 'tg', 'mixed'] as const;

	const pipelinePresets = [
		'auto',
		'none',
		'ocr_text',
		'audio_transcript',
		'video_transcript',
		'ocr_and_audio_transcript',
		'ocr_and_video_transcript'
	] as const;

	let selectedIds = $state<number[]>([]);
	let activeFileId = $state(0);
	let activeGroupId = $state<string | null>(null);

	// Object grouping state
	let objectGroups = $state<ObjectGroup[]>([]);
	let collapsedGroups = $state<string[]>([]);
	const groupedFileIds = $derived(new Set(objectGroups.flatMap((g) => g.fileIds)));
	const standaloneFiles = $derived(files.filter((f) => !groupedFileIds.has(f.id)));

	// Per-object metadata (keyed by group.id or `file:${localId}`)
	let objectMetadata = $state<Record<string, ObjectItemMetadata>>({});

	const activeObjectGroup = $derived(
		activeFileId ? objectGroups.find((g) => g.fileIds.includes(activeFileId)) : undefined
	);
	const activeFile = $derived(files.find((f) => f.id === activeFileId));
	const activeObjectKey = $derived<string | null>(
		activeGroupId !== null
			? activeGroupId
			: (activeFileId
				? (activeObjectGroup?.id ?? `file:${activeFileId}`)
				: null)
	);
	const activeObjectLabel = $derived<string>(
		activeGroupId !== null
			? (objectGroups.find((g) => g.id === activeGroupId)?.label ?? '')
			: (activeObjectGroup
				? (activeObjectGroup.label ?? activeFile?.name ?? '')
				: (activeFile?.name ?? ''))
	);
	const activeObjectMeta = $derived<ObjectItemMetadata>(
		activeObjectKey ? (objectMetadata[activeObjectKey] ?? {}) : {}
	);

	// Debounce timers for per-group metadata updates (keyed by group local id)
	const itemUpdateTimers: Record<string, ReturnType<typeof setTimeout>> = {};

	const setObjectMeta = (key: string | null, patch: Partial<ObjectItemMetadata>) => {
		if (!key) return;
		objectMetadata = {
			...objectMetadata,
			[key]: { ...objectMetadata[key], ...patch }
		};

		// If the key is a group id (not file:N) and the group has a serverId, debounce update_item
		if (!key.startsWith('file:')) {
			const group = objectGroups.find((g) => g.id === key);
			if (group?.serverId) {
				const serverId = group.serverId;
				if (itemUpdateTimers[key]) clearTimeout(itemUpdateTimers[key]);
				itemUpdateTimers[key] = setTimeout(() => {
					delete itemUpdateTimers[key];
					const meta = objectMetadata[key];
					void postSetupAction({ action: 'update_item', itemId: serverId, metadata: meta })
						.catch(showItemSaveError);
				}, 300);
			}
		}
	};

	// List drag-and-drop state (distinct from the file-upload DnD)
	let listDragSourceId = $state<number | null>(null);
	let listDragTargetFileId = $state<number | null>(null);
	let listDragTargetGroupId = $state<string | null>(null);
	const toInputDateTime = (value: string | null): string => {
		if (!value) return '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
		const pad = (unit: number) => String(unit).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	};

	const readSummaryTitle = (summary: Record<string, unknown>, fallback: string): string => {
		const title = summary.title;
		if (!title || typeof title !== 'object' || title === null) return fallback;
		const primary = (title as Record<string, unknown>).primary;
		return typeof primary === 'string' && primary.trim().length > 0 ? primary : fallback;
	};

	type SummaryTitleTranslation = {
		lang: string;
		text: string;
	};

	type SummaryDate = {
		value: string | null;
		approximate: boolean;
		confidence: 'low' | 'medium' | 'high';
		note: string | null;
	};

	type SummaryDatePrecision = 'none' | 'year' | 'month' | 'day';

	type SummaryDateEditor = {
		precision: SummaryDatePrecision;
		year: string;
		month: string;
		day: string;
		approximate: boolean;
		confidence: 'low' | 'medium' | 'high';
		note: string;
	};

	type SummaryDateKey = keyof SummaryDates;

	type SummaryDates = {
		published: SummaryDate;
		created: SummaryDate;
	};

	const defaultSummaryDate = (): SummaryDate => ({
		value: null,
		approximate: false,
		confidence: 'medium',
		note: null
	});

	const readSummaryDate = (rawDate: unknown): SummaryDate => {
		if (!rawDate || typeof rawDate !== 'object' || rawDate === null) {
			return defaultSummaryDate();
		}

		const date = rawDate as Record<string, unknown>;
		const confidence = date.confidence;
		return {
			value: typeof date.value === 'string' || date.value === null ? date.value : null,
			approximate: typeof date.approximate === 'boolean' ? date.approximate : false,
			confidence: confidence === 'low' || confidence === 'high' || confidence === 'medium' ? confidence : 'medium',
			note: typeof date.note === 'string' || date.note === null ? date.note : null
		};
	};

	const readSummaryDates = (summary: Record<string, unknown>): SummaryDates => {
		const dates = summary.dates;
		if (!dates || typeof dates !== 'object' || dates === null) {
			return {
				published: defaultSummaryDate(),
				created: defaultSummaryDate()
			};
		}

		const rawDates = dates as Record<string, unknown>;
		return {
			published: readSummaryDate(rawDates.published),
			created: readSummaryDate(rawDates.created)
		};
	};

	const inferDatePrecision = (value: string | null): SummaryDatePrecision => {
		if (!value) return 'none';
		if (/^\d{4}$/.test(value)) return 'year';
		if (/^\d{4}-\d{2}$/.test(value)) return 'month';
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'day';
		return 'none';
	};

	const toSummaryDateEditor = (date: SummaryDate): SummaryDateEditor => {
		const precision = inferDatePrecision(date.value);
		const [year = '', month = '', day = ''] = (date.value ?? '').split('-');

		return {
			precision,
			year,
			month: precision === 'month' || precision === 'day' ? `${year}-${month}` : '',
			day: precision === 'day' ? `${year}-${month}-${day}` : '',
			approximate: date.approximate,
			confidence: date.confidence,
			note: date.note ?? ''
		};
	};

	const toSummaryDateValue = (editor: SummaryDateEditor, label: string): string | null => {
		if (editor.precision === 'none') return null;
		if (editor.precision === 'year') {
			if (!/^\d{4}$/.test(editor.year)) {
				throw new Error(format(t('ingestionSetup.batchIntent.invalidYear'), { label }));
			}
			return editor.year;
		}
		if (editor.precision === 'month') {
			if (!/^\d{4}-\d{2}$/.test(editor.month)) {
				throw new Error(format(t('ingestionSetup.batchIntent.invalidMonth'), { label }));
			}
			return editor.month;
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(editor.day)) {
			throw new Error(format(t('ingestionSetup.batchIntent.invalidDay'), { label }));
		}

		return editor.day;
	};

	const readSummaryTitleMeta = (
		summary: Record<string, unknown>
	): { originalScript: string | null; translations: SummaryTitleTranslation[] } => {
		const title = summary.title;
		if (!title || typeof title !== 'object' || title === null) {
			return {
				originalScript: null,
				translations: []
			};
		}

		const rawTitle = title as Record<string, unknown>;
		const translationsRaw = rawTitle.translations;
		const translations = Array.isArray(translationsRaw)
			? translationsRaw
					.map((entry: unknown) => {
						if (!entry || typeof entry !== 'object' || entry === null) return null;
						const candidate = entry as Record<string, unknown>;
						const lang = typeof candidate.lang === 'string' ? candidate.lang.trim() : '';
						const text = typeof candidate.text === 'string' ? candidate.text.trim() : '';
						if (lang.length === 0 || text.length === 0) return null;
						return { lang, text };
					})
					.filter((entry): entry is SummaryTitleTranslation => entry !== null)
			: [];

		return {
			originalScript:
				typeof rawTitle.original_script === 'string' || rawTitle.original_script === null
					? rawTitle.original_script
					: null,
			translations
		};
	};

	const readSummaryClassification = (summary: Record<string, unknown>): { tags: string[]; text: string } => {
		const classification = summary.classification;
		if (!classification || typeof classification !== 'object' || classification === null) {
			return { tags: [], text: '' };
		}

		const tagsRaw = (classification as Record<string, unknown>).tags;
		const tags = Array.isArray(tagsRaw)
			? Array.from(
					new Set(
						tagsRaw
							.map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
							.filter((tag) => tag.length > 0)
					)
			  )
			: [];

		const summaryText = (classification as Record<string, unknown>).summary;
		return {
			tags,
			text: typeof summaryText === 'string' ? summaryText : ''
		};
	};

	const summaryTitleMeta = $derived(readSummaryTitleMeta(metadata.summary));
	let summaryDateEditors = $state<{
		published: SummaryDateEditor;
		created: SummaryDateEditor;
	}>({
		published: toSummaryDateEditor(defaultSummaryDate()),
		created: toSummaryDateEditor(defaultSummaryDate())
	});

	const summaryDateSections = [
		{ key: 'published', labelKey: 'ingestionSetup.batchIntent.publishedDate' },
		{ key: 'created', labelKey: 'ingestionSetup.batchIntent.createdDate' }
	] as const satisfies ReadonlyArray<{ key: SummaryDateKey; labelKey: string }>;

	const updateSummaryDatePrecision = (key: SummaryDateKey, precision: SummaryDatePrecision) => {
		summaryDateEditors[key].precision = precision;
		if (precision !== 'year') {
			summaryDateEditors[key].year = '';
		}
		if (precision !== 'month') {
			summaryDateEditors[key].month = '';
		}
		if (precision !== 'day') {
			summaryDateEditors[key].day = '';
		}
		queueBatchMetadataSave();
	};

	const updateSummaryDateValue = (key: SummaryDateKey, value: string) => {
		const precision = summaryDateEditors[key].precision;
		if (precision === 'year') {
			summaryDateEditors[key].year = value;
		} else if (precision === 'month') {
			summaryDateEditors[key].month = value;
		} else if (precision === 'day') {
			summaryDateEditors[key].day = value;
		}
		queueBatchMetadataSave();
	};

	const updateSummaryDateApproximate = (key: SummaryDateKey, checked: boolean) => {
		summaryDateEditors[key].approximate = checked;
		queueBatchMetadataSave();
	};

	const updateSummaryDateConfidence = (key: SummaryDateKey, confidence: 'low' | 'medium' | 'high') => {
		summaryDateEditors[key].confidence = confidence;
		queueBatchMetadataSave();
	};

	const updateSummaryDateNote = (key: SummaryDateKey, note: string) => {
		summaryDateEditors[key].note = note;
		queueBatchMetadataSave();
	};

	let batchDefaults = $state({
		title: '',
		language: 'en',
		classificationType: 'document',
		itemKind: 'document' as 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other',
		summaryText: '',
		pipelinePreset: 'auto',
		accessLevel: 'private' as 'private' | 'family' | 'public',
		embargoUntil: '',
		rightsNote: '',
		sensitivityNote: ''
	});
	let summaryTags = $state<string[]>([]);
	let summaryTagInput = $state('');

	let isSubmitting = $state(false);
	let submitError = $state('');
	let addFilesError = $state('');
	let removingIds = $state<number[]>([]);
	let hydratedFromServer = $state(false);
	let groupingWarningDismissed = $state(false);
	let autoGroupToast = $state(false);
	let autoGroupToastTimer: ReturnType<typeof setTimeout> | null = null;
	let itemSaveError = $state(false);
	let itemSaveErrorTimer: ReturnType<typeof setTimeout> | null = null;
	let metadataHydrated = $state(false);
	let mismatchDialog = $state<{
		open: boolean;
		expectedLabel: string;
		incomingLabel: string;
		incomingMediaType: BatchMediaType;
		rejectedSample: string;
		rejectedCount: number;
		files: File[];
	} | null>(null);

	const batchMediaType = $derived<BatchMediaType | null>(files[0]?.mediaType ?? null);
	const uploadControllers = new SvelteMap<number, AbortController>();
	const maxConcurrentUploads = 2;
	let uploadQueue = $state<number[]>([]);

	$effect(() => {
		if (metadataHydrated) return;
		metadataHydrated = true;

		const summaryClassification = readSummaryClassification(metadata.summary);
		const summaryDates = readSummaryDates(metadata.summary);

		summaryDateEditors = {
			published: toSummaryDateEditor(summaryDates.published),
			created: toSummaryDateEditor(summaryDates.created)
		};

		batchDefaults = {
			title: readSummaryTitle(metadata.summary, batchId),
			language: metadata.languageCode || 'en',
			classificationType: metadata.classificationType || 'document',
			itemKind: metadata.itemKind || 'document',
			summaryText: summaryClassification.text,
			pipelinePreset: metadata.pipelinePreset || 'auto',
			accessLevel: metadata.accessLevel,
			embargoUntil: toInputDateTime(metadata.embargoUntil),
			rightsNote: metadata.rightsNote ?? '',
			sensitivityNote: metadata.sensitivityNote ?? ''
		};

		summaryTags = summaryClassification.tags;
	});

	const pumpUploadQueue = () => {
		const availableSlots = maxConcurrentUploads - uploadControllers.size;
		if (availableSlots <= 0 || uploadQueue.length === 0) return;

		let nextQueue = [...uploadQueue];
		let started = 0;

		while (started < availableSlots && nextQueue.length > 0) {
			const nextFileId = nextQueue.shift();
			if (nextFileId === undefined) break;
			if (uploadControllers.has(nextFileId)) continue;

			const file = findFile(nextFileId);
			if (!file || file.source !== 'local' || file.status !== 'queued') continue;

			started += 1;
			void uploadAndCommitFile(nextFileId).finally(() => {
				pumpUploadQueue();
			});
		}

		uploadQueue = nextQueue;
	};

	const enqueueUploads = (fileIds: number[]) => {
		if (!fileIds.length) return;
		const queued = [...uploadQueue];
		for (const fileId of fileIds) {
			if (uploadControllers.has(fileId)) continue;
			const file = findFile(fileId);
			if (!file || file.source !== 'local' || file.status !== 'queued') continue;
			if (!queued.includes(fileId)) {
				queued.push(fileId);
			}
		}
		uploadQueue = queued;
		pumpUploadQueue();
	};

	const itemKindToMediaType = (
		itemKind: 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other'
	): BatchMediaType | null => {
		if (itemKind === 'photo') return 'image';
		if (itemKind === 'audio') return 'audio';
		if (itemKind === 'video') return 'video';
		if (itemKind === 'scanned_document') return 'image';
		if (itemKind === 'document') return 'document';
		return null;
	};

	const mediaTypeToItemKind = (mediaType: BatchMediaType): 'photo' | 'audio' | 'video' | 'document' => {
		if (mediaType === 'image') return 'photo';
		if (mediaType === 'audio') return 'audio';
		if (mediaType === 'video') return 'video';
		return 'document';
	};


	const toggleSelection = (id: number) => {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((selected) => selected !== id);
			if (activeFileId === id) {
				const fallbackId = selectedIds[selectedIds.length - 1] ?? 0;
				activeFileId = fallbackId;
				activeGroupId = null;
			}
		} else {
			selectedIds = [...selectedIds, id];
			activeFileId = id;
			activeGroupId = null;
		}
	};

	const setActiveGroup = (groupId: string) => {
		activeGroupId = groupId;
		activeFileId = 0;
		const group = objectGroups.find((entry) => entry.id === groupId);
		if (group) {
			selectedIds = [...group.fileIds];
		}
	};

	const setActiveFile = (id: number) => {
		activeFileId = id;
		activeGroupId = null;
		if (!selectedIds.includes(id) || selectedIds.length !== 1) {
			selectedIds = [id];
		}
	};

	// --- Grouping helpers ---

	const dissolveSmallGroups = (groups: ObjectGroup[]): ObjectGroup[] =>
		groups.filter((g) => g.fileIds.length >= 2);

	const groupSelectedFiles = () => {
		if (selectedIds.length < 2) return;
		const idsToGroup = [...selectedIds];
		// Remove selected files from any existing groups; dissolve groups left with < 2 files
		const updatedGroups = dissolveSmallGroups(
			objectGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => !idsToGroup.includes(fid)) }))
		);
		const firstFile = files.find((f) => f.id === idsToGroup[0]);
		const label = firstFile ? firstFile.name.replace(/\.[^.]+$/, '') : undefined;
		const localId = crypto.randomUUID();
		const newGroup: ObjectGroup = {
			id: localId,
			label,
			fileIds: idsToGroup
		};
		objectGroups = [...updatedGroups, newGroup];
		activeGroupId = localId;
		activeFileId = idsToGroup[0] ?? 0;
		selectedIds = idsToGroup;
	};

	const splitSelectedFiles = () => {
		if (selectedIds.length === 0) return;
		const splitIds = [...selectedIds];
		objectGroups = dissolveSmallGroups(
			objectGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => !splitIds.includes(fid)) }))
		);
		activeGroupId = null;
		activeFileId = splitIds[0] ?? 0;
		selectedIds = splitIds.length > 0 ? [splitIds[0]] : [];
	};

	// Groups files by numeric filename suffix (e.g. scan_001, scan_002 → one group).
	// Creates local-only groups (no server calls); startIngestion handles server sync.
	const autoGroupByFilename = (targetFiles: LocalIngestionFile[]) => {
		if (targetFiles.length < 2) return;
		const NUMERIC_SUFFIX_RE = /^(.*?)[\s_-]?(\d+)$/i;
		const prefixMap: Record<string, LocalIngestionFile[]> = {};

		for (const file of targetFiles) {
			const base = file.name.replace(/\.[^.]+$/, '');
			const match = base.match(NUMERIC_SUFFIX_RE);
			if (!match) continue;
			const prefix = match[1].toLowerCase().replace(/[\s_-]+$/, '');
			if (!prefix) continue;
			prefixMap[prefix] ??= [];
			prefixMap[prefix].push(file);
		}

		let grouped = false;
		let updatedGroups = [...objectGroups];

		for (const [prefix, groupFiles] of Object.entries(prefixMap)) {
			if (groupFiles.length < 2) continue;
			grouped = true;
			const sorted = [...groupFiles].sort((a, b) => a.name.localeCompare(b.name));
			const ids = sorted.map((f) => f.id);
			updatedGroups = dissolveSmallGroups(
				updatedGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => !ids.includes(fid)) }))
			);
			const label = prefix.trim() || undefined;
			const localId = crypto.randomUUID();
			updatedGroups = [...updatedGroups, { id: localId, label, fileIds: ids }];
		}

		if (grouped) {
			objectGroups = updatedGroups;
			autoGroupToast = true;
			if (autoGroupToastTimer) clearTimeout(autoGroupToastTimer);
			autoGroupToastTimer = setTimeout(() => { autoGroupToast = false; }, 5000);
		}
	};

	const showItemSaveError = () => {
		itemSaveError = true;
		if (itemSaveErrorTimer) clearTimeout(itemSaveErrorTimer);
		itemSaveErrorTimer = setTimeout(() => { itemSaveError = false; }, 6000);
	};

	const ungroupFiles = (groupId: string) => {
		const group = objectGroups.find((g) => g.id === groupId);
		if (group?.serverId) return; // cannot ungroup synced items
		const ungroupedFileIds = group?.fileIds ?? [];
		objectGroups = objectGroups.filter((g) => g.id !== groupId);
		collapsedGroups = collapsedGroups.filter((id) => id !== groupId);
		activeGroupId = null;
		if (ungroupedFileIds.length > 0) {
			activeFileId = ungroupedFileIds[0];
			selectedIds = [...ungroupedFileIds];
		}
	};

	const toggleGroupCollapse = (groupId: string) => {
		if (collapsedGroups.includes(groupId)) {
			collapsedGroups = collapsedGroups.filter((id) => id !== groupId);
		} else {
			collapsedGroups = [...collapsedGroups, groupId];
		}
	};

	const renameGroup = (groupId: string, label: string) => {
		objectGroups = objectGroups.map((g) => (g.id === groupId ? { ...g, label: label || undefined } : g));
		const group = objectGroups.find((g) => g.id === groupId);
		if (group?.serverId) {
			void postSetupAction({ action: 'update_item', itemId: group.serverId, label: label || '' })
				.catch(showItemSaveError);
		}
	};


	const addFileToGroup = (fileId: number, targetGroupId: string) => {
		// Remove from any existing group first
		const cleaned = dissolveSmallGroups(
			objectGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => fid !== fileId) }))
		);
		objectGroups = cleaned.map((g) =>
			g.id === targetGroupId ? { ...g, fileIds: [...g.fileIds, fileId] } : g
		);

		const targetGroup = objectGroups.find((g) => g.id === targetGroupId);
		const backendFileId = files.find((f) => f.id === fileId)?.backendFileId;
		if (targetGroup?.serverId && backendFileId) {
			const sortOrder = targetGroup.fileIds.length; // position after push
			void postSetupAction({
				action: 'attach_file',
				itemId: targetGroup.serverId,
				fileId: backendFileId,
				sortOrder
			}).catch(showItemSaveError);
		}
	};

	const mergeFilesIntoGroup = (sourceFileId: number, targetFileId: number) => {
		// Find if target is already in a group
		const targetGroup = objectGroups.find((g) => g.fileIds.includes(targetFileId));
		if (targetGroup) {
			addFileToGroup(sourceFileId, targetGroup.id);
		} else {
			// Create new group with both files
			const cleaned = dissolveSmallGroups(
				objectGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => fid !== sourceFileId) }))
			);
			const sourceFile = files.find((f) => f.id === sourceFileId);
			const targetFile = files.find((f) => f.id === targetFileId);
			const label = targetFile?.name.replace(/\.[^.]+$/, '') ?? sourceFile?.name.replace(/\.[^.]+$/, '');
			// Preserve target's position by finding target's index in files array
			const sourceIndex = files.findIndex((f) => f.id === sourceFileId);
			const targetIndex = files.findIndex((f) => f.id === targetFileId);
			const orderedIds = sourceIndex < targetIndex ? [sourceFileId, targetFileId] : [targetFileId, sourceFileId];
			const newGroup: ObjectGroup = { id: crypto.randomUUID(), label, fileIds: orderedIds };
			objectGroups = [...cleaned, newGroup];
		}
	};

	const reorderWithinGroup = (groupId: string, sourceFileId: number, targetFileId: number) => {
		objectGroups = objectGroups.map((g) => {
			if (g.id !== groupId) return g;
			const sourceIdx = g.fileIds.indexOf(sourceFileId);
			const targetIdx = g.fileIds.indexOf(targetFileId);
			if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return g;
			const newFileIds = [...g.fileIds];
			newFileIds.splice(sourceIdx, 1);
			newFileIds.splice(targetIdx, 0, sourceFileId);
			return { ...g, fileIds: newFileIds };
		});

		const group = objectGroups.find((g) => g.id === groupId);
		if (group?.serverId) {
			const fileEntries = group.fileIds
				.map((localId, i) => {
					const backendFileId = files.find((f) => f.id === localId)?.backendFileId;
					return backendFileId ? { fileId: backendFileId, sortOrder: i + 1 } : null;
				})
				.filter((e): e is { fileId: string; sortOrder: number } => e !== null);
			if (fileEntries.length > 0) {
				void postSetupAction({
					action: 'reorder_item_files',
					itemId: group.serverId,
					files: fileEntries
				}).catch(showItemSaveError);
			}
		}
	};

	// --- List DnD handlers ---

	const onFileRowDragStart = (event: DragEvent, fileId: number) => {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData('application/x-list-file-id', String(fileId));
		event.dataTransfer.effectAllowed = 'move';
		listDragSourceId = fileId;
		const file = filesById.get(fileId);
		if (file) {
			const label = file.name.length > 32 ? file.name.slice(0, 32) + '…' : file.name;
			const ghost = document.createElement('div');
			ghost.style.cssText =
				'position:fixed;top:-200px;left:0;background:#fff;border:1px solid rgba(79,109,122,0.3);border-radius:8px;padding:5px 12px;font-size:11px;color:#1a2633;box-shadow:0 2px 8px rgba(0,0,0,0.12);white-space:nowrap;';
			ghost.textContent = label;
			document.body.appendChild(ghost);
			event.dataTransfer.setDragImage(ghost, 16, 16);
			setTimeout(() => ghost.remove(), 0);
		}
	};

	const hasListDragType = (event: DragEvent): boolean => {
		const transfer = event.dataTransfer;
		if (!transfer) return false;
		const types = transfer.types as unknown;
		if (!types) return false;
		if (typeof (types as { includes?: (value: string) => boolean }).includes === 'function') {
			return (types as { includes: (value: string) => boolean }).includes('application/x-list-file-id');
		}
		if (typeof (types as { contains?: (value: string) => boolean }).contains === 'function') {
			return (types as { contains: (value: string) => boolean }).contains('application/x-list-file-id');
		}
		return Array.from(types as Iterable<string>).includes('application/x-list-file-id');
	};

	const onFileRowDragEnd = () => {
		listDragSourceId = null;
		listDragTargetFileId = null;
		listDragTargetGroupId = null;
	};

	const onFileRowDragOver = (event: DragEvent, fileId: number) => {
		if (!hasListDragType(event)) return;
		const transfer = event.dataTransfer;
		if (!transfer) return;
		event.preventDefault();
		event.stopPropagation();
		transfer.dropEffect = 'move';
		if (listDragTargetFileId !== fileId) {
			listDragTargetFileId = fileId;
		}
		if (listDragTargetGroupId !== null) {
			listDragTargetGroupId = null;
		}
	};

	const onFileRowDragLeave = (event: DragEvent) => {
		// Only clear if leaving to outside the row
		const related = event.relatedTarget as Node | null;
		if (!related || !(event.currentTarget as HTMLElement).contains(related)) {
			listDragTargetFileId = null;
		}
	};

	const onFileRowDrop = (event: DragEvent, targetFileId: number) => {
		event.preventDefault();
		event.stopPropagation();
		const sourceId = listDragSourceId;
		listDragTargetFileId = null;
		listDragTargetGroupId = null;
		listDragSourceId = null;
		if (sourceId === null || sourceId === targetFileId) return;
		// Check if both are in the same group → reorder
		const sourceGroup = objectGroups.find((g) => g.fileIds.includes(sourceId));
		const targetGroup = objectGroups.find((g) => g.fileIds.includes(targetFileId));
		if (sourceGroup && targetGroup && sourceGroup.id === targetGroup.id) {
			reorderWithinGroup(sourceGroup.id, sourceId, targetFileId);
		} else {
			mergeFilesIntoGroup(sourceId, targetFileId);
		}
	};


	const onGroupRowDragOver = (event: DragEvent, groupId: string) => {
		if (!hasListDragType(event)) return;
		const transfer = event.dataTransfer;
		if (!transfer) return;
		event.preventDefault();
		event.stopPropagation();
		transfer.dropEffect = 'move';
		if (listDragTargetGroupId !== groupId) {
			listDragTargetGroupId = groupId;
		}
		if (listDragTargetFileId !== null) {
			listDragTargetFileId = null;
		}
	};

	const onGroupRowDragLeave = (event: DragEvent) => {
		const related = event.relatedTarget as Node | null;
		if (!related || !(event.currentTarget as HTMLElement).contains(related)) {
			listDragTargetGroupId = null;
		}
	};

	const onGroupRowDrop = (event: DragEvent, groupId: string) => {
		event.preventDefault();
		event.stopPropagation();
		const sourceId = listDragSourceId;
		listDragTargetGroupId = null;
		listDragTargetFileId = null;
		listDragSourceId = null;
		if (sourceId === null) return;
		addFileToGroup(sourceId, groupId);
	};


	// --- end grouping helpers ---

	const toReadableSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		const mb = kb / 1024;
		return `${mb.toFixed(1)} MB`;
	};

	const mediaKinds = $derived(capabilities.mediaKinds);
	const extensionsByKind = $derived(capabilities.extensionsByKind);
	const mimeByKind = $derived(capabilities.mimeByKind);
	const mimeAliases = $derived(capabilities.mimeAliases);

	type ParsedFileType = {
		supported: true;
		type: string;
		mediaType: BatchMediaType;
	};

	type ParsedFileTypeError = {
		supported: false;
		reason: 'unsupported';
	};

	const getFileExtension = (fileName: string): string => {
		const parts = fileName.toLowerCase().split('.');
		if (parts.length < 2) return '';
		return parts.at(-1) ?? '';
	};

	const normalizeMime = (value: string): string => value.trim().toLowerCase();

	const isIn = (value: string, values: readonly string[]): boolean => values.includes(value);

	const kindFromExtension = (extension: string): BatchMediaType | null => {
		for (const mediaKind of mediaKinds) {
			if (isIn(extension, extensionsByKind[mediaKind])) {
				return mediaKind;
			}
		}

		return null;
	};

	const kindFromMime = (rawMime: string): BatchMediaType | null => {
		const normalized = normalizeMime(rawMime);
		if (!normalized) return null;

		const canonical = mimeAliases[normalized] ?? normalized;

		for (const mediaKind of mediaKinds) {
			if (isIn(canonical, mimeByKind[mediaKind])) {
				return mediaKind;
			}
		}

		if (canonical.startsWith('image/') && mediaKinds.includes('image')) return 'image';
		if (canonical.startsWith('audio/') && mediaKinds.includes('audio')) return 'audio';
		if (canonical.startsWith('video/') && mediaKinds.includes('video')) return 'video';
		if (canonical === 'application/pdf' && mediaKinds.includes('document')) return 'document';

		return null;
	};

	const parseFileType = (file: File): ParsedFileType | ParsedFileTypeError => {
		const extension = getFileExtension(file.name);
		const extensionKind = kindFromExtension(extension);
		const mimeKind = kindFromMime(file.type);

		if (mimeKind === 'image' && extensionKind !== 'image') {
			return {
				supported: false,
				reason: 'unsupported'
			};
		}

		if (!extensionKind) {
			return {
				supported: false,
				reason: 'unsupported'
			};
		}

		if (mimeKind && mimeKind !== extensionKind) {
			return {
				supported: false,
				reason: 'unsupported'
			};
		}

		if (extensionKind === 'image') {
			return {
				supported: true,
				type: extension === 'jpg' || extension === 'jpeg' || extension === 'png' ? 'photo' : 'image',
				mediaType: 'image'
			};
		}

		if (extensionKind === 'document') {
			return {
				supported: true,
				type: extension === 'pdf' ? 'pdf' : 'document',
				mediaType: 'document'
			};
		}

		if (extensionKind === 'audio') {
			return {
				supported: true,
				type: 'audio',
				mediaType: 'audio'
			};
		}

		if (extensionKind === 'video') {
			return {
				supported: true,
				type: 'video',
				mediaType: 'video'
			};
		}

		return {
			supported: false,
			reason: 'unsupported'
		};
	};

	const formatsFor = (mediaType: BatchMediaType | null): string => {
		const toFormatted = (extensions: string[]): string[] => extensions.map((ext) => `.${ext}`);

		if (mediaType) {
			return toFormatted(extensionsByKind[mediaType]).join(', ');
		}

		return mediaKinds
			.flatMap((kind: BatchMediaType) => toFormatted(extensionsByKind[kind]))
			.filter((value: string, index: number, values: string[]) => values.indexOf(value) === index)
			.join(', ');
	};

	const mediaTypeLabel = (mediaType: BatchMediaType): string => {
		if (mediaType === 'audio') return t('ingestionSetup.fileTypes.audio');
		if (mediaType === 'video') return t('ingestionSetup.fileTypes.video');
		if (mediaType === 'image') return t('ingestionSetup.fileTypes.image');
		return t('ingestionSetup.fileTypes.document');
	};

	const itemKindLabel = (
		itemKind: 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other'
	): string => t(`ingestionSetup.itemKinds.${itemKind}`);

	const classificationFromItemKind = (
		itemKind: 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other'
	): string => {
		if (itemKind === 'photo') return 'image';
		if (itemKind === 'audio' || itemKind === 'video' || itemKind === 'other') return 'other';
		return 'document';
	};

	const setItemKind = (
		itemKind: 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other'
	) => {
		batchDefaults.itemKind = itemKind;
		const defaultClassification = classificationFromItemKind(itemKind);
		if (batchDefaults.classificationType !== defaultClassification) {
			batchDefaults.classificationType = defaultClassification;
		}
		queueBatchMetadataSave();
	};

	const toExistingFileStatus = (backendStatus: string): FileStatus => {
		const normalized = backendStatus.toLowerCase();

		if (normalized.includes('failed') || normalized.includes('error')) {
			return 'failed';
		}

		if (normalized.includes('uploading') || normalized.includes('presigned') || normalized.includes('pending')) {
			return 'processing';
		}

		if (normalized.includes('uploaded') || normalized.includes('validated') || normalized.includes('committed')) {
			return 'approved';
		}

		if (normalized.includes('queue') || normalized.includes('pending') || normalized.includes('processing')) {
			return 'processing';
		}

		return 'queued';
	};

	const toExistingFileType = (file: IngestionDetailFile): { type: string; mediaType: BatchMediaType } => {
		const extension = getFileExtension(file.name);
		const extensionKind = kindFromExtension(extension);
		const mimeKind = kindFromMime(file.contentType ?? '');
		const mediaType = extensionKind ?? mimeKind ?? 'document';

		if (mediaType === 'image') {
			return {
				type: extension === 'jpg' || extension === 'jpeg' || extension === 'png' ? 'photo' : 'image',
				mediaType
			};
		}

		if (mediaType === 'document') {
			return {
				type: extension === 'pdf' ? 'pdf' : 'document',
				mediaType
			};
		}

		return {
			type: mediaType,
			mediaType
		};
	};

	$effect(() => {
		if (hydratedFromServer) return;
		hydratedFromServer = true;

		if (!existingFiles.length) return;

		const mappedFiles: LocalIngestionFile[] = existingFiles.map((file: IngestionDetailFile, index: number) => {
			const inferred = toExistingFileType(file);
			return {
				id: index + 1,
				source: 'server',
				name: file.name,
				type: inferred.type,
				mediaType: inferred.mediaType,
				size: toReadableSize(file.sizeBytes ?? 0),
				status: toExistingFileStatus(file.status),
				backendFileId: file.id
			};
		});

		files = mappedFiles;
		nextFileId = mappedFiles.length + 1;
		activeFileId = mappedFiles[0]?.id ?? 0;
		selectedIds = mappedFiles[0] ? [mappedFiles[0].id] : [];

		// Hydrate object groups from server items
		if (data.items && data.items.length > 0) {
			const backendToLocal = new Map(existingFiles.map((f: IngestionDetailFile, i: number) => [f.id, i + 1]));
			const hydratedGroups: ObjectGroup[] = [];

			// Sort items by item_index
			const sortedItems = [...data.items].sort((a, b) => a.itemIndex - b.itemIndex);

			for (const item of sortedItems) {
				// Sort item files by sort_order to get ordered local file IDs
				const sortedItemFiles = [...item.files].sort((a, b) => a.sortOrder - b.sortOrder);
				const localFileIds = sortedItemFiles
					.map((f) => backendToLocal.get(f.ingestionFileId))
					.filter((id): id is number => id !== undefined);

				if (localFileIds.length === 0) continue;

				if (localFileIds.length >= 2) {
					hydratedGroups.push({
						id: crypto.randomUUID(),
						...(item.label ? { label: item.label } : {}),
						fileIds: localFileIds,
						serverId: item.id
					});
				}
				// Single-file items are standalone files — no group needed
			}

			objectGroups = hydratedGroups;
		}
	});

	const addFiles = (incoming: FileList | File[]) => {
		const list = Array.from(incoming);
		if (!list.length) return;

		submitError = '';
		addFilesError = '';

		const expectedByItemKind = itemKindToMediaType(batchDefaults.itemKind);
		let lockedType: BatchMediaType | null = files[0]?.mediaType ?? expectedByItemKind ?? null;
		const accepted: LocalIngestionFile[] = [];
		const mixedMediaNames: string[] = [];
		const unsupportedNames: string[] = [];
		let mismatchIncomingType: BatchMediaType | null = null;
		let mismatchFiles: File[] = [];

		for (const file of list) {
			const parsed = parseFileType(file);
			if (!parsed.supported) {
				unsupportedNames.push(file.name);
				continue;
			}

			const { type, mediaType } = parsed;

			if (!lockedType) {
				lockedType = mediaType;
			}

			if (mediaType !== lockedType) {
				mixedMediaNames.push(file.name);
				mismatchIncomingType ??= mediaType;
				mismatchFiles = [...mismatchFiles, file];
				continue;
			}

			accepted.push({
				id: nextFileId++,
				source: 'local',
				rawFile: file,
				name: file.name,
				type,
				mediaType,
				size: toReadableSize(file.size),
				status: 'queued' as FileStatus
			});
		}

		if (accepted.length > 0) {
			files = [...files, ...accepted];
			for (const file of accepted) {
				if (file.mediaType === 'image' && file.rawFile) {
					const url = URL.createObjectURL(file.rawFile);
					previewUrls = { ...previewUrls, [file.id]: url };
				}
			}
		}

		if (!activeFileId && accepted.length) {
			setActiveFile(accepted[0].id);
			selectedIds = [accepted[0].id];
		}

		if (
			mixedMediaNames.length > 0 &&
			expectedByItemKind &&
			mismatchIncomingType &&
			files.length === 0 &&
			accepted.length === 0
		) {
			const sample = mixedMediaNames.slice(0, 3).join(', ');
			mismatchDialog = {
				open: true,
				expectedLabel: itemKindLabel(batchDefaults.itemKind),
				incomingLabel: mediaTypeLabel(mismatchIncomingType),
				incomingMediaType: mismatchIncomingType,
				rejectedSample: sample,
				rejectedCount: mixedMediaNames.length,
				files: mismatchFiles
			};
			addFilesError = '';
			return;
		}

		enqueueUploads(accepted.map((file) => file.id));

		const errorMessages: string[] = [];

		if (mixedMediaNames.length > 0) {
			const expectedType = lockedType
				? mediaTypeLabel(lockedType)
				: t('ingestionSetup.files.expectedTypeFallback');
			const sample = mixedMediaNames.slice(0, 3).join(', ');
			const remainder = mixedMediaNames.length > 3 ? ` +${mixedMediaNames.length - 3} more` : '';
			errorMessages.push(format(t('ingestionSetup.files.typeMismatch'), {
				expectedType,
				rejected: `${sample}${remainder}`
			}));
		}

		if (unsupportedNames.length > 0) {
			const sample = unsupportedNames.slice(0, 3).join(', ');
			const remainder = unsupportedNames.length > 3 ? ` +${unsupportedNames.length - 3} more` : '';
			errorMessages.push(format(t('ingestionSetup.files.unsupportedFormats'), {
				rejected: `${sample}${remainder}`,
				supportedFormats: formatsFor(lockedType)
			}));
		}

		addFilesError = errorMessages.join(' ');
		if (errorMessages.length === 0) {
			addFilesError = '';
		}
	};

	const handleFileInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		if (target.files) {
			addFiles(target.files);
			target.value = '';
		}
	};

	const handleDrop = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		dragDepth = 0;
		isDragging = false;
		isGlobalDragging = false;
		if (event.dataTransfer?.files) {
			addFiles(event.dataTransfer.files);
		}
	};

	const closeMismatchDialog = () => {
		mismatchDialog = null;
	};

	const confirmMismatchAndSwitchKind = () => {
		if (!mismatchDialog) return;
		setItemKind(mediaTypeToItemKind(mismatchDialog.incomingMediaType));
		const pendingFiles = mismatchDialog.files;
		mismatchDialog = null;
		addFiles(pendingFiles);
	};

	const handleDragEnter = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		dragDepth += 1;
		isDragging = true;
		isGlobalDragging = true;
	};

	const handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
		isDragging = true;
		isGlobalDragging = true;
	};

	const handleDragLeave = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) {
			isDragging = false;
			isGlobalDragging = false;
		}
	};

	const handleGlobalDragEnter = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		isGlobalDragging = true;
	};

	const handleGlobalDragLeave = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (dragDepth === 0) {
			isGlobalDragging = false;
		}
	};

	const handleGlobalDrop = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		isGlobalDragging = false;
	};

	const removeLocalFile = (id: number): { file: LocalIngestionFile; index: number } | null => {
		const index = files.findIndex((file) => file.id === id);
		if (index === -1) return null;

		const removed = files[index];
		const nextFiles = files.filter((file) => file.id !== id);
		files = nextFiles;
		uploadQueue = uploadQueue.filter((queuedId) => queuedId !== id);
		selectedIds = selectedIds.filter((selected) => selected !== id);
		// Remove file from any group; dissolve groups that drop below 2 files
		objectGroups = dissolveSmallGroups(
			objectGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => fid !== id) }))
		);

		if (activeFileId === id) {
			activeFileId = nextFiles[0]?.id ?? 0;
			if (activeFileId) {
				selectedIds = [activeFileId];
			}
		}

		if (!nextFiles.length) {
			selectedIds = [];
			addFilesError = '';
		}

		return { file: removed, index };
	};

	const restoreLocalFile = (snapshot: { file: LocalIngestionFile; index: number }) => {
		if (files.some((file) => file.id === snapshot.file.id)) {
			return;
		}

		const next = [...files];
		const index = Math.min(Math.max(snapshot.index, 0), next.length);
		next.splice(index, 0, snapshot.file);
		files = next;
	};

	const getEffectiveValue = (
		_fileId: number,
		key: 'language' | 'classificationType'
	): string | undefined => {
		const batchValue = batchDefaults[key];
		if (batchValue && batchValue.trim().length > 0) {
			return batchValue;
		}
		return undefined;
	};

	const isReady = $derived(
		files.length > 0 &&
		files.every(
			(file) =>
				Boolean(getEffectiveValue(file.id, 'language')) &&
				Boolean(getEffectiveValue(file.id, 'classificationType'))
		)
	);


	const statusKey = (status: FileStatus) => (status === 'needs-review' ? 'needsReview' : status);
	const statusLabel = (status: FileStatus) => t(`statuses.${statusKey(status)}`);

	const languageLabel = (value: string) =>
		value ? t(`ingestionSetup.languages.${value}`) : t('values.unknown');
	const pipelineLabel = (value: string) => t(`ingestionSetup.pipelinePresets.${value}`);

	let showConfirm = $state(false);

	const getMissingFields = (fileId: number) => {
		const missing: string[] = [];
		if (!getEffectiveValue(fileId, 'language')) {
			missing.push(t('ingestionSetup.overrides.language'));
		}
		if (!getEffectiveValue(fileId, 'classificationType')) {
			missing.push(t('ingestionSetup.overrides.classificationType'));
		}
		return missing;
	};

	const missingSummaries = $derived(
		files
			.map((file) => ({ file, missing: getMissingFields(file.id) }))
			.filter((entry) => entry.missing.length > 0)
	);

	const missingCount = $derived(missingSummaries.length);
	const objectCount = $derived(objectGroups.length + standaloneFiles.length);

	const isItemMetadataComplete = (key: string): boolean => {
		const meta = objectMetadata[key] ?? {};
		return (
			(meta.title ?? '').trim().length > 0 &&
			(meta.date?.value ?? null) !== null &&
			(meta.tags ?? []).length > 0
		);
	};

	const getItemCompletenessState = (key: string): 'complete' | 'partial' | 'untouched' => {
		const meta = objectMetadata[key];
		if (!meta) return 'untouched';
		const hasAny =
			(meta.title ?? '').trim().length > 0 ||
			(meta.date?.value ?? null) !== null ||
			(meta.tags ?? []).length > 0;
		if (!hasAny) return 'untouched';
		return isItemMetadataComplete(key) ? 'complete' : 'partial';
	};

	const getItemMissingFields = (key: string): string[] => {
		const meta = objectMetadata[key] ?? {};
		const missing: string[] = [];
		if (!(meta.title ?? '').trim()) missing.push('title');
		if (meta.date?.value == null) missing.push('date');
		if (!(meta.tags ?? []).length) missing.push('tags');
		return missing;
	};

	const allObjectKeys = $derived<string[]>([
		...objectGroups.map((g) => g.id),
		...standaloneFiles.map((f) => `file:${f.id}`)
	]);

	// Propagate batch defaults into any per-item field that has not been explicitly touched.
	// "Untouched" = still undefined. Once a user types anything the field is defined and won't be overwritten.
	$effect(() => {
		const keys = allObjectKeys;
		const defaultTitle = batchDefaults.title.trim();
		const defaultTags = summaryTags;
		const createdEditor = summaryDateEditors.created;
		const defaultDescription = batchDefaults.summaryText.trim();

		const batchDateValue =
			createdEditor.precision !== 'none'
				? createdEditor.year || createdEditor.month || createdEditor.day || null
				: null;
		const batchDateApproximate = createdEditor.approximate;

		if (!defaultTitle && !batchDateValue && defaultTags.length === 0 && !defaultDescription) return;

		untrack(() => {
			let updated = false;
			const next: Record<string, ObjectItemMetadata> = { ...objectMetadata };

			for (const key of keys) {
				const current = next[key] ?? {};
				const patch: Partial<ObjectItemMetadata> = {};

				if (current.title === undefined && defaultTitle) patch.title = defaultTitle;
				if (current.date === undefined && batchDateValue) patch.date = { value: batchDateValue, approximate: batchDateApproximate };
				if (current.tags === undefined && defaultTags.length > 0) patch.tags = [...defaultTags];
				if (current.description === undefined && defaultDescription) patch.description = defaultDescription;

				if (Object.keys(patch).length > 0) {
					next[key] = { ...current, ...patch };
					updated = true;
				}
			}

			if (updated) objectMetadata = next;
		});
	});

	const hasRequiredItemMetadata = $derived(
		allObjectKeys.length === 0 || allObjectKeys.every(isItemMetadataComplete)
	);

	const incompleteItemSummaries = $derived(
		allObjectKeys
			.filter((key) => !isItemMetadataComplete(key))
			.map((key) => {
				const isGroup = !key.startsWith('file:');
				const label = isGroup
					? (objectGroups.find((g) => g.id === key)?.label ?? `Object ${key.slice(0, 6)}`)
					: (files.find((f) => f.id === parseInt(key.slice(5)))?.name ?? key);
				const meta = objectMetadata[key] ?? {};
				const missing: string[] = [];
				if (!(meta.title ?? '').trim()) missing.push('title');
				if (meta.date?.value == null) missing.push('date');
				if (!(meta.tags ?? []).length) missing.push('tags');
				return { label, missing };
			})
	);

	const incompleteItemCount = $derived(incompleteItemSummaries.length);
	const largestGroupSize = $derived(
		objectGroups.reduce((largest, group) => Math.max(largest, group.fileIds.length), 0)
	);
	const hasOversizedGroup = $derived(largestGroupSize >= 50);

	const setFileStatus = (id: number, status: FileStatus, backendFileId?: string) => {
		files = files.map((file) =>
			file.id === id
				? {
						...file,
						status,
						backendFileId: backendFileId ?? file.backendFileId
					}
				: file
		);
	};

	const setFileUploadError = (id: number, message: string | undefined) => {
		files = files.map((file) =>
			file.id === id
				? {
						...file,
						uploadError: message
					}
				: file
		);
	};

	const findFile = (id: number): LocalIngestionFile | undefined => files.find((file) => file.id === id);

	const sha256Hex = async (file: File): Promise<string> => {
		const bytes = await file.arrayBuffer();
		const digest = await crypto.subtle.digest('SHA-256', bytes);
		return Array.from(new Uint8Array(digest))
			.map((byte) => byte.toString(16).padStart(2, '0'))
			.join('');
	};

	const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
		const payload = await response.json().catch(() => null);
		if (
			payload &&
			typeof payload === 'object' &&
			'error' in payload &&
			typeof payload.error === 'string'
		) {
			return payload.error;
		}
		return fallback;
	};

	const setupEndpoint = (): string => resolve('/ingestion/[batchId]/setup', { batchId });
	const metadataEndpoint = (): string => resolve('/ingestion/[batchId]/metadata', { batchId });
	const fileDeleteEndpoint = (backendFileId: string) =>
		resolve('/ingestion/[batchId]/files/[fileId]', { batchId, fileId: backendFileId });
	let metadataSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let metadataSavedTimer: ReturnType<typeof setTimeout> | null = null;
	let metadataSaveAttempt = 0;
	let metadataSaveError = $state('');
	let metadataSaveState = $state<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');

	onDestroy(() => {
		if (metadataSaveTimer) {
			clearTimeout(metadataSaveTimer);
		}
		if (metadataSavedTimer) {
			clearTimeout(metadataSavedTimer);
		}
		if (autoGroupToastTimer) {
			clearTimeout(autoGroupToastTimer);
		}
		if (itemSaveErrorTimer) {
			clearTimeout(itemSaveErrorTimer);
		}
		for (const timer of Object.values(itemUpdateTimers)) {
			clearTimeout(timer);
		}
		for (const url of Object.values(previewUrls)) {
			URL.revokeObjectURL(url);
		}
	});

	const saveBatchMetadata = async () => {
		const summaryText = batchDefaults.summaryText.trim();
		const embargoIso = batchDefaults.embargoUntil
			? new Date(batchDefaults.embargoUntil).toISOString()
			: null;
		const batchLabel = batchDefaults.title.trim() || batchId;
		const summaryDatesPayload: SummaryDates = {
			published: {
				value: toSummaryDateValue(summaryDateEditors.published, t('ingestionSetup.batchIntent.publishedDate')),
				approximate: summaryDateEditors.published.approximate,
				confidence: summaryDateEditors.published.confidence,
				note: summaryDateEditors.published.note.trim() || null
			},
			created: {
				value: toSummaryDateValue(summaryDateEditors.created, t('ingestionSetup.batchIntent.createdDate')),
				approximate: summaryDateEditors.created.approximate,
				confidence: summaryDateEditors.created.confidence,
				note: summaryDateEditors.created.note.trim() || null
			}
		};
		const payload = {
			batchLabel,
			classificationType: batchDefaults.classificationType,
			itemKind: batchDefaults.itemKind,
			languageCode: batchDefaults.language,
			pipelinePreset: batchDefaults.pipelinePreset,
			accessLevel: batchDefaults.accessLevel,
			embargoUntil: embargoIso,
			rightsNote: batchDefaults.rightsNote || null,
			sensitivityNote: batchDefaults.sensitivityNote || null,
			summary: {
				title: {
					primary: batchLabel,
					original_script: summaryTitleMeta.originalScript,
					translations: summaryTitleMeta.translations
				},
				classification: {
					tags: summaryTags,
					summary: summaryText.length > 0 ? summaryText : null
				},
				dates: summaryDatesPayload
			}
		};

		const response = await fetch(metadataEndpoint(), {
			method: 'PATCH',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (response.status === 401) {
			await goto(resolve('/login'));
			return;
		}

		if (!response.ok) {
			throw new Error(await readErrorMessage(response, 'Failed to update ingestion defaults.'));
		}
	};

	const queueBatchMetadataSave = () => {
		metadataSaveError = '';
		metadataSaveState = 'pending';
		if (metadataSaveTimer) {
			clearTimeout(metadataSaveTimer);
		}
		if (metadataSavedTimer) {
			clearTimeout(metadataSavedTimer);
		}

		metadataSaveTimer = setTimeout(async () => {
			const attempt = ++metadataSaveAttempt;
			metadataSaveState = 'saving';
			try {
				await saveBatchMetadata();
				if (attempt !== metadataSaveAttempt) {
					return;
				}
				metadataSaveState = 'saved';
				metadataSavedTimer = setTimeout(() => {
					if (attempt === metadataSaveAttempt) {
						metadataSaveState = 'idle';
					}
				}, 1500);
			} catch (error) {
				metadataSaveError = error instanceof Error ? error.message : 'Failed to update ingestion defaults.';
				metadataSaveState = 'error';
			}
		}, 300);
	};


	const addSummaryTag = () => {
		const normalized = summaryTagInput.trim().replace(/^#/, '');
		if (!normalized) return;
		if (!summaryTags.includes(normalized)) {
			summaryTags = [...summaryTags, normalized];
			queueBatchMetadataSave();
		}
		summaryTagInput = '';
	};

	const removeSummaryTag = (tag: string) => {
		summaryTags = summaryTags.filter((value) => value !== tag);
		queueBatchMetadataSave();
	};

	const postSetupAction = async (body: unknown, signal?: AbortSignal): Promise<Response> =>
		fetch(setupEndpoint(), {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(body),
			signal
		});

	const isAbortError = (error: unknown): boolean =>
		error instanceof DOMException
			? error.name === 'AbortError'
			: error instanceof Error && error.name === 'AbortError';

	const removeFile = async (id: number): Promise<void> => {
		if (removingIds.includes(id)) return;

		submitError = '';

		const file = findFile(id);
		if (!file) return;

		const snapshot = removeLocalFile(id);
		if (!snapshot) return;

		revokePreviewUrl(id);
		removingIds = [...removingIds, id];
		try {
			uploadControllers.get(id)?.abort();
			uploadControllers.delete(id);

			if (file.backendFileId) {
				const response = await fetch(fileDeleteEndpoint(file.backendFileId), {
					method: 'DELETE'
				});

				if (response.status === 401) {
					await goto(resolve('/login'));
					return;
				}

				if (response.status === 409) {
					restoreLocalFile(snapshot);
					setFileUploadError(id, t('ingestionSetup.files.cannotRemoveCommitted'));
					return;
				}

				if (!response.ok) {
					restoreLocalFile(snapshot);
					setFileUploadError(
						id,
						await readErrorMessage(response, t('ingestionSetup.files.removeFailed'))
					);
					return;
				}
			}

		} catch {
			restoreLocalFile(snapshot);
			setFileUploadError(id, t('ingestionSetup.files.removeFailed'));
		} finally {
			removingIds = removingIds.filter((value) => value !== id);
		}
	};

	const uploadAndCommitFile = async (fileId: number): Promise<void> => {
		if (uploadControllers.has(fileId)) return;

		const file = findFile(fileId);
		if (
			!file ||
			file.source !== 'local' ||
			!file.rawFile ||
			file.status === 'approved' ||
			file.status === 'processing'
		) {
			return;
		}

		const uploadController = new AbortController();
		uploadControllers.set(file.id, uploadController);

		setFileUploadError(file.id, undefined);
		setFileStatus(file.id, 'processing');

		try {
			const presignResponse = await postSetupAction({
				action: 'presign',
				filename: file.rawFile.name,
				contentType: file.rawFile.type || 'application/octet-stream',
				sizeBytes: file.rawFile.size
			}, uploadController.signal);

			if (presignResponse.status === 401) {
				await goto(resolve('/login'));
				return;
			}

			if (!presignResponse.ok) {
				throw new Error(await readErrorMessage(presignResponse, `Failed to prepare upload for ${file.name}.`));
			}

			const presigned = await presignResponse.json();
			if (!findFile(file.id)) {
				return;
			}

			setFileStatus(file.id, 'processing', presigned.fileId);

			const uploadHeaders = new Headers();
			uploadHeaders.set(
				'content-type',
				presigned.headers?.contentType || file.rawFile.type || 'application/octet-stream'
			);
			uploadHeaders.set('content-length', presigned.headers?.contentLength || String(file.rawFile.size));

			const uploadResponse = await fetch(presigned.uploadUrl, {
				method: 'PUT',
				headers: uploadHeaders,
				body: file.rawFile,
				signal: uploadController.signal
			});

			if (!uploadResponse.ok) {
				throw new Error(`Failed to upload ${file.name}.`);
			}

			const checksumSha256 = await sha256Hex(file.rawFile);
			const commitResponse = await postSetupAction({
				action: 'commit',
				fileId: presigned.fileId,
				checksumSha256
			}, uploadController.signal);

			if (commitResponse.status === 401) {
				await goto(resolve('/login'));
				return;
			}

			if (!commitResponse.ok) {
				throw new Error(await readErrorMessage(commitResponse, `Failed to commit ${file.name}.`));
			}

			if (!findFile(file.id)) {
				return;
			}

			setFileStatus(file.id, 'approved', presigned.fileId);
		} catch (error) {
			if (isAbortError(error)) {
				return;
			}

			const message = error instanceof Error ? error.message : `Failed to upload ${file.name}.`;
			setFileStatus(file.id, 'failed');
			setFileUploadError(file.id, message);
		} finally {
			uploadControllers.delete(file.id);
			pumpUploadQueue();
		}
	};

	const retryUpload = (fileId: number) => {
		submitError = '';
		const file = findFile(fileId);
		if (!file || file.source !== 'local') {
			return;
		}
		setFileStatus(fileId, 'queued');
		enqueueUploads([fileId]);
	};

	const hasPendingUploads = $derived(
		files.some((file) => file.status === 'queued' || file.status === 'processing') ||
		uploadQueue.length > 0 ||
		uploadControllers.size > 0
	);
	const hasUploadFailures = $derived(files.some((file) => file.status === 'failed'));
	const hasCommittedFiles = $derived(files.some((file) => file.status === 'approved'));
	const canStartIngestion = $derived(
		isReady &&
		hasCommittedFiles &&
		!hasPendingUploads &&
		!hasUploadFailures &&
		hasRequiredItemMetadata &&
		!isSubmitting
	);

	// --- Step state ---
	let step = $state<'organize' | 'metadata'>('organize');

	// --- Step 1 (Organize) ---
	let selectedFileIds = $state<number[]>([]);
	let dragOverUngroupedSection = $state(false);
	let validationDismissed = $state(false);
	let step1DragSourceId = $state<number | null>(null);
	let step1DragTargetFileId = $state<number | null>(null);
	let expandedMetadataKeys = $state<string[]>([]);

	const singleGroupWarning = $derived(
		objectGroups.length === 0 && standaloneFiles.length >= 10 && !validationDismissed
	);
	const organizeObjectCount = $derived(objectGroups.length + standaloneFiles.length);

	const fileKindIcon = (mediaType: BatchMediaType): string => {
		if (mediaType === 'audio') return 'audio';
		if (mediaType === 'document') return 'book';
		if (mediaType === 'video') return 'video';
		return 'image';
	};

	const revokePreviewUrl = (fileId: number): void => {
		const url = previewUrls[fileId];
		if (url) {
			URL.revokeObjectURL(url);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { [fileId]: _unused, ...rest } = previewUrls;
			previewUrls = rest;
		}
	};

	const toggleFileSelection = (fileId: number) => {
		if (selectedFileIds.includes(fileId)) {
			selectedFileIds = selectedFileIds.filter((id) => id !== fileId);
		} else {
			selectedFileIds = [...selectedFileIds, fileId];
		}
	};

	const organizeGroupSelected = () => {
		if (selectedFileIds.length < 2) return;
		const ids = [...selectedFileIds];
		const updatedGroups = dissolveSmallGroups(
			objectGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => !ids.includes(fid)) }))
		);
		const firstFile = files.find((f) => f.id === ids[0]);
		const label = firstFile ? firstFile.name.replace(/\.[^.]+$/, '') : undefined;
		const localId = crypto.randomUUID();
		objectGroups = [...updatedGroups, { id: localId, label, fileIds: ids }];
		selectedFileIds = [];
	};

	const organizeSplitSelected = () => {
		if (selectedFileIds.length === 0) return;
		const ids = [...selectedFileIds];
		objectGroups = dissolveSmallGroups(
			objectGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => !ids.includes(fid)) }))
		);
		selectedFileIds = [];
	};

	const createNewGroup = () => {
		const newId = crypto.randomUUID();
		objectGroups = [...objectGroups, { id: newId, fileIds: [] }];
	};

	const toggleMetadataCard = (key: string) => {
		if (expandedMetadataKeys.includes(key)) {
			expandedMetadataKeys = expandedMetadataKeys.filter((k) => k !== key);
		} else {
			expandedMetadataKeys = [...expandedMetadataKeys, key];
		}
	};

	// Step 1 DnD (uses 'application/x-proto-file-id' mime type, distinct from list DnD)
	const hasProtoFileDragType = (e: DragEvent): boolean => {
		const types = e.dataTransfer?.types;
		if (!types) return false;
		if (typeof (types as { includes?: (v: string) => boolean }).includes === 'function') {
			return (types as { includes: (v: string) => boolean }).includes('application/x-proto-file-id');
		}
		return Array.from(types as Iterable<string>).includes('application/x-proto-file-id');
	};

	const onStep1FileDragStart = (e: DragEvent, fileId: number) => {
		if (!e.dataTransfer) return;
		e.dataTransfer.setData('application/x-proto-file-id', String(fileId));
		e.dataTransfer.effectAllowed = 'move';
		step1DragSourceId = fileId;
		const file = filesById.get(fileId);
		if (file) {
			const label = file.name.length > 32 ? file.name.slice(0, 32) + '…' : file.name;
			const ghost = document.createElement('div');
			ghost.style.cssText =
				'position:fixed;top:-200px;left:0;background:#fff;border:1px solid rgba(79,109,122,0.3);border-radius:8px;padding:5px 12px;font-size:11px;color:#1a2633;box-shadow:0 2px 8px rgba(0,0,0,0.12);white-space:nowrap;';
			ghost.textContent = label;
			document.body.appendChild(ghost);
			e.dataTransfer.setDragImage(ghost, 16, 16);
			setTimeout(() => ghost.remove(), 0);
		}
	};

	const onStep1FileDragEnd = () => {
		step1DragSourceId = null;
		step1DragTargetFileId = null;
		listDragTargetGroupId = null;
		dragOverUngroupedSection = false;
	};

	const onStep1GroupDragOver = (e: DragEvent, groupId: string) => {
		if (!hasProtoFileDragType(e)) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		listDragTargetGroupId = groupId;
	};

	const onStep1GroupDragLeave = (groupId: string) => {
		if (listDragTargetGroupId === groupId) listDragTargetGroupId = null;
	};

	const onStep1GroupDrop = (e: DragEvent, groupId: string) => {
		e.preventDefault();
		const srcId = step1DragSourceId;
		listDragTargetGroupId = null;
		if (srcId === null) return;
		addFileToGroup(srcId, groupId);
		step1DragSourceId = null;
	};

	const onStep1LeftPanelDragOver = (e: DragEvent) => {
		if (!hasProtoFileDragType(e)) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverUngroupedSection = true;
	};

	const onStep1LeftPanelDrop = (e: DragEvent) => {
		if (!hasProtoFileDragType(e)) return;
		e.preventDefault();
		const srcId = step1DragSourceId;
		dragOverUngroupedSection = false;
		if (srcId === null) return;
		objectGroups = dissolveSmallGroups(
			objectGroups.map((g) => ({ ...g, fileIds: g.fileIds.filter((fid) => fid !== srcId) }))
		);
		step1DragSourceId = null;
	};

	const onStep1GroupFileDragOver = (e: DragEvent, fileId: number) => {
		if (!hasProtoFileDragType(e)) return;
		e.preventDefault();
		e.stopPropagation();
		step1DragTargetFileId = fileId;
	};

	const onStep1GroupFileDrop = (e: DragEvent, targetFileId: number, groupId: string) => {
		e.preventDefault();
		e.stopPropagation();
		const srcId = step1DragSourceId;
		step1DragTargetFileId = null;
		if (srcId === null || srcId === targetFileId) return;
		const srcGroup = objectGroups.find((g) => g.fileIds.includes(srcId));
		if (srcGroup?.id === groupId) {
			reorderWithinGroup(groupId, srcId, targetFileId);
		} else {
			addFileToGroup(srcId, groupId);
		}
		step1DragSourceId = null;
	};

	const startIngestion = async () => {
		if (!canStartIngestion) return;

		isSubmitting = true;
		submitError = '';

		try {
			// Create server items for groups that were auto-grouped (no serverId yet)
			const unsyncedGroups = objectGroups.filter((g) => !g.serverId);
			let nextItemIndex = objectGroups.filter((g) => g.serverId).length + 1;

			for (const group of unsyncedGroups) {
				const groupFilesWithBackendId = group.fileIds
					.map((localFileId) => files.find((f) => f.id === localFileId))
					.filter((f): f is LocalIngestionFile => !!f?.backendFileId);
				if (groupFilesWithBackendId.length === 0) continue;
				const createResponse = await postSetupAction({
					action: 'create_item',
					itemIndex: nextItemIndex++,
					...(group.label ? { label: group.label } : {})
				});
				if (createResponse.status === 401) { await goto(resolve('/login')); return; }
				if (!createResponse.ok) {
					throw new Error(await readErrorMessage(createResponse, 'Failed to create item for grouped files.'));
				}
				const result: { id: string; itemIndex: number } = await createResponse.json();
				for (let i = 0; i < groupFilesWithBackendId.length; i++) {
					const attachResponse = await postSetupAction({
						action: 'attach_file',
						itemId: result.id,
						fileId: groupFilesWithBackendId[i].backendFileId!,
						sortOrder: i + 1
					});
					if (!attachResponse.ok) break;
				}
			}

			// Auto-create items for standalone files (files not in any group)
			const standalonesToCreate = standaloneFiles.filter((f) => f.backendFileId);

			for (const standaloneFile of standalonesToCreate) {
				const createResponse = await postSetupAction({
					action: 'create_item',
					itemIndex: nextItemIndex++
				});
				if (createResponse.status === 401) { await goto(resolve('/login')); return; }
				if (!createResponse.ok) {
					throw new Error(await readErrorMessage(createResponse, 'Failed to create item for standalone file.'));
				}
				const result: { id: string; itemIndex: number } = await createResponse.json();
				const attachResponse = await postSetupAction({
					action: 'attach_file',
					itemId: result.id,
					fileId: standaloneFile.backendFileId!,
					sortOrder: 1
				});
				if (!attachResponse.ok) {
					throw new Error(await readErrorMessage(attachResponse, 'Failed to attach file to item.'));
				}
			}

			const submitResponse = await postSetupAction({ action: 'submit' });

			if (submitResponse.status === 401) {
				await goto(resolve('/login'));
				return;
			}

			if (!submitResponse.ok) {
				throw new Error(await readErrorMessage(submitResponse, 'Failed to submit ingestion.'));
			}

			await goto(resolve('/ingestion'));
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Failed to submit ingestion.';
		} finally {
			isSubmitting = false;
			showConfirm = false;
		}
	};
</script>

<div class="flex flex-col min-h-screen">

<!-- Sticky top-bar -->
<header class="sticky top-0 z-20 border-b border-border-soft bg-alabaster-grey px-6 py-4 flex items-start justify-between gap-6">
	<div class="flex flex-col gap-1">
		<div class="flex items-center gap-2 text-xs text-text-muted">
			<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingestion</span>
			<Icon name="chevron-r" size={12} />
			<span class="font-mono text-xs">{batchId}</span>
		</div>
		<h1 class="font-display text-2xl text-text-ink m-0 leading-tight">
			{batchDefaults.title || batchId}
		</h1>
	</div>
	<div class="flex items-center gap-3 pt-1 flex-shrink-0">
		<Stamp>Draft · not yet submitted</Stamp>
		<a
			href={resolve('/ingestion')}
			class="inline-flex items-center gap-2 rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
		>
			<Icon name="x" size={13} /> Discard
		</a>
	</div>
</header>

<main
	class="flex-1 flex flex-col gap-6 px-6 pb-4 pt-8"
	ondragenter={handleGlobalDragEnter}
	ondragleave={handleGlobalDragLeave}
	ondrop={handleGlobalDrop}
>
	<!-- Sub-step indicator + actions -->
	<section class="flex flex-wrap items-center justify-between gap-4">
		<nav class="flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
			<button
				class={step === 'organize' ? 'font-semibold text-blue-slate' : 'text-text-muted hover:text-blue-slate transition-colors'}
				onclick={() => { if (step === 'metadata') step = 'organize'; }}
			>
				1 · Organize
			</button>
			<Icon name="chevron-r" size={12} />
			<span class={step === 'metadata' ? 'font-semibold text-blue-slate' : 'text-text-muted'}>
				2 · Metadata
			</span>
		</nav>
		{#if step === 'organize'}
			<button
				onclick={() => autoGroupByFilename(standaloneFiles)}
				class="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted transition hover:bg-pale-sky/20 hover:text-text-ink active:scale-[0.99]"
			>
				Auto-group by filename
			</button>
		{/if}
	</section>

	{#if step === 'organize'}
		<!-- ══════════════ STEP 1: ORGANIZE ══════════════ -->

		<!-- Context banner -->
		<div class="rounded-xl border border-border-soft bg-pale-sky/15 px-5 py-3">
			<div class="flex items-center justify-between gap-4">
				<p class="text-sm text-blue-slate">
					Each group will become <span class="font-semibold">ONE object</span> in your library.
				</p>
				<p class="shrink-0 text-xs text-text-muted">
					{organizeObjectCount} {organizeObjectCount === 1 ? 'object' : 'objects'} · {files.length} {files.length === 1 ? 'file' : 'files'} total
				</p>
			</div>
		</div>

		<!-- Auto-group toast -->
		{#if autoGroupToast}
			<div class="rounded-xl border border-blue-slate/20 bg-pale-sky/20 px-5 py-2">
				<div class="flex items-center gap-3">
					<span class="text-xs text-blue-slate">✓ Files grouped automatically by filename. Please review and adjust.</span>
					<button onclick={() => { autoGroupToast = false; }} class="ml-auto text-xs text-blue-slate/50 hover:text-blue-slate">✕</button>
				</div>
			</div>
		{/if}

		<!-- Validation warning (10+ unassigned files, no groups) -->
		{#if singleGroupWarning}
			<div class="rounded-xl border border-burnt-peach/35 bg-pearl-beige/60 px-5 py-3">
				<div class="flex flex-wrap items-center gap-4">
					<p class="text-sm text-burnt-peach">
						⚠ You have {standaloneFiles.length} files that will each become their own separate object. Is this correct?
					</p>
					<div class="ml-auto flex shrink-0 gap-2">
						<button
							onclick={() => autoGroupByFilename(standaloneFiles)}
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

		<!-- Unified file list -->
		<section class="flex flex-col gap-4">

			<!-- Upload zone: full card when empty, compact strip when files exist -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			{#if files.length === 0}
				<div
					class={[
						'rounded-2xl border-2 px-8 py-16 text-center transition',
						isDragging || isGlobalDragging
							? 'border-blue-slate bg-pearl-beige/70 shadow-[0_0_0_4px_rgba(79,109,122,0.25)]'
							: 'border-dashed border-border-soft bg-pearl-beige/30 [outline:2px_dashed_rgba(79,109,122,0.15)] [outline-offset:-10px]'
					].join(' ')}
					ondragenter={handleDragEnter}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<p class="font-display text-xl text-text-ink">
						{isDragging || isGlobalDragging
							? t('ingestionSetup.dropzone.headlineDragging')
							: t('ingestionSetup.dropzone.headline')}
					</p>
					<p class="mt-2 text-sm text-text-muted">
						{#if batchMediaType}
							{format(t('ingestionSetup.dropzone.lockedType'), {
								mediaType: mediaTypeLabel(batchMediaType),
								supportedFormats: formatsFor(batchMediaType)
							})}
						{:else}
							{format(t('ingestionSetup.dropzone.unlockedType'), {
								supportedFormats: formatsFor(null)
							})}
						{/if}
					</p>
					{#if addFilesError}
						<p class="mt-3 text-xs text-burnt-peach">{addFilesError}</p>
					{/if}
					<button
						onclick={() => fileInput?.click()}
						class="mt-5 rounded-full border border-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate hover:bg-pale-sky/20 transition"
					>
						{t('ingestionSetup.dropzone.browse')}
					</button>
					<input bind:this={fileInput} type="file" multiple class="hidden" onchange={handleFileInput} />
				</div>
			{:else}
				<div
					class={[
						'flex items-center gap-4 rounded-2xl border px-5 py-3 transition',
						isDragging || isGlobalDragging
							? 'border-blue-slate bg-pearl-beige/70 shadow-[0_0_0_3px_rgba(79,109,122,0.2)]'
							: 'border-border-soft bg-pearl-beige/30 [outline:1px_dashed_rgba(79,109,122,0.25)] [outline-offset:-5px]'
					].join(' ')}
					ondragenter={handleDragEnter}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<span class="text-text-muted/60"><Icon name="upload" size={15} /></span>
					<span class="flex-1 text-sm text-text-muted">
						{isDragging || isGlobalDragging ? t('ingestionSetup.dropzone.headlineDragging') : 'Drop files to add more'}
					</span>
					{#if addFilesError}
						<span class="text-xs text-burnt-peach">{addFilesError}</span>
					{/if}
					<button
						onclick={() => fileInput?.click()}
						class="shrink-0 rounded-full border border-blue-slate/60 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate hover:bg-pale-sky/20 transition"
					>
						{t('ingestionSetup.dropzone.browse')}
					</button>
					<input bind:this={fileInput} type="file" multiple class="hidden" onchange={handleFileInput} />
				</div>
			{/if}

			<!-- Object groups -->
				{#each objectGroups as group (group.id)}
					<div class="overflow-hidden rounded-2xl border border-border-soft bg-surface-white">
						<ObjectGroupRow
							groupId={group.id}
							label={group.label}
							fileCount={group.fileIds.length}
							collapsed={collapsedGroups.includes(group.id)}
							dragOver={listDragTargetGroupId === group.id}
							active={false}
							ungroupDisabled={Boolean(group.serverId)}
							incomplete={getItemCompletenessState(group.id) === 'partial'}
							onToggleCollapse={() => toggleGroupCollapse(group.id)}
							onUngroup={() => ungroupFiles(group.id)}
							onLabelChange={(label: string) => renameGroup(group.id, label)}
							onDragOver={(e: DragEvent) => onStep1GroupDragOver(e, group.id)}
							onDragLeave={(_e: DragEvent) => onStep1GroupDragLeave(group.id)}
							onDrop={(e: DragEvent) => onStep1GroupDrop(e, group.id)}
						>
							<div class="divide-y divide-border-soft bg-surface-white">
								{#if group.fileIds.length === 0}
									<div class="px-6 py-6 text-center text-xs italic text-text-muted">
										Drop files here to add them to this group
									</div>
								{/if}
								{#each group.fileIds as fileId, index (fileId)}
									{@const file = filesById.get(fileId)}
									{#if file}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class={[
												'flex items-center gap-3 px-6 py-2.5 transition hover:bg-pale-sky/10',
												step1DragSourceId === fileId ? 'opacity-40' : '',
												step1DragTargetFileId === fileId ? 'ring-1 ring-inset ring-blue-slate/35' : ''
											].join(' ')}
											draggable="true"
											ondragstart={(e) => onStep1FileDragStart(e, fileId)}
											ondragend={onStep1FileDragEnd}
											ondragover={(e) => onStep1GroupFileDragOver(e, fileId)}
											ondrop={(e) => onStep1GroupFileDrop(e, fileId, group.id)}
										>
											<span class="w-5 shrink-0 text-center text-[10px] text-text-muted">{index + 1}</span>
											<span class="shrink-0 cursor-grab select-none text-text-muted/60" title="Drag to reorder">⠿</span>
											<div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-soft bg-alabaster-grey/50">
												{#if previewUrls[fileId] && file.mediaType === 'image'}
													<img src={previewUrls[fileId]} alt={file.name} class="h-full w-full object-cover" />
												{:else}
													<span class="text-text-muted/60">
														<Icon name={fileKindIcon(file.mediaType)} size={14} />
													</span>
												{/if}
											</div>
											<div class="min-w-0 flex-1">
												<p class="truncate text-sm text-text-ink">{file.name}</p>
												<p class="text-[10px] text-text-muted">{file.size}</p>
											</div>
											<StatusBadge status={file.status} label={statusLabel(file.status)} />
											<button
												type="button"
												class="shrink-0 rounded-full p-1 text-text-muted/50 transition hover:text-burnt-peach disabled:opacity-30"
												disabled={removingIds.includes(fileId)}
												onclick={(e) => { e.stopPropagation(); removeFile(fileId); }}
												title="Remove file"
												aria-label="Remove {file.name}"
											>✕</button>
										</div>
									{/if}
								{/each}
							</div>
						</ObjectGroupRow>
					</div>
				{/each}

				<!-- Ungrouped section -->
				{#if standaloneFiles.length > 0}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class={[
							'overflow-hidden rounded-2xl border-2 border-dashed transition',
							dragOverUngroupedSection ? 'border-blue-slate bg-pale-sky/5' : 'border-border-soft'
						].join(' ')}
						ondragover={onStep1LeftPanelDragOver}
						ondragleave={() => { dragOverUngroupedSection = false; }}
						ondrop={onStep1LeftPanelDrop}
					>
						<!-- Section header -->
						<div class="flex items-center gap-3 border-b border-border-soft bg-alabaster-grey/40 px-5 py-3">
							<span class="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Ungrouped</span>
							<span class="font-mono text-xs text-text-muted">
								{standaloneFiles.length} {standaloneFiles.length === 1 ? 'file' : 'files'} · each becomes its own object
							</span>
							{#if selectedFileIds.length > 0}
								<div class="ml-auto flex items-center gap-2">
									<span class="text-xs text-text-muted">{selectedFileIds.length} selected</span>
									<button
										disabled={selectedFileIds.length < 2}
										onclick={organizeGroupSelected}
										class="rounded-full border border-blue-slate px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:cursor-not-allowed disabled:opacity-40"
									>Merge</button>
									<button
										onclick={organizeSplitSelected}
										class="rounded-full border border-blue-slate/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate/75 transition hover:border-blue-slate hover:text-blue-slate"
									>Split</button>
									<button
										onclick={() => { selectedFileIds = []; }}
										class="text-xs text-text-muted hover:text-text-ink transition"
									>Clear</button>
								</div>
							{/if}
						</div>

						<!-- Ungrouped file rows -->
						<div class="divide-y divide-border-soft">
							{#each standaloneFiles as file (file.id)}
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class={[
										'grid cursor-grab items-center gap-x-3 px-5 py-2.5 transition hover:bg-pale-sky/15',
										step1DragSourceId === file.id ? 'opacity-40' : '',
										step1DragTargetFileId === file.id ? 'ring-1 ring-inset ring-blue-slate/40' : '',
										selectedFileIds.includes(file.id) ? 'bg-pale-sky/10' : ''
									].join(' ')}
									style="grid-template-columns: 16px 16px 16px 1fr 64px auto 24px"
									draggable="true"
									ondragstart={(e) => onStep1FileDragStart(e, file.id)}
									ondragend={onStep1FileDragEnd}
									onclick={() => toggleFileSelection(file.id)}
								>
									<span class="select-none text-text-muted/50" title="Drag to a group above">⠿</span>
									<input
										type="checkbox"
										checked={selectedFileIds.includes(file.id)}
										onclick={(e) => e.stopPropagation()}
										onchange={() => toggleFileSelection(file.id)}
										class="h-4 w-4 shrink-0 cursor-pointer rounded border-border-soft accent-blue-slate"
									/>
									<span class="text-text-muted/70">
										<Icon name={fileKindIcon(file.mediaType)} size={14} />
									</span>
									<p class="truncate text-sm text-text-ink">{file.name}</p>
									<span class="text-right font-mono text-xs text-text-muted">{file.size}</span>
									<StatusBadge status={file.status} label={statusLabel(file.status)} />
									<button
										type="button"
										class="shrink-0 rounded-full p-1 text-text-muted/50 transition hover:text-burnt-peach disabled:opacity-30"
										disabled={removingIds.includes(file.id)}
										onclick={(e) => { e.stopPropagation(); removeFile(file.id); }}
										title="Remove file"
										aria-label="Remove {file.name}"
									>✕</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

		</section>

	{:else}
		<!-- ══════════════ STEP 2: METADATA ══════════════ -->

		<!-- Batch defaults -->
		<div class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.batchIntent.title')}</p>
			<p class="mt-2 text-sm text-text-muted">{t('ingestionSetup.batchIntent.description')}</p>
			<p class="mt-3 text-xs uppercase tracking-[0.16em] text-text-muted">
				{#if metadataSaveState === 'saving' || metadataSaveState === 'pending'}
					{t('ingestionSetup.batchIntent.saveStateSaving')}
				{:else if metadataSaveState === 'saved'}
					{t('ingestionSetup.batchIntent.saveStateSaved')}
				{:else if metadataSaveState === 'error'}
					{t('ingestionSetup.batchIntent.saveStateError')}
				{:else}
					{t('ingestionSetup.batchIntent.saveStateIdle')}
				{/if}
			</p>
			{#if metadataSaveError}
				<p class="mt-3 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
					{metadataSaveError}
				</p>
			{/if}
			<div class="mt-4 text-sm">
				<details open class="py-2">
					<summary class="cursor-pointer text-xs uppercase tracking-[0.2em] text-blue-slate">
						{t('ingestionSetup.batchIntent.sections.coreMetadata')}
					</summary>
					<div class="mt-3 grid gap-3 md:grid-cols-2">
						<div class="md:col-span-2">
							<label for="intent-title" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.titleLabel')}</label>
							<input
								id="intent-title"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.title}
								oninput={(event) => {
									batchDefaults.title = event.currentTarget.value;
									queueBatchMetadataSave();
								}}
							/>
						</div>
						<div>
							<label for="intent-language" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.language')}</label>
							<select
								id="intent-language"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.language}
								onchange={(event) => {
									batchDefaults.language = event.currentTarget.value;
									queueBatchMetadataSave();
								}}
							>
								<option value="">{t('ingestionSetup.batchIntent.selectLanguage')}</option>
								{#each languages as language (language)}
									<option value={language}>{t(`ingestionSetup.languages.${language}`)}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="intent-item-kind" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.itemKind')}</label>
							<select
								id="intent-item-kind"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.itemKind}
								onchange={(event) =>
									setItemKind(
										event.currentTarget.value as
											| 'photo'
											| 'audio'
											| 'video'
											| 'scanned_document'
											| 'document'
											| 'other'
									)}
							>
								<option value="document">{t('ingestionSetup.itemKinds.document')}</option>
								<option value="scanned_document">{t('ingestionSetup.itemKinds.scanned_document')}</option>
								<option value="photo">{t('ingestionSetup.itemKinds.photo')}</option>
								<option value="audio">{t('ingestionSetup.itemKinds.audio')}</option>
								<option value="video">{t('ingestionSetup.itemKinds.video')}</option>
								<option value="other">{t('ingestionSetup.itemKinds.other')}</option>
							</select>
						</div>
						<div>
							<label for="intent-classification-type" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.classificationType')}</label>
							<select
								id="intent-classification-type"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.classificationType}
								onchange={(event) => {
									batchDefaults.classificationType = event.currentTarget.value;
									queueBatchMetadataSave();
								}}
							>
								<option value="">{t('ingestionSetup.batchIntent.selectType')}</option>
								{#each classificationTypes as type (type)}
									<option value={type}>{t(`ingestionSetup.classificationTypes.${type}`)}</option>
								{/each}
							</select>
							<p class="mt-1 text-xs text-text-muted">
								{#if batchDefaults.itemKind === 'document' || batchDefaults.itemKind === 'scanned_document'}
									{t('ingestionSetup.batchIntent.classificationHintDocument')}
								{:else}
									{t('ingestionSetup.batchIntent.classificationHintAuto')}
								{/if}
							</p>
						</div>
					</div>
				</details>

				<details class="border-t border-border-soft py-3">
					<summary class="cursor-pointer text-xs uppercase tracking-[0.2em] text-blue-slate">
						{t('ingestionSetup.batchIntent.sections.summaryContext')}
					</summary>
					<div class="mt-3 space-y-3">
						<div>
							<label for="intent-tags" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.tags')}</label>
							<div class="mt-2 flex items-center gap-2">
								<input
									id="intent-tags"
									class="w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
									placeholder={t('ingestionSetup.batchIntent.tagsPlaceholder')}
									value={summaryTagInput}
									oninput={(event) => (summaryTagInput = event.currentTarget.value)}
									onkeydown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											addSummaryTag();
										}
									}}
								/>
								<button
									type="button"
									onclick={addSummaryTag}
									class="rounded-full border border-border-soft px-3 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
								>
									{t('ingestionSetup.batchIntent.addTag')}
								</button>
							</div>
							{#if summaryTags.length > 0}
								<div class="mt-2 flex flex-wrap gap-2">
									{#each summaryTags as tag (tag)}
										<button
											type="button"
											onclick={() => removeSummaryTag(tag)}
											class="rounded-full border border-border-soft px-3 py-1 text-xs uppercase tracking-[0.18em] text-blue-slate"
										>
											{tag} ×
										</button>
									{/each}
								</div>
							{/if}
						</div>
						<div>
							<label for="intent-summary" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.summary')}</label>
							<textarea
								id="intent-summary"
								rows="2"
								class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.summaryText}
								oninput={(event) => {
									batchDefaults.summaryText = event.currentTarget.value;
									queueBatchMetadataSave();
								}}
							></textarea>
						</div>
					</div>
				</details>

				<details open class="border-t border-border-soft py-3">
					<summary class="cursor-pointer text-xs uppercase tracking-[0.2em] text-blue-slate">
						{t('ingestionSetup.batchIntent.sections.dates')}
					</summary>
					<p class="mt-2 text-xs text-text-muted">{t('ingestionSetup.batchIntent.dateHint')}</p>
					<div class="mt-3 space-y-4">
						{#each summaryDateSections as section, index (section.key)}
							{@const editor = summaryDateEditors[section.key]}
							<div class={index === 0 ? 'space-y-2' : 'space-y-2 border-t border-border-soft pt-4'}>
								<p class="text-xs uppercase tracking-[0.18em] text-text-muted">{t(section.labelKey)}</p>
								<div class="grid gap-2 md:grid-cols-2">
									<select
										class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
										value={editor.precision}
										onchange={(event) =>
											updateSummaryDatePrecision(section.key, event.currentTarget.value as SummaryDatePrecision)}
									>
										<option value="none">{t('ingestionSetup.batchIntent.precisionNone')}</option>
										<option value="year">{t('ingestionSetup.batchIntent.precisionYear')}</option>
										<option value="month">{t('ingestionSetup.batchIntent.precisionMonth')}</option>
										<option value="day">{t('ingestionSetup.batchIntent.precisionDay')}</option>
									</select>
									{#if editor.precision === 'none'}
										<div class="px-1 py-2 text-xs text-text-muted">{t('ingestionSetup.batchIntent.noDateSelected')}</div>
									{:else if editor.precision === 'year'}
										<input
											type="number"
											min="1000"
											max="2999"
											placeholder={t('ingestionSetup.batchIntent.yearPlaceholder')}
											class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
											value={editor.year}
											oninput={(event) => updateSummaryDateValue(section.key, event.currentTarget.value)}
										/>
									{:else if editor.precision === 'month'}
										<input
											type="month"
											class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
											value={editor.month}
											onchange={(event) => updateSummaryDateValue(section.key, event.currentTarget.value)}
										/>
									{:else}
										<input
											type="date"
											class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
											value={editor.day}
											onchange={(event) => updateSummaryDateValue(section.key, event.currentTarget.value)}
										/>
									{/if}
								</div>
								{#if editor.precision !== 'none'}
									<div class="grid gap-2 md:grid-cols-3">
										<select
											class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
											value={editor.confidence}
											onchange={(event) =>
												updateSummaryDateConfidence(section.key, event.currentTarget.value as 'low' | 'medium' | 'high')}
										>
											<option value="low">{t('ingestionSetup.batchIntent.confidenceLow')}</option>
											<option value="medium">{t('ingestionSetup.batchIntent.confidenceMedium')}</option>
											<option value="high">{t('ingestionSetup.batchIntent.confidenceHigh')}</option>
										</select>
										<label class="flex items-center gap-2 rounded-xl border border-border-soft px-3 py-2 text-xs text-text-muted">
											<input
												type="checkbox"
												checked={editor.approximate}
												onchange={(event) => updateSummaryDateApproximate(section.key, event.currentTarget.checked)}
											/>
											{t('ingestionSetup.batchIntent.approximateDate')}
										</label>
										<input
											class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
											placeholder={t('ingestionSetup.batchIntent.dateNotePlaceholder')}
											value={editor.note}
											oninput={(event) => updateSummaryDateNote(section.key, event.currentTarget.value)}
										/>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</details>

				<details class="border-t border-border-soft py-3">
					<summary class="cursor-pointer text-xs uppercase tracking-[0.2em] text-blue-slate">
						{t('ingestionSetup.batchIntent.sections.accessPolicy')}
					</summary>
					<div class="mt-3 grid gap-3 md:grid-cols-2">
						<div>
							<label for="intent-pipeline-preset" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.pipelinePreset')}</label>
							<select
								id="intent-pipeline-preset"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.pipelinePreset}
								onchange={(event) => {
									batchDefaults.pipelinePreset = event.currentTarget.value;
									queueBatchMetadataSave();
								}}
							>
								{#each pipelinePresets as preset (preset)}
									<option value={preset}>{t(`ingestionSetup.pipelinePresets.${preset}`)}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="intent-access-level" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.accessLevel')}</label>
							<select
								id="intent-access-level"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.accessLevel}
								onchange={(event) => {
									batchDefaults.accessLevel = event.currentTarget.value as 'private' | 'family' | 'public';
									queueBatchMetadataSave();
								}}
							>
								<option value="private">{t('ingestionSetup.batchIntent.accessLevels.private')}</option>
								<option value="family">{t('ingestionSetup.batchIntent.accessLevels.family')}</option>
								<option value="public">{t('ingestionSetup.batchIntent.accessLevels.public')}</option>
							</select>
						</div>
						<div>
							<label for="intent-embargo-until" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.embargoUntil')}</label>
							<input
								id="intent-embargo-until"
								type="datetime-local"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.embargoUntil}
								onchange={(event) => {
									batchDefaults.embargoUntil = event.currentTarget.value;
									queueBatchMetadataSave();
								}}
							/>
						</div>
						<div>
							<label for="intent-rights-note" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.rightsNote')}</label>
							<input
								id="intent-rights-note"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.rightsNote}
								oninput={(event) => {
									batchDefaults.rightsNote = event.currentTarget.value;
									queueBatchMetadataSave();
								}}
							/>
						</div>
						<div class="md:col-span-2">
							<label for="intent-sensitivity-note" class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionSetup.batchIntent.sensitivityNote')}</label>
							<input
								id="intent-sensitivity-note"
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={batchDefaults.sensitivityNote}
								oninput={(event) => {
									batchDefaults.sensitivityNote = event.currentTarget.value;
									queueBatchMetadataSave();
								}}
							/>
						</div>
					</div>
				</details>
			</div>
		</div>

		<!-- Per-object metadata cards -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Per-Object Metadata</p>
				<p class="text-xs text-text-muted">{objectCount} {objectCount === 1 ? 'object' : 'objects'}</p>
			</div>

			{#each objectGroups as group (group.id)}
				{@const key = group.id}
				{@const meta = objectMetadata[key] ?? {}}
				<div class={`rounded-2xl border bg-surface-white ${isItemMetadataComplete(key) ? 'border-border-soft' : 'border-burnt-peach/35'}`}>
					<button
						type="button"
						class={`flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-pale-sky/8 ${expandedMetadataKeys.includes(key) ? 'bg-pale-sky/8' : ''}`}
						onclick={() => toggleMetadataCard(key)}
					>
						<span class="text-xs text-blue-slate/60 transition-transform" style={expandedMetadataKeys.includes(key) ? '' : 'transform: rotate(-90deg)'}>▾</span>
						<span class="min-w-0 flex-1 truncate text-sm font-medium text-text-ink">
							{group.label || `Object ${group.id.slice(0, 6)}`}
						</span>
						<span class="shrink-0 rounded-full border border-border-soft px-2 py-0.5 text-[10px] text-text-muted">
							{group.fileIds.length} {group.fileIds.length === 1 ? 'file' : 'files'}
						</span>
						{#if !isItemMetadataComplete(key)}
							{@const missing = getItemMissingFields(key)}
							<span class="shrink-0 rounded-full border border-burnt-peach/30 bg-burnt-peach/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-burnt-peach" title="Missing: {missing.join(', ')}">needs info</span>
						{/if}
					</button>
					{#if expandedMetadataKeys.includes(key)}
						{@const panelFiles = group.fileIds.map((id) => filesById.get(id)).filter((f): f is LocalIngestionFile => f !== undefined).map((f) => ({ id: String(f.id), name: f.name, mediaType: f.mediaType, size: f.size, previewUrl: previewUrls[f.id] }))}
						<div class="border-t border-border-soft px-6 py-5">
							<ObjectMetadataPanel
								objectKey={key}
								objectLabel={group.label ?? ''}
								files={panelFiles}
								metadata={meta}
								batchTitle={batchDefaults.title}
								batchTags={summaryTags}
								batchDate={summaryDateEditors.created.precision !== 'none' ? { value: summaryDateEditors.created.year || summaryDateEditors.created.month || summaryDateEditors.created.day || null, approximate: summaryDateEditors.created.approximate } : null}
								batchDescription={batchDefaults.summaryText}
								onMetadataChange={(patch) => setObjectMeta(key, patch)}
							/>
						</div>
					{/if}
				</div>
			{/each}

			{#each standaloneFiles as file (file.id)}
				{@const key = `file:${file.id}`}
				{@const meta = objectMetadata[key] ?? {}}
				<div class={`rounded-2xl border bg-surface-white ${isItemMetadataComplete(key) ? 'border-border-soft' : 'border-burnt-peach/35'}`}>
					<button
						type="button"
						class={`flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-pale-sky/8 ${expandedMetadataKeys.includes(key) ? 'bg-pale-sky/8' : ''}`}
						onclick={() => toggleMetadataCard(key)}
					>
						<span class="text-xs text-blue-slate/60 transition-transform" style={expandedMetadataKeys.includes(key) ? '' : 'transform: rotate(-90deg)'}>▾</span>
						<span class="text-text-muted/60">
							<Icon name={fileKindIcon(file.mediaType)} size={14} />
						</span>
						<span class="min-w-0 flex-1 truncate text-sm font-medium text-text-ink">{file.name}</span>
						<span class="shrink-0 text-xs text-text-muted">{file.size}</span>
						{#if !isItemMetadataComplete(key)}
							{@const missing = getItemMissingFields(key)}
							<span class="shrink-0 rounded-full border border-burnt-peach/30 bg-burnt-peach/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-burnt-peach" title="Missing: {missing.join(', ')}">needs info</span>
						{/if}
					</button>
					{#if expandedMetadataKeys.includes(key)}
						{@const panelFiles = [{ id: String(file.id), name: file.name, mediaType: file.mediaType, size: file.size, previewUrl: previewUrls[file.id] }]}
						<div class="border-t border-border-soft px-6 py-5">
							<ObjectMetadataPanel
								objectKey={key}
								objectLabel={file.name}
								files={panelFiles}
								metadata={meta}
								batchTitle={batchDefaults.title}
								batchTags={summaryTags}
								batchDate={summaryDateEditors.created.precision !== 'none' ? { value: summaryDateEditors.created.year || summaryDateEditors.created.month || summaryDateEditors.created.day || null, approximate: summaryDateEditors.created.approximate } : null}
								batchDescription={batchDefaults.summaryText}
								onMetadataChange={(patch) => setObjectMeta(key, patch)}
							/>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Readiness section -->
		<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="space-y-2">
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.readiness.title')}</p>
					<p class="text-sm text-text-muted">
						{canStartIngestion
							? t('ingestionSetup.readiness.ready')
							: hasPendingUploads
								? t('ingestionSetup.readiness.uploading')
								: hasUploadFailures
									? t('ingestionSetup.readiness.uploadFailed')
									: !isReady
										? t('ingestionSetup.readiness.missing')
										: t('ingestionSetup.readiness.missingItemMetadata')}
					</p>
					{#if !isReady}
						<div class="rounded-xl border border-border-soft bg-pale-sky/15 px-4 py-3 text-xs text-text-muted">
							<p>{format(t('ingestionSetup.readiness.missingCount'), { count: missingCount })}</p>
							<ul class="mt-2 space-y-1">
								{#each missingSummaries as entry (entry.file.id)}
									<li>
										<span class="text-text-ink">{entry.file.name}</span>
										· {entry.missing.join(', ')}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
					{#if isReady && incompleteItemCount > 0}
						<div class="rounded-xl border border-border-soft bg-pale-sky/15 px-4 py-3 text-xs text-text-muted">
							<p>{format(t('ingestionSetup.readiness.missingItemMetadataCount'), { count: incompleteItemCount })}</p>
							<ul class="mt-2 space-y-1">
								{#each incompleteItemSummaries as entry (entry.label)}
									<li>
										<span class="text-text-ink">{entry.label}</span>
										· {entry.missing.join(', ')}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
					{#if hasOversizedGroup}
						<div class="rounded-xl border border-burnt-peach/35 bg-pearl-beige/60 px-4 py-3 text-xs text-text-muted">
							This document has <strong>{largestGroupSize}</strong> pages. Please confirm this grouping before continuing.
						</div>
					{/if}
					{#if batchDefaults.itemKind === 'scanned_document' && standaloneFiles.length >= 3 && !groupingWarningDismissed}
						<div class="flex items-start gap-3 rounded-xl border border-burnt-peach/30 bg-pearl-beige/60 px-4 py-3 text-xs text-text-muted">
							<span class="mt-0.5 shrink-0 text-burnt-peach">⚠</span>
							<p class="flex-1">
								You have <strong>{standaloneFiles.length}</strong> separate objects with 1 file each.
								If these are pages of the same document, consider grouping them first.
							</p>
							<button
								type="button"
								class="shrink-0 text-text-muted/50 hover:text-text-muted"
								onclick={() => { groupingWarningDismissed = true; }}
								aria-label="Dismiss"
							>✕</button>
						</div>
					{/if}
				</div>
				{#if submitError}
					<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
						{submitError}
					</p>
				{/if}
			</div>
		</section>
	{/if}

	{#if showConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-dark-grey/60 px-6">
			<div class="w-full max-w-xl rounded-2xl border border-border-soft bg-surface-white p-6 shadow-[0_30px_80px_rgba(31,47,56,0.35)]">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.confirmation.title')}</p>
						<h3 class="mt-2 font-display text-xl text-text-ink">{t('ingestionSetup.confirmation.subtitle')}</h3>
					</div>
					<button class="text-sm text-text-muted" onclick={() => (showConfirm = false)}>
						{t('common.close')}
					</button>
				</div>
				<div class="mt-4 space-y-3 text-sm text-text-muted">
					<p><span class="text-text-ink">{t('ingestionSetup.confirmation.batch')}</span> · {batchId}</p>
					<p><span class="text-text-ink">{t('ingestionSetup.confirmation.files')}</span> · {files.length}</p>
					<p><span class="text-text-ink">{t('ingestionSetup.confirmation.objects')}</span> · {objectCount}</p>
					<p>
						<span class="text-text-ink">{t('ingestionSetup.confirmation.languages')}</span> ·
						{Array.from(new Set(files.map((file) => getEffectiveValue(file.id, 'language') ?? '')))
							.filter((value) => value.length > 0)
							.map((value) => languageLabel(value))
							.join(', ') || t('values.unknown')}
					</p>
					<p>
						<span class="text-text-ink">{t('ingestionSetup.confirmation.pipeline')}</span> ·
						{pipelineLabel(batchDefaults.pipelinePreset)}
					</p>
				</div>
				<div class="mt-6 flex flex-wrap items-center justify-end gap-3">
					<button
						class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
						onclick={() => (showConfirm = false)}
					>
						{t('common.cancel')}
					</button>
					<button
						class="rounded-full bg-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
						onclick={startIngestion}
						disabled={!canStartIngestion}
					>
						{isSubmitting ? t('ingestionSetup.confirmation.submitting') : t('common.confirmStart')}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if mismatchDialog?.open}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-dark-grey/60 px-6">
			<div class="w-full max-w-xl rounded-2xl border border-border-soft bg-surface-white p-6 shadow-[0_30px_80px_rgba(31,47,56,0.35)]">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs uppercase tracking-[0.2em] text-burnt-peach">{t('ingestionSetup.mismatch.title')}</p>
						<h3 class="mt-2 font-display text-xl text-text-ink">{t('ingestionSetup.mismatch.subtitle')}</h3>
					</div>
					<button class="text-sm text-text-muted" onclick={closeMismatchDialog}>{t('common.close')}</button>
				</div>
				<div class="mt-4 space-y-2 text-sm text-text-muted">
					<p>{format(t('ingestionSetup.mismatch.details'), {
						expected: mismatchDialog.expectedLabel,
						incoming: mismatchDialog.incomingLabel
					})}</p>
					<p>{format(t('ingestionSetup.mismatch.rejected'), {
						count: mismatchDialog.rejectedCount,
						sample: mismatchDialog.rejectedSample
					})}</p>
				</div>
				<div class="mt-6 flex flex-wrap items-center justify-end gap-3">
					<button
						type="button"
						class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
						onclick={closeMismatchDialog}
					>
						{t('ingestionSetup.mismatch.keep')}
					</button>
					<button
						type="button"
						class="rounded-full bg-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
						onclick={confirmMismatchAndSwitchKind}
					>
						{t('ingestionSetup.mismatch.switchAndContinue')}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Item save error toast -->
	{#if itemSaveError}
		<div class="fixed bottom-24 right-6 z-50 flex items-center gap-3 rounded-sm border border-burnt-peach/40 bg-pearl-beige px-4 py-3 shadow-lg">
			<Icon name="warn" size={14} />
			<p class="text-xs text-burnt-peach">A change failed to save — check your connection.</p>
			<button
				type="button"
				onclick={() => { itemSaveError = false; }}
				class="ml-2 text-burnt-peach/50 hover:text-burnt-peach"
				aria-label="Dismiss"
			><Icon name="x" size={12} /></button>
		</div>
	{/if}
</main>

<FootnoteBar>
	{#snippet left()}
		<span class="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-text-muted">Step 2 of 3</span>
		<Stepper
			steps={[
				{ id: 'describe', label: 'Describe' },
				{ id: 'setup', label: 'Upload & tune' },
				{ id: 'review', label: 'Review' },
			]}
			current={1}
			onJump={(i) => { if (i === 0) goto(resolve('/ingestion/new')); }}
		/>
	{/snippet}
	{#snippet right()}
		{#if step === 'organize'}
			<span class="text-sm text-text-muted">
				{organizeObjectCount} {organizeObjectCount === 1 ? 'object' : 'objects'} ready
				{#if standaloneFiles.length > 0}
					· <span class="text-blue-slate/70">{standaloneFiles.length} unassigned</span>
				{/if}
			</span>
			<a
				href={resolve('/ingestion')}
				class="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
			>
				<Icon name="arrow-l" size={13} /> Back
			</a>
			<button
				disabled={hasPendingUploads}
				onclick={() => { step = 'metadata'; }}
				class="inline-flex items-center gap-2 rounded-full bg-blue-slate-deep text-surface-white px-5 py-2 text-xs uppercase tracking-[0.2em] border border-blue-slate-deep hover:bg-blue-slate transition-all disabled:opacity-40 disabled:pointer-events-none"
			>
				Continue <Icon name="arrow-r" size={13} />
			</button>
		{:else}
			<span class="text-sm text-text-muted">
				{canStartIngestion
					? t('ingestionSetup.readiness.ready')
					: hasPendingUploads
						? t('ingestionSetup.readiness.uploading')
						: t('ingestionSetup.readiness.missingItemMetadata')}
			</span>
			<button
				onclick={() => { step = 'organize'; }}
				class="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
			>
				<Icon name="arrow-l" size={13} /> Back
			</button>
			<button
				disabled={!canStartIngestion}
				onclick={() => (showConfirm = true)}
				class="inline-flex items-center gap-2 rounded-full bg-burnt-peach text-surface-white px-5 py-2 text-xs uppercase tracking-[0.2em] border border-burnt-peach transition-all disabled:opacity-40 disabled:pointer-events-none"
			>
				{t('common.startIngestion')} <Icon name="arrow-r" size={13} />
			</button>
		{/if}
	{/snippet}
</FootnoteBar>

</div>
