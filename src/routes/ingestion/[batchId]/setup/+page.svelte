<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { IngestionCapabilities, IngestionMediaKind } from '$lib/services/ingestionCapabilities';
	import type { IngestionDetailFile } from '$lib/services/ingestionDetail';
	import type { FileStatus } from '$lib/types';
	import { translations, type LocaleKey } from '$lib/i18n/translations';
	import { SvelteMap } from 'svelte/reactivity';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let {
		data
	} = $props<{
		data: {
			batchId: string;
			capabilities: IngestionCapabilities;
			existingFiles: IngestionDetailFile[];
			metadata: {
				documentType: string;
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

	const batchId = data.batchId;
	const capabilities = data.capabilities;
	let locale = $state<LocaleKey>('en');
	const dictionary = $derived(translations[locale]);

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
		'photo',
		'letter',
		'speech',
		'interview',
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

	const summaryClassification = readSummaryClassification(data.metadata.summary);

	let batchDefaults = $state({
		title: readSummaryTitle(data.metadata.summary, batchId),
		language: data.metadata.languageCode || 'en',
		classificationType: data.metadata.documentType || 'document',
		classificationSummary: summaryClassification.text,
		pipelinePreset: data.metadata.pipelinePreset || 'auto',
		accessLevel: data.metadata.accessLevel,
		embargoUntil: toInputDateTime(data.metadata.embargoUntil),
		rightsNote: data.metadata.rightsNote ?? '',
		sensitivityNote: data.metadata.sensitivityNote ?? ''
	});
	let summaryTags = $state<string[]>(summaryClassification.tags);
	let summaryTagInput = $state('');

	let fileOverrides =
		$state<Record<number, { language?: string; classificationType?: string; tags?: string; notes?: string }>>({});
	let isSubmitting = $state(false);
	let submitError = $state('');
	let addFilesError = $state('');
	let removingIds = $state<number[]>([]);
	let hydratedFromServer = $state(false);

	const batchMediaType = $derived<BatchMediaType | null>(files[0]?.mediaType ?? null);
	const uploadControllers = new SvelteMap<number, AbortController>();


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

	const mediaKinds = capabilities.mediaKinds;
	const extensionsByKind = capabilities.extensionsByKind;
	const mimeByKind = capabilities.mimeByKind;
	const mimeAliases = capabilities.mimeAliases;

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

		if (!data.existingFiles.length) return;

		const mappedFiles: LocalIngestionFile[] = data.existingFiles.map((file: IngestionDetailFile, index: number) => {
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

		let lockedType: BatchMediaType | null = files[0]?.mediaType ?? null;
		const accepted: LocalIngestionFile[] = [];
		const mixedMediaNames: string[] = [];
		const unsupportedNames: string[] = [];

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

	const updateFileOverrides = (fileId: number, patch: Record<string, string>) => {
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

	const setupEndpoint = resolve(`/ingestion/${batchId}/setup`);
	const metadataEndpoint = resolve(`/ingestion/${batchId}/metadata`);
	const fileDeleteEndpoint = (backendFileId: string) =>
		resolve(`/ingestion/${batchId}/files/${encodeURIComponent(backendFileId)}`);
	let metadataSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let metadataSaveError = $state('');

	const saveBatchMetadata = async () => {
		const summaryText = batchDefaults.classificationSummary.trim();
		const embargoIso = batchDefaults.embargoUntil
			? new Date(batchDefaults.embargoUntil).toISOString()
			: null;
		const batchLabel = batchDefaults.title.trim() || batchId;
		const payload = {
			batchLabel,
			documentType: batchDefaults.classificationType,
			languageCode: batchDefaults.language,
			pipelinePreset: batchDefaults.pipelinePreset,
			accessLevel: batchDefaults.accessLevel,
			embargoUntil: embargoIso,
			rightsNote: batchDefaults.rightsNote || null,
			sensitivityNote: batchDefaults.sensitivityNote || null,
			summary: {
				title: {
					primary: batchLabel,
					original_script: null,
					translations: []
				},
				classification: {
					tags: summaryTags,
					summary: summaryText.length > 0 ? summaryText : null
				},
				dates: {
					published: {
						value: null,
						approximate: false,
						confidence: 'medium',
						note: null
					},
					created: {
						value: null,
						approximate: false,
						confidence: 'medium',
						note: null
					}
				}
			}
		};

		const response = await fetch(metadataEndpoint, {
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
		if (metadataSaveTimer) {
			clearTimeout(metadataSaveTimer);
		}

		metadataSaveTimer = setTimeout(async () => {
			try {
				await saveBatchMetadata();
			} catch (error) {
				metadataSaveError = error instanceof Error ? error.message : 'Failed to update ingestion defaults.';
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
		fetch(setupEndpoint, {
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
								<div class="flex items-center gap-3">
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
						{/each}
					</div>
				{/if}
			</div>

		</div>

		<aside class="space-y-5">
			<div class="rounded-2xl border border-border-strong bg-blue-slate-deep px-6 py-6 text-pale-sky">
				<p class="text-xs uppercase tracking-[0.2em] text-burnt-peach">{t('ingestionSetup.batchIntent.title')}</p>
				<p class="mt-2 text-sm text-pale-sky">{t('ingestionSetup.batchIntent.description')}</p>
				{#if metadataSaveError}
					<p class="mt-3 rounded-xl border border-burnt-peach/45 bg-pearl-beige/20 px-3 py-2 text-xs text-burnt-peach">
						{metadataSaveError}
					</p>
				{/if}
				<div class="mt-4 space-y-3 text-sm">
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Title</label>
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
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.language')}
						</label>
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
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.classificationType')}
						</label>
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
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.tags')}
						</label>
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
								Add
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
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Summary</label>
						<textarea
							rows="2"
							class="mt-2 w-full resize-none rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
							value={batchDefaults.classificationSummary}
							oninput={(event) => {
								batchDefaults.classificationSummary = event.currentTarget.value;
								queueBatchMetadataSave();
							}}
						></textarea>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.pipelinePreset')}
						</label>
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
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Access level</label>
						<select
							class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
							value={batchDefaults.accessLevel}
							onchange={(event) => {
								batchDefaults.accessLevel = event.currentTarget.value as 'private' | 'family' | 'public';
								queueBatchMetadataSave();
							}}
						>
							<option value="private">Private</option>
							<option value="family">Family</option>
							<option value="public">Public</option>
						</select>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Embargo until</label>
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
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Rights note</label>
						<input
							class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
							value={batchDefaults.rightsNote}
							oninput={(event) => {
								batchDefaults.rightsNote = event.currentTarget.value;
								queueBatchMetadataSave();
							}}
						/>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Sensitivity note</label>
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
			</div>


			<div class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.overrides.title')}</p>
				<p class="mt-2 text-sm text-text-muted">{t('ingestionSetup.overrides.subtitle')}</p>
				{#if activeFileId === 0}
					<div class="mt-4 rounded-xl border border-border-soft bg-pale-sky/15 px-4 py-3 text-sm text-text-muted">
						<p class="text-sm text-text-ink">{t('ingestionSetup.overrides.emptyTitle')}</p>
						<p class="mt-1 text-xs text-text-muted">{t('ingestionSetup.overrides.emptyBody')}</p>
					</div>
				{:else}
					<div class="mt-4 space-y-3 text-sm">
						<div>
							<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
								{t('ingestionSetup.overrides.language')}
							</label>
							<select
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={fileOverrides[activeFileId]?.language ?? ''}
								onchange={(event) => updateFileOverrides(activeFileId, { language: event.currentTarget.value })}
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
								value={fileOverrides[activeFileId]?.classificationType ?? ''}
								onchange={(event) => updateFileOverrides(activeFileId, { classificationType: event.currentTarget.value })}
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
								value={fileOverrides[activeFileId]?.tags ?? ''}
								oninput={(event) => updateFileOverrides(activeFileId, { tags: event.currentTarget.value })}
							/>
						</div>
						<div>
							<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
								{t('ingestionSetup.overrides.notes')}
							</label>
							<textarea
								rows="3"
								class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								placeholder={t('ingestionSetup.overrides.notesPlaceholder')}
								value={fileOverrides[activeFileId]?.notes ?? ''}
								oninput={(event) => updateFileOverrides(activeFileId, { notes: event.currentTarget.value })}
							></textarea>
						</div>
					</div>
				{/if}
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
						{isSubmitting ? 'Submitting...' : t('common.confirmStart')}
					</button>
				</div>
			</div>
		</div>
	{/if}
</main>
