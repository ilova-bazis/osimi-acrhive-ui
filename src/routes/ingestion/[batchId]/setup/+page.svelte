<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { IngestionCapabilities, IngestionMediaKind } from '$lib/services/ingestionCapabilities';
	import type { IngestionDetailFile } from '$lib/services/ingestionDetail';
	import type { FileStatus } from '$lib/types';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { SvelteMap } from 'svelte/reactivity';
	import { onDestroy } from 'svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let {
		data
	} = $props<{
		data: {
			batchId: string;
			capabilities: IngestionCapabilities;
			existingFiles: IngestionDetailFile[];
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
	let nextFileId = 1;
	let dragDepth = $state(0);
	let isDragging = $state(false);
	let isGlobalDragging = $state(false);
	let fileInput: HTMLInputElement | null = null;

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

	const languages = ['en', 'fa', 'tg', 'mixed'] as const;

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
	let overrideEditorFileId = $state(0);
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

	let fileOverrides =
		$state<Record<number, { language?: string; classificationType?: string; tags?: string; notes?: string }>>({});
	let isSubmitting = $state(false);
	let submitError = $state('');
	let addFilesError = $state('');
	let removingIds = $state<number[]>([]);
	let hydratedFromServer = $state(false);
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

	const itemKindToMediaType = (
		itemKind: 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other'
	): BatchMediaType | null => {
		if (itemKind === 'photo') return 'image';
		if (itemKind === 'audio') return 'audio';
		if (itemKind === 'video') return 'video';
		if (itemKind === 'scanned_document' || itemKind === 'document') return 'document';
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
		} else {
			selectedIds = [...selectedIds, id];
		}
	};

	const setActiveFile = (id: number) => {
		activeFileId = id;
		selectedIds = [id];
	};

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
		}

		if (!activeFileId && accepted.length) {
			setActiveFile(accepted[0].id);
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

		for (const file of accepted) {
			void uploadAndCommitFile(file.id);
		}

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
		selectedIds = selectedIds.filter((selected) => selected !== id);

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

	const hasFileOverride = (fileId: number): boolean => typeof fileOverrides[fileId] !== 'undefined';

	const clearFileOverride = (fileId: number) => {
		if (!hasFileOverride(fileId)) return;
		const rest = { ...fileOverrides };
		delete rest[fileId];
		fileOverrides = rest;
	};

	const createFileOverride = (fileId: number) => {
		if (!hasFileOverride(fileId)) {
			fileOverrides = {
				...fileOverrides,
				[fileId]: {}
			};
		}
		overrideEditorFileId = fileId;
		setActiveFile(fileId);
	};

	const openFileOverrideEditor = (fileId: number) => {
		if (!hasFileOverride(fileId)) {
			createFileOverride(fileId);
			return;
		}
		overrideEditorFileId = fileId;
		setActiveFile(fileId);
	};

	const updateFileOverrides = (fileId: number, patch: Record<string, string>) => {
		if (!hasFileOverride(fileId)) {
			createFileOverride(fileId);
		}

		fileOverrides = {
			...fileOverrides,
			[fileId]: {
				...fileOverrides[fileId],
				...patch
			}
		};
	};

	const getEffectiveValue = (
		fileId: number,
		key: 'language' | 'classificationType'
	): string | undefined => {
		const override = fileOverrides[fileId]?.[key];
		if (override && override.trim().length > 0) {
			return override;
		}
		const batchValue = batchDefaults[key];
		if (batchValue && batchValue.trim().length > 0) {
			return batchValue;
		}
		return undefined;
	};

	const isReady = () =>
		files.length > 0 &&
		files.every(
			(file) =>
				Boolean(getEffectiveValue(file.id, 'language')) &&
				Boolean(getEffectiveValue(file.id, 'classificationType'))
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

	const missingSummaries = () =>
		files
			.map((file) => ({ file, missing: getMissingFields(file.id) }))
			.filter((entry) => entry.missing.length > 0);

	const missingCount = () => missingSummaries().length;
	const objectCount = () => files.length;

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

			clearFileOverride(id);
			if (overrideEditorFileId === id) {
				overrideEditorFileId = 0;
			}
		} catch {
			restoreLocalFile(snapshot);
			setFileUploadError(id, t('ingestionSetup.files.removeFailed'));
		} finally {
			removingIds = removingIds.filter((value) => value !== id);
		}
	};

	const uploadAndCommitFile = async (fileId: number): Promise<void> => {
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
		}
	};

	const retryUpload = (fileId: number) => {
		submitError = '';
		const file = findFile(fileId);
		if (!file || file.source !== 'local') {
			return;
		}
		void uploadAndCommitFile(fileId);
	};

	const hasPendingUploads = () =>
		files.some((file) => file.status === 'queued' || file.status === 'processing');
	const hasUploadFailures = () => files.some((file) => file.status === 'failed');
	const hasCommittedFiles = () => files.some((file) => file.status === 'approved');
	const canStartIngestion = () =>
		isReady() && hasCommittedFiles() && !hasPendingUploads() && !hasUploadFailures() && !isSubmitting;

	const startIngestion = async () => {
		if (!canStartIngestion()) return;

		isSubmitting = true;
		submitError = '';

		try {
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

<main
	class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10"
	ondragenter={handleGlobalDragEnter}
	ondragleave={handleGlobalDragLeave}
	ondrop={handleGlobalDrop}
>
	<section class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.header.kicker')}</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">{t('ingestionSetup.header.title')}</h2>
			<p class="mt-2 text-sm text-text-muted">
				{format(t('ingestionSetup.header.subtitle'), { batchId })}
			</p>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
		<div class="space-y-5">
			<div
				class={`relative rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
					isDragging || isGlobalDragging
						? 'border-blue-slate bg-pearl-beige/70 shadow-[0_0_0_4px_rgba(79,109,122,0.25)]'
						: 'border-border-soft bg-pearl-beige/60'
				}`}
				ondragenter={handleDragEnter}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.dropzone.label')}</p>
				<p class="mt-3 font-display text-xl text-text-ink">
					{isDragging || isGlobalDragging
						? t('ingestionSetup.dropzone.headlineDragging')
						: t('ingestionSetup.dropzone.headline')}
				</p>
				<p class="mt-2 text-xs text-text-muted">
					{isDragging || isGlobalDragging
						? t('ingestionSetup.dropzone.supportDragging')
						: t('ingestionSetup.dropzone.support')}
				</p>
				<p class="mt-2 text-sm text-text-muted">{t('ingestionSetup.dropzone.details')}</p>
				<p class="mt-2 text-[11px] uppercase tracking-[0.16em] text-text-muted">
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
				<button
					onclick={() => fileInput?.click()}
					class="mt-5 rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
				>
					{t('ingestionSetup.dropzone.browse')}
				</button>
				<input
					bind:this={fileInput}
					type="file"
					multiple
					class="hidden"
					onchange={handleFileInput}
				/>
			</div>

			<div class="rounded-2xl border border-border-soft bg-surface-white">
				<div class="border-b border-border-soft px-6 py-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.files.title')}</p>
							<p class="mt-1 text-sm text-text-muted">{t('ingestionSetup.files.subtitle')}</p>
							{#if batchMediaType}
								<p class="mt-2 inline-flex rounded-full border border-blue-slate/40 bg-pale-sky/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate">
									{format(t('ingestionSetup.files.batchType'), {
										mediaType: mediaTypeLabel(batchMediaType)
									})}
								</p>
							{/if}
						</div>
						<div class="text-xs text-text-muted">
							{format(t('ingestionSetup.files.selectedCount'), { count: selectedIds.length })}
						</div>
					</div>
					{#if addFilesError}
						<p class="mt-3 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
							{addFilesError}
						</p>
					{/if}
				</div>
				{#if files.length === 0}
					<div class="px-6 py-8 text-center text-sm text-text-muted">
						{t('ingestionSetup.files.empty')}
					</div>
				{:else}
					<div class="divide-y divide-border-soft">
						{#each files as file (file.id)}
							<div>
								<div
									class={`flex flex-wrap items-center justify-between gap-4 px-6 py-4 ${
										file.id === activeFileId ? 'bg-pale-sky/12' : ''
									}`}
									onclick={() => setActiveFile(file.id)}
								>
									<label class="flex items-start gap-3">
										<input
											type="checkbox"
											class="mt-1 h-4 w-4 rounded border-border-soft text-blue-slate"
											checked={selectedIds.includes(file.id)}
											onclick={(event) => event.stopPropagation()}
											onchange={() => toggleSelection(file.id)}
										/>
										<div>
											<p class="text-sm font-medium text-text-ink">{file.name}</p>
											<p class="mt-1 text-xs text-text-muted">
												{t(`ingestionSetup.fileTypes.${file.type}`)} · {file.size}
											</p>
											{#if file.uploadError}
												<p class="mt-1 text-xs text-burnt-peach">{file.uploadError}</p>
											{/if}
										</div>
									</label>
									<div class="flex flex-wrap items-center justify-end gap-2">
										{#if file.status === 'failed' && file.source === 'local'}
											<button
												class="text-xs uppercase tracking-[0.2em] text-burnt-peach"
												disabled={removingIds.includes(file.id)}
												onclick={(event) => {
													event.stopPropagation();
													retryUpload(file.id);
												}}
											>
												{t('ingestionSetup.files.retryUpload')}
											</button>
										{/if}
										{#if hasFileOverride(file.id)}
											<button
												type="button"
												class="text-xs uppercase tracking-[0.2em] text-blue-slate"
												onclick={(event) => {
													event.stopPropagation();
													openFileOverrideEditor(file.id);
												}}
											>
												{t('ingestionSetup.files.editOverride')}
											</button>
											<button
												type="button"
												class="text-xs uppercase tracking-[0.2em] text-blue-slate"
												onclick={(event) => {
													event.stopPropagation();
													clearFileOverride(file.id);
													if (overrideEditorFileId === file.id) {
														overrideEditorFileId = 0;
													}
												}}
											>
												{t('ingestionSetup.files.removeOverride')}
											</button>
										{:else}
											<button
												type="button"
												class="text-xs uppercase tracking-[0.2em] text-blue-slate"
												onclick={(event) => {
													event.stopPropagation();
													createFileOverride(file.id);
												}}
											>
												{t('ingestionSetup.files.createOverride')}
											</button>
										{/if}
										<button
											class="text-xs uppercase tracking-[0.2em] text-blue-slate"
											disabled={removingIds.includes(file.id)}
											onclick={(event) => {
												event.stopPropagation();
												void removeFile(file.id);
											}}
										>
											{#if removingIds.includes(file.id)}
												{t('ingestionSetup.files.removing')}
											{:else if file.status === 'processing' && file.source === 'local'}
												{t('ingestionSetup.files.cancelUpload')}
											{:else}
												{t('common.remove')}
											{/if}
										</button>
										<StatusBadge status={file.status} label={statusLabel(file.status)} />
									</div>
								</div>
								{#if hasFileOverride(file.id) && overrideEditorFileId === file.id}
									<div class="border-t border-border-soft bg-pale-sky/10 px-6 py-4">
										<div class="flex items-center justify-between gap-3">
											<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">
												{format(t('ingestionSetup.overrides.editorTitle'), { fileName: file.name })}
											</p>
											<button
												type="button"
												class="text-xs uppercase tracking-[0.2em] text-blue-slate"
												onclick={(event) => {
													event.stopPropagation();
													overrideEditorFileId = 0;
												}}
											>
												{t('common.close')}
											</button>
										</div>
										<div class="mt-3 grid gap-3 md:grid-cols-2">
											<div>
												<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
													{t('ingestionSetup.overrides.language')}
												</label>
												<select
													class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
													value={fileOverrides[file.id]?.language ?? ''}
													onchange={(event) => updateFileOverrides(file.id, { language: event.currentTarget.value })}
												>
													<option value="">{t('ingestionSetup.overrides.useBatchDefault')}</option>
													{#each languages as language (language)}
														<option value={language}>{t(`ingestionSetup.languages.${language}`)}</option>
													{/each}
												</select>
											</div>
											<div>
												<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
													{t('ingestionSetup.overrides.classificationType')}
												</label>
												<select
													class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
													value={fileOverrides[file.id]?.classificationType ?? ''}
													onchange={(event) =>
														updateFileOverrides(file.id, { classificationType: event.currentTarget.value })}
												>
													<option value="">{t('ingestionSetup.overrides.useBatchDefault')}</option>
													{#each classificationTypes as type (type)}
														<option value={type}>{t(`ingestionSetup.classificationTypes.${type}`)}</option>
													{/each}
												</select>
											</div>
											<div>
												<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
													{t('ingestionSetup.overrides.tags')}
												</label>
												<input
													class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
													placeholder={t('ingestionSetup.overrides.tagsPlaceholder')}
													value={fileOverrides[file.id]?.tags ?? ''}
													oninput={(event) => updateFileOverrides(file.id, { tags: event.currentTarget.value })}
												/>
											</div>
											<div class="md:col-span-2">
												<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
													{t('ingestionSetup.overrides.notes')}
												</label>
												<textarea
													rows="3"
													class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
													placeholder={t('ingestionSetup.overrides.notesPlaceholder')}
													value={fileOverrides[file.id]?.notes ?? ''}
													oninput={(event) => updateFileOverrides(file.id, { notes: event.currentTarget.value })}
												></textarea>
											</div>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

		</div>

		<aside class="space-y-5">
			<div class="rounded-2xl border border-border-strong bg-blue-slate-deep px-6 py-6 text-pale-sky">
				<p class="text-xs uppercase tracking-[0.2em] text-burnt-peach">{t('ingestionSetup.batchIntent.title')}</p>
				<p class="mt-2 text-sm text-pale-sky">{t('ingestionSetup.batchIntent.description')}</p>
				<p class="mt-3 text-[11px] uppercase tracking-[0.16em] text-pale-sky/80">
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
					<p class="mt-3 rounded-xl border border-burnt-peach/45 bg-pearl-beige/20 px-3 py-2 text-xs text-burnt-peach">
						{metadataSaveError}
					</p>
				{/if}
				<div class="mt-4 text-sm">
					<details open class="py-2">
						<summary class="cursor-pointer text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.sections.coreMetadata')}
						</summary>
						<div class="mt-3 grid gap-3 md:grid-cols-2">
							<div class="md:col-span-2">
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.titleLabel')}</label>
								<input
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
									value={batchDefaults.title}
									oninput={(event) => {
										batchDefaults.title = event.currentTarget.value;
										queueBatchMetadataSave();
									}}
								/>
							</div>
							<div>
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.language')}</label>
								<select
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.itemKind')}</label>
								<select
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.classificationType')}</label>
								<select
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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
								<p class="mt-1 text-[11px] text-pale-sky/75">
									{#if batchDefaults.itemKind === 'document' || batchDefaults.itemKind === 'scanned_document'}
										{t('ingestionSetup.batchIntent.classificationHintDocument')}
									{:else}
										{t('ingestionSetup.batchIntent.classificationHintAuto')}
									{/if}
								</p>
							</div>
						</div>
					</details>

					<details class="border-t border-pale-sky/20 py-3">
						<summary class="cursor-pointer text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.sections.summaryContext')}
						</summary>
						<div class="mt-3 space-y-3">
							<div>
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.tags')}</label>
								<div class="mt-2 flex items-center gap-2">
									<input
										class="w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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
										class="rounded-full border border-pale-sky/40 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-pale-sky"
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
												class="rounded-full border border-pale-sky/35 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-pale-sky"
											>
												{tag} ×
											</button>
										{/each}
									</div>
								{/if}
							</div>
							<div>
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.summary')}</label>
								<textarea
									rows="2"
									class="mt-2 w-full resize-none rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
									value={batchDefaults.summaryText}
									oninput={(event) => {
										batchDefaults.summaryText = event.currentTarget.value;
										queueBatchMetadataSave();
									}}
								></textarea>
							</div>
						</div>
					</details>

					<details open class="border-t border-pale-sky/20 py-3">
						<summary class="cursor-pointer text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.sections.dates')}
						</summary>
						<p class="mt-2 text-[11px] text-pale-sky/80">{t('ingestionSetup.batchIntent.dateHint')}</p>
						<div class="mt-3 space-y-4">
							{#each summaryDateSections as section, index (section.key)}
								{@const editor = summaryDateEditors[section.key]}
								<div class={index === 0 ? 'space-y-2' : 'space-y-2 border-t border-pale-sky/20 pt-4'}>
									<p class="text-xs uppercase tracking-[0.18em] text-pale-sky">{t(section.labelKey)}</p>
									<div class="grid gap-2 md:grid-cols-2">
										<select
											class="rounded-xl border border-pale-sky/35 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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
											<div class="px-1 py-2 text-xs text-pale-sky/75">{t('ingestionSetup.batchIntent.noDateSelected')}</div>
										{:else if editor.precision === 'year'}
											<input
												type="number"
												min="1000"
												max="2999"
												placeholder={t('ingestionSetup.batchIntent.yearPlaceholder')}
												class="rounded-xl border border-pale-sky/35 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
												value={editor.year}
												oninput={(event) => updateSummaryDateValue(section.key, event.currentTarget.value)}
											/>
										{:else if editor.precision === 'month'}
											<input
												type="month"
												class="rounded-xl border border-pale-sky/35 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
												value={editor.month}
												onchange={(event) => updateSummaryDateValue(section.key, event.currentTarget.value)}
											/>
										{:else}
											<input
												type="date"
												class="rounded-xl border border-pale-sky/35 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
												value={editor.day}
												onchange={(event) => updateSummaryDateValue(section.key, event.currentTarget.value)}
											/>
										{/if}
									</div>
									{#if editor.precision !== 'none'}
										<div class="grid gap-2 md:grid-cols-3">
											<select
												class="rounded-xl border border-pale-sky/35 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
												value={editor.confidence}
												onchange={(event) =>
													updateSummaryDateConfidence(section.key, event.currentTarget.value as 'low' | 'medium' | 'high')}
											>
												<option value="low">{t('ingestionSetup.batchIntent.confidenceLow')}</option>
												<option value="medium">{t('ingestionSetup.batchIntent.confidenceMedium')}</option>
												<option value="high">{t('ingestionSetup.batchIntent.confidenceHigh')}</option>
											</select>
											<label class="flex items-center gap-2 rounded-xl border border-pale-sky/25 px-3 py-2 text-xs text-pale-sky">
												<input
													type="checkbox"
													checked={editor.approximate}
													onchange={(event) => updateSummaryDateApproximate(section.key, event.currentTarget.checked)}
												/>
												{t('ingestionSetup.batchIntent.approximateDate')}
											</label>
											<input
												class="rounded-xl border border-pale-sky/35 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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

					<details class="border-t border-pale-sky/20 py-3">
						<summary class="cursor-pointer text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.sections.accessPolicy')}
						</summary>
						<div class="mt-3 grid gap-3 md:grid-cols-2">
							<div>
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.pipelinePreset')}</label>
								<select
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.accessLevel')}</label>
								<select
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.embargoUntil')}</label>
								<input
									type="datetime-local"
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
									value={batchDefaults.embargoUntil}
									onchange={(event) => {
										batchDefaults.embargoUntil = event.currentTarget.value;
										queueBatchMetadataSave();
									}}
								/>
							</div>
							<div>
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.rightsNote')}</label>
								<input
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
									value={batchDefaults.rightsNote}
									oninput={(event) => {
										batchDefaults.rightsNote = event.currentTarget.value;
										queueBatchMetadataSave();
									}}
								/>
							</div>
							<div class="md:col-span-2">
								<label class="text-xs uppercase tracking-[0.2em] text-pale-sky">{t('ingestionSetup.batchIntent.sensitivityNote')}</label>
								<input
									class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
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
		</aside>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="space-y-2">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.readiness.title')}</p>
				<p class="text-sm text-text-muted">
					{canStartIngestion()
						? t('ingestionSetup.readiness.ready')
						: hasPendingUploads()
							? t('ingestionSetup.readiness.uploading')
							: hasUploadFailures()
								? t('ingestionSetup.readiness.uploadFailed')
								: t('ingestionSetup.readiness.missing')}
				</p>
				{#if !isReady()}
					<div class="rounded-xl border border-border-soft bg-pale-sky/15 px-4 py-3 text-xs text-text-muted">
						<p>{format(t('ingestionSetup.readiness.missingCount'), { count: missingCount() })}</p>
						<ul class="mt-2 space-y-1">
							{#each missingSummaries() as entry (entry.file.id)}
								<li>
									<span class="text-text-ink">{entry.file.name}</span>
									· {entry.missing.join(', ')}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
			{#if submitError}
				<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
					{submitError}
				</p>
			{/if}
			<button
				disabled={!canStartIngestion()}
				onclick={() => (showConfirm = true)}
				class={`rounded-full px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white ${
					canStartIngestion() ? 'bg-blue-slate' : 'bg-blue-slate/40 text-surface-white/70'
				}`}
			>
				{t('common.startIngestion')}
			</button>
		</div>
	</section>

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
					<p><span class="text-text-ink">{t('ingestionSetup.confirmation.objects')}</span> · {objectCount()}</p>
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
						disabled={!canStartIngestion()}
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
</main>
