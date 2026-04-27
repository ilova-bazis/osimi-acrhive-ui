export const translations = {
	en: {
		app: {
			title: 'Batch Ingestion',
			subtitle: 'Human intent first. Machines assist, people decide.',
			session: 'Session'
		},
		header: {
			library: 'Osimi Digital Library',
			textSize: 'Text size',
			locale: 'UI',
			signOut: 'Sign out',
			nav: {
				dashboard: 'Dashboard',
				ingestion: 'Ingestion',
				objects: 'Objects'
			}
		},
		dropzone: {
			label: 'Dropzone',
			headline: 'Drag files here or click to browse',
			support: 'Images, PDFs, audio, video, and archives. No upload until review.',
			badgeOne: 'Creates local staging batch',
			badgeTwo: 'Supports batch defaults'
		},
		legend: {
			title: 'Status Legend',
			subtitle: 'Only one attention color. Text always explains state.',
			count: '8 states'
		},
		files: {
			title: 'Files',
			subtitle: 'Select a file to preview overrides and human context.'
		},
		intent: {
			title: 'Batch Intent',
			description: 'Scanned newspaper issues from 1971. Human notes drive all pipelines.',
			language: 'Primary language',
			category: 'Content category',
			preset: 'Pipeline preset',
			visibility: 'Visibility',
			tags: 'Tags'
		},
		overrides: {
			title: 'Per-file Overrides',
			subtitle: 'Overrides for the selected file take precedence over batch defaults.',
			language: 'Language',
			documentType: 'Document type',
			note: 'Note: Page 1 has hand annotations. Preserve margins during OCR.',
			badgeOne: 'Layout OCR',
			badgeTwo: 'Image tagging',
			badgeThree: 'Needs human review'
		},
		common: {
			cancel: 'Cancel',
			confirm: 'Confirm',
			confirmStart: 'Confirm & start',
			close: 'Close',
			remove: 'Remove',
			startIngestion: 'Start ingestion'
		},
		dashboard: {
			title: 'Dashboard',
			welcome: 'Welcome back, {name}',
			ingestion: 'Ingestion',
			metrics: {
				activeBatches: 'Active batches',
				activeBatchesHint: 'Currently in processing or review.',
				needsReview: 'Needs review',
				needsReviewHint: 'Human confirmation required before publish.',
				pendingUploads: 'Pending uploads',
				pendingUploadsHint: 'Staged items awaiting batch assignment.'
			},
			recentActivity: 'Recent activity',
			lastDays: 'Last 7 days',
			intentTitle: 'Human intent checkpoint',
			intentBody:
				'Every ingestion begins with declared intent and ends with human review. Keep batches scoped and deliberate.'
		},
		login: {
			library: 'Osimi Digital Library',
			title: 'Authorized Access',
			description:
				'This interface is reserved for authorized archivists. Sign in to continue the ingestion workflow.',
			authHint:
				'Authentication is handled by the backend. Use your assigned credentials to continue.',
			signIn: 'Sign in',
			continue: 'Continue to ingestion',
			demoHint: 'Use one of the demo accounts to test roles.',
			username: 'Username',
			password: 'Password',
			signingIn: 'Signing in...',
			byContinuing:
				'By continuing, you confirm that this session will handle sensitive archival material.'
		},
		ingestionOverview: {
			title: 'Ingestion',
			newIngestion: 'New ingestion',
			emptyKicker: 'No ingestions yet',
			emptyTitle: 'Start your first ingestion',
			emptyBody: 'Ingestion happens in batches. Create your first batch to begin the workflow.',
			stats: {
				totalBatches: 'Total batches',
				totalBatchesHint: 'All batches tracked.',
				objectsCreated: 'Objects created',
				objectsCreatedHint: 'Items from ingestions.',
				inProgress: 'In progress',
				inProgressHint: 'Pipelines running.',
				needsAttention: 'Failed / attention',
				needsAttentionHint: 'Needs action.'
			},
			sections: {
				activeRecent: 'Active & recent batches',
				activeRecentHint: 'Track ongoing and completed ingestions.',
				drafts: 'Draft and pending batches',
				draftsHint: 'Manage drafts, uploads, and canceled ingestions.'
			},
			table: {
				batch: 'Batch',
				created: 'Created',
				progress: 'Progress',
				action: 'Action',
				objects: '{completed} / {total} objects'
			},
			actions: {
				view: 'View',
				resume: 'Resume',
				retry: 'Retry',
				cancel: 'Cancel',
				restore: 'Restore',
				delete: 'Delete',
				working: 'Working...',
				menu: 'Actions'
			},
			statuses: {
				draft: 'Draft',
				uploading: 'Uploading',
				queued: 'Queued',
				ingesting: 'Ingesting',
				completed: 'Completed',
				failed: 'Failed',
				canceled: 'Canceled'
			},
			errors: {
				deleteConflict: 'Only draft, uploading, or canceled ingestions can be deleted.',
				failedNamed: 'Failed to {action} ingestion {name}.',
				failed: 'Failed to {action} ingestion.'
			},
			pagination: {
				prev: '← Prev',
				next: 'Next →'
			}
		},
		ingestionDetail: {
			title: 'Ingestion details',
			back: 'Back to ingestion',
			metrics: {
				status: 'Status',
				created: 'Created',
				updated: 'Updated',
				progress: 'Progress'
			},
			files: {
				title: 'Files',
				subtitle: 'Files currently registered in this ingestion batch.',
				empty: 'No files found for this ingestion.',
				headers: {
					file: 'File',
					status: 'Status',
					type: 'Type',
					size: 'Size',
					created: 'Created'
				}
			},
			logs: {
				title: 'Activity log',
				subtitle: 'Events scoped to this ingestion',
				empty: 'No activity events found for this ingestion yet.',
				eventType: 'Event type',
				objectId: 'Object',
				actor: 'Actor',
				payload: 'View payload'
			},
			actions: {
				resume: 'Resume',
				retry: 'Retry',
				cancel: 'Cancel',
				restore: 'Restore',
				delete: 'Delete',
				working: 'Working...',
				menu: 'Actions',
				confirmTitle: 'Confirm action'
			},
			messages: {
				unknown: 'Unknown',
				actionFailed: 'Action failed.',
				delete: 'Delete this ingestion? This action cannot be undone.',
				cancel: 'Cancel this ingestion? You can restore it later while processing has not started.',
				retry: 'Retry this ingestion now?',
				restore: 'Restore this canceled ingestion?'
			},
			errors: {
				failed: 'Failed to {action} ingestion.'
			}
		},
		ingestionNew: {
			title: 'Create new ingestion',
			description:
				'Start with archival defaults, then refine in setup. If you leave core fields unchanged, we use recommended values automatically.',
			defaults: 'Defaults: Language `en` · Pipeline `auto` · Access `private`',
			fields: {
				batchLabel: 'Batch label',
				batchLabelPlaceholder: 'Optional - defaults to Untitled ingestion <timestamp>',
				itemKind: 'Item kind',
				classificationType: 'Classification type',
				classificationHintDocument: 'Required for document and scanned document batches.',
				classificationHintAuto: 'Auto-defaulted from item kind; you can refine it later in setup.',
				classificationUpdatedByKind: '↳ Updated to match item kind',
				languageCode: 'Language code',
				pipelinePreset: 'Pipeline preset',
				pipelineHints: {
					auto: 'Selects pipelines automatically based on item kind',
					none: 'No processing pipelines will run',
					ocr_text: 'Runs OCR to extract text from document images',
					audio_transcript: 'Transcribes spoken audio to text',
					video_transcript: 'Transcribes spoken audio from video to text',
					ocr_and_audio_transcript: 'Runs OCR and audio transcription',
					ocr_and_video_transcript: 'Runs OCR and video transcription'
				},
				accessLevel: 'Access level',
				embargoUntil: 'Embargo until',
				rightsNote: 'Rights note',
				sensitivityNote: 'Sensitivity note'
			},
			policyNotes: 'Policy and notes',
			summary: {
				title: 'Summary metadata',
				subtitle: 'These fields populate ingestion summary context and can be refined in setup.',
				tags: 'Tags',
				tagsPlaceholder: 'Type tag and press Add',
				add: 'Add',
				summaryText: 'Summary text',
				summaryPlaceholder: 'Short contextual summary for classification metadata'
			},
			continue: 'Continue to setup',
			creating: 'Creating…',
			cancel: 'Cancel'
		},
		objects: {
			header: {
				title: 'Objects',
				subtitle: 'Archive object catalog with access and availability states.',
				matching: '{filtered} matching objects · {total} total',
				bulkActions: 'Bulk actions',
				selectVisible: 'Select visible',
				clearSelection: 'Clear selection',
				copySelectionIds: 'Copy selected IDs',
				copiedSelection: 'Copied IDs',
				selectionState: '{selected} selected from {visible} visible'
			},
			filters: {
				searchPlaceholder: 'Search title, object id, OCR...',
				search: 'Search',
				hint: 'Press Enter to search. Availability, access, and sort apply immediately.',
				availability: 'Availability',
				access: 'Access',
				sort: 'Sort',
				all: 'All',
				moreFilters: 'More filters',
				clearFilters: 'Clear filters',
				noActiveFilters: 'No active filters',
				closeFilters: 'Close filters',
				drawerTitle: 'Filters',
				drawerSubtitle: 'Refine objects ({count} active)',
				drawerHint:
					'Use this panel for detailed filters. Quick filters above apply instantly; this form applies as a batch.',
				type: 'Type',
				anyType: 'Any type',
				typeHint: 'Uses backend enum values.',
				language: 'Language',
				anyLanguage: 'Any language',
				languageHint: 'Choose a common language code used in object metadata.',
				batchLabel: 'Batch label',
				tag: 'Tag',
				datePresets: 'Date presets',
				last24h: 'Last 24h',
				last7d: 'Last 7d',
				last30d: 'Last 30d',
				thisMonth: 'This month',
				from: 'From',
				to: 'To',
				invalidRange: 'Invalid range: start date must be earlier than end date.',
				limit: 'Limit',
				reset: 'Reset',
				applyFilters: 'Apply filters',
				batchPlaceholder: 'batch-2026',
				tagPlaceholder: 'tag',
				moreSelected: 'more'
			},
			recent: {
				title: 'Recently ingested',
				subtitle: 'Quick access to recent work',
				lastCount: 'Last {count} objects',
				restricted: 'Restricted',
				untitled: 'Untitled - {suffix}'
			},
			table: {
				headers: {
					preview: 'Preview',
					title: 'Title',
					type: 'Type',
					processing: 'Processing',
					indicators: 'Indicators',
					access: 'Access',
					updated: 'Updated',
					batch: 'Batch',
					actions: 'Actions'
				},
				emptyFiltered: 'No objects match current filters.',
				empty: 'No objects available for this tenant yet.',
				rowActions: 'Row actions',
				open: 'Open',
				copyId: 'Copy ID',
				copied: 'Copied',
				batchLink: 'Batch',
				showing: 'Showing {rows} of {filtered} (total {total})',
				firstPage: 'First page',
				next: 'Next',
				noMore: 'No more',
				untitled: 'Untitled - {suffix}',
				reasons: {
					OK: 'Available to download',
					FORBIDDEN_POLICY: 'Access restricted by policy',
					EMBARGO_ACTIVE: 'Embargo currently active',
					RESTORE_REQUIRED: 'Restore required before download',
					RESTORE_IN_PROGRESS: 'Restore in progress',
					TEMP_UNAVAILABLE: 'Temporarily unavailable'
				},
				reasonActions: {
					RESTORE_REQUIRED: 'Request restore',
					FORBIDDEN_POLICY: 'Request access',
					RESTORE_IN_PROGRESS: 'Restore pending'
				},
				menuHints: {
					RESTORE_REQUIRED: 'Download requires restore before files become deliverable.',
					FORBIDDEN_POLICY: 'Access policy blocks download for your role.',
					RESTORE_IN_PROGRESS: 'Restore is running. Try again when availability becomes AVAILABLE.'
				}
			},
			sorts: {
				created_at_desc: 'Created (Newest)',
				created_at_asc: 'Created (Oldest)',
				updated_at_desc: 'Updated (Newest)',
				updated_at_asc: 'Updated (Oldest)',
				title_asc: 'Title (A-Z)',
				title_desc: 'Title (Z-A)'
			},
			languages: {
				en: 'English (en)',
				fa: 'Persian (fa)',
				tg: 'Tajik (tg)',
				ru: 'Russian (ru)'
			},
			resync: {
				button: 'Request resync',
				confirmTitle: 'Confirm resync',
				confirmBody: 'Request a sync of this object\'s state from the archive system. If a resync is already active, the existing request will be reused.',
				confirmBodyBulk: 'Request resync for {count} selected objects? Active requests will be reused.',
				success: 'Resync requested. The object state will update once the sync completes.',
				failed: 'Failed to request resync.',
				resyncSelected: 'Resync selected',
				resyncDone: 'Resync requested for {succeeded} of {total} objects.'
			},
		detail: {
				title: 'Object detail',
				back: 'Back to objects',
				untitled: 'Untitled - {suffix}',
				preview: {
					title: 'Preview',
					subtitle: 'Thumbnail preview of this object'
				},
				description: {
					title: 'Description',
					empty: 'No description provided yet.',
					tags: 'Tags'
				},
				tabs: {
					files: 'Files',
					access: 'Access',
					requests: 'Requests',
					raw: 'Raw ingest'
				},
				metrics: {
					processing: 'Processing',
					curation: 'Curation',
					availability: 'Availability',
					access: 'Access'
				},
				common: {
					yes: 'Yes',
					no: 'No'
				},
				access: {
					title: 'Access and deliverability',
					canDownload: 'Download allowed',
					restricted: 'Restricted',
					authorized: 'Authorized',
					deliverable: 'Deliverable',
					embargoUntil: 'Embargo until',
					language: 'Language',
					rightsNote: 'Rights note',
					sensitivityNote: 'Sensitivity note'
				},
				provenance: {
					title: 'Provenance',
					created: 'Created',
					updated: 'Updated',
					type: 'Object type',
					batch: 'Source batch',
					ingestion: 'Source ingestion'
				},
				artifacts: {
					title: 'Artifacts',
					count: '{count} files',
					empty: 'No artifacts found for this object.',
					kind: 'Kind',
					variant: 'Variant',
					contentType: 'Content type',
					size: 'Size',
					created: 'Created',
					actions: 'Actions',
					download: 'Download'
				},
				availableFiles: {
					title: 'Available archive files',
					count: '{count} files',
					empty: 'No available archive files for this object.',
					displayName: 'File',
					kind: 'Artifact kind',
					variant: 'Variant',
					contentType: 'Content type',
					size: 'Size',
					syncedAt: 'Synced',
					actions: 'Actions',
					requestDownload: 'Request download'
				},
				pendingRequests: {
					title: 'Archive requests',
					count: '{count} requests',
					empty: 'No active requests.',
					action: 'Action',
					status: 'Status',
					requested: 'Requested'
				},
				manifest: {
					title: 'Ingest manifest',
					subtitle: 'Raw ingestion metadata attached to this object.',
					show: 'Show raw metadata',
					hide: 'Hide raw metadata'
				}
			}
		},
		ingestionSetup: {
			header: {
				kicker: 'New ingestion',
				title: 'Batch setup',
				subtitle: 'Draft batch {batchId} · No processing until you confirm.'
			},
			dropzone: {
				label: 'Upload files',
				headline: 'Drag files here or click to browse',
				headlineDragging: 'Release to drop files',
				support: 'We will stage files locally until you start ingestion.',
				supportDragging: 'Drop to add files to the staging list.',
				details: 'Images, PDFs, audio, video, and archives. Files stay staged until you start ingestion.',
				browse: 'Browse files',
				unlockedType: 'Batch type unlocks from the first accepted file. Supported formats: {supportedFormats}.',
				lockedType: 'Batch locked to {mediaType}. Allowed formats: {supportedFormats}.'
			},
			files: {
				title: 'Files',
				subtitle: 'Select files to override metadata and intent fields.',
				selectedCount: 'Selected {count}',
				empty: 'No files staged yet. Add files to begin setting metadata.',
				batchType: 'Batch type: {mediaType}',
				createOverride: 'Create override',
				editOverride: 'Edit override',
				removeOverride: 'Remove override',
				retryUpload: 'Retry upload',
				cancelUpload: 'Cancel upload',
				removing: 'Removing...',
				cannotRemoveCommitted: 'Cannot remove committed file.',
				removeFailed: 'Failed to remove file.',
				typeMismatch: 'Only {expectedType} files are allowed in this batch. Rejected: {rejected}.',
				unsupportedFormats: 'Unsupported format for this batch. Rejected: {rejected}. Supported formats: {supportedFormats}.',
				expectedTypeFallback: 'the locked batch type'
			},
			fileTypes: {
				image: 'Image',
				photo: 'Photo',
				pdf: 'PDF',
				audio: 'Audio',
				video: 'Video',
				document: 'Document'
			},
			batchIntent: {
				title: 'Batch intent',
				description: 'Set batch defaults that apply to all files unless overridden.',
				sections: {
					coreMetadata: 'Core metadata',
					summaryContext: 'Summary context',
					dates: 'Dates',
					accessPolicy: 'Access and policy'
				},
				titleLabel: 'Title',
				language: 'Default language',
				itemKind: 'Item kind',
				classificationType: 'Classification type',
				classificationHintDocument: 'For document/scanned document, choose the closest classification.',
				classificationHintAuto: 'Defaulted from item kind; adjust only if needed.',
				tags: 'Tags',
				addTag: 'Add',
				summary: 'Summary',
				datesTitle: 'Important dates',
				dateHint: 'Choose precision, then pick the date.',
				publishedDate: 'Publication date',
				createdDate: 'Creation date',
				precisionNone: 'Not set',
				precisionYear: 'Year',
				precisionMonth: 'Month',
				precisionDay: 'Day',
				noDateSelected: 'No date selected for this field.',
				yearPlaceholder: 'YYYY',
				approximateDate: 'Approximate',
				confidenceLow: 'Low confidence',
				confidenceMedium: 'Medium confidence',
				confidenceHigh: 'High confidence',
				dateNotePlaceholder: 'Optional note',
				invalidYear: '{label}: enter a valid year (YYYY).',
				invalidMonth: '{label}: enter a valid month (YYYY-MM).',
				invalidDay: '{label}: enter a valid date (YYYY-MM-DD).',
				pipelinePreset: 'Pipeline preset',
				accessLevel: 'Access level',
				embargoUntil: 'Embargo until',
				rightsNote: 'Rights note',
				sensitivityNote: 'Sensitivity note',
				saveStateIdle: 'Changes save automatically',
				saveStateSaving: 'Saving changes',
				saveStateSaved: 'All changes saved',
				saveStateError: 'Save failed',
				accessLevels: {
					private: 'Private',
					family: 'Family',
					public: 'Public'
				},
				selectLanguage: 'Select language',
				selectType: 'Select type',
				tagsPlaceholder: 'People, places, themes'
			},
			languages: {
				en: 'English',
				ru: 'Russian',
				fa: 'Persian',
				tg: 'Tajik',
				persian: 'Persian',
				tajik: 'Tajik',
				english: 'English',
				mixed: 'Mixed / Unknown'
			},
			classificationTypes: {
				document: 'Document',
				newspaper_article: 'Newspaper article',
				magazine_article: 'Magazine article',
				book_chapter: 'Book chapter',
				book: 'Book',
				letter: 'Letter',
				speech: 'Speech',
				interview: 'Interview',
				report: 'Report',
				manuscript: 'Manuscript',
				image: 'Image',
				other: 'Other'
			},
			itemKinds: {
				document: 'Document',
				scanned_document: 'Scanned document',
				photo: 'Photo',
				audio: 'Audio',
				video: 'Video',
				other: 'Other'
			},
			pipelinePresets: {
				auto: 'Auto',
				none: 'None',
				ocr_text: 'OCR text',
				audio_transcript: 'Audio transcript',
				video_transcript: 'Video transcript',
				ocr_and_audio_transcript: 'OCR + audio transcript',
				ocr_and_video_transcript: 'OCR + video transcript',
				photos: 'Photos only (no OCR)',
				newspapers: 'Newspapers (layout OCR + review)',
				audioVideo: 'Audio/Video (speech-to-text)'
			},
			overrides: {
				title: 'Per-file overrides',
				subtitle: 'Overrides apply to the selected file and take precedence over batch defaults.',
				editorTitle: 'Override · {fileName}',
				language: 'Language',
				classificationType: 'Document type',
				tags: 'Tags',
				notes: 'Notes',
				useBatchDefault: 'Use batch default',
				tagsPlaceholder: 'Tags for this file',
				notesPlaceholder: 'Human context for this file',
				emptyTitle: 'No file selected',
				emptyBody: 'Select a file from the list to edit per-file overrides.'
			},
			readiness: {
				title: 'Readiness',
				ready: 'All required fields are filled. You can proceed to confirmation.',
				missing: 'Language and classification type are required for each file.',
				missingCount: 'Missing fields on {count} files.',
				missingItemMetadata: 'Title, date, and at least one tag are required for each object.',
				missingItemMetadataCount: 'Missing required metadata on {count} objects.',
				uploading: 'Uploads are still in progress.',
				uploadFailed: 'Some files failed to upload. Retry failed files to continue.'
			},
			confirmation: {
				title: 'Confirm ingestion',
				subtitle: 'Review before starting',
				batch: 'Batch',
				files: 'Files',
				objects: 'Objects',
				languages: 'Languages',
				pipeline: 'Pipeline',
				submitting: 'Submitting...'
			},
			mismatch: {
				title: 'Item kind mismatch',
				subtitle: 'Uploaded files do not match selected item kind',
				details: 'Selected kind: {expected}. Incoming files look like: {incoming}.',
				rejected: '{count} file(s) were rejected: {sample}.',
				keep: 'Keep current kind',
				switchAndContinue: 'Switch kind and continue'
			},
			objectMetadata: {
				title: 'Object Details',
				empty: 'Select a file or group on the left to add its metadata.',
				fields: {
					title: 'Title',
					titlePlaceholder: 'Title (inherits batch title)',
					date: 'Date',
					precisionNone: 'No date',
					precisionYear: 'Year',
					precisionMonth: 'Year + Month',
					precisionDay: 'Full date',
					approximateDate: 'Approximate date',
					tags: 'Tags',
					tagsPlaceholder: 'Add tag…',
					addTag: 'Add',
					batchTagHint: 'Batch tag (inherited)',
					description: 'Description',
					descriptionPlaceholder: 'Description (inherits batch summary)',
					people: 'People Mentioned',
					peoplePlaceholder: 'Add person…',
					addPerson: 'Add'
				}
			},
			objectGroup: {
				typeLabel: 'Object',
				fileCount: '{count} files',
				fileCountOne: '{count} file',
				ungroup: 'Ungroup',
				ungroupDisabledTooltip: 'Cannot ungroup: this item has already been saved to the server.',
				expandAriaLabel: 'Expand group',
				collapseAriaLabel: 'Collapse group',
				defaultLabel: 'Group {id}'
			}
		},
		footer: {
			note: 'Human intent confirmed. Review everything before ingestion starts.',
			download: 'Download catalog.json',
			start: 'Start ingestion'
		},
		statuses: {
			queued: 'Queued',
			processing: 'Processing',
			extracted: 'Extracted',
			needsReview: 'Needs Review',
			approved: 'Approved',
			blocked: 'Blocked',
			skipped: 'Skipped',
			failed: 'Failed'
		},
		values: {
			language: 'Persian',
			category: 'Newspaper',
			preset: 'Layout OCR + review',
			visibility: 'Team',
			documentType: 'Newspaper scan',
			unknown: '—'
		},
		pipelines: {
			ocr: 'OCR',
			layoutOcr: 'Layout OCR',
			speechToText: 'Speech-to-text',
			imageTagging: 'Image tagging'
		}
	},
	ru: {
		app: {
			title: 'Пакетная загрузка',
			subtitle: 'Сначала человеческий замысел. Машины помогают, люди решают.',
			session: 'Сеанс'
		},
		header: {
			library: 'Цифровая библиотека Осими',
			textSize: 'Размер текста',
			locale: 'Интерфейс',
			signOut: 'Выйти',
			nav: {
				dashboard: 'Панель',
				ingestion: 'Загрузка',
				objects: 'Объекты'
			}
		},
		dropzone: {
			label: 'Зона загрузки',
			headline: 'Перетащите файлы сюда или нажмите, чтобы выбрать',
			support: 'Изображения, PDF, аудио, видео и архивы. Загрузка только после проверки.',
			badgeOne: 'Создает локальный пакет',
			badgeTwo: 'Поддерживает параметры партии'
		},
		legend: {
			title: 'Легенда статусов',
			subtitle: 'Один цвет внимания. Текст всегда объясняет статус.',
			count: '8 статусов'
		},
		files: {
			title: 'Файлы',
			subtitle: 'Выберите файл, чтобы увидеть переопределения и контекст.'
		},
		intent: {
			title: 'Замысел партии',
			description: 'Сканированные выпуски газет 1971 года. Человеческие заметки задают конвейеры.',
			language: 'Основной язык',
			category: 'Категория',
			preset: 'Набор конвейеров',
			visibility: 'Доступ',
			tags: 'Теги'
		},
		overrides: {
			title: 'Переопределения файла',
			subtitle: 'Переопределения выбранного файла важнее параметров партии.',
			language: 'Язык',
			documentType: 'Тип документа',
			note: 'Примечание: на странице 1 есть пометки от руки. Сохраните поля при OCR.',
			badgeOne: 'Макетный OCR',
			badgeTwo: 'Тегирование изображений',
			badgeThree: 'Нужна проверка'
		},
		common: {
			cancel: 'Отмена',
			confirm: 'Подтвердить',
			confirmStart: 'Подтвердить и начать',
			close: 'Закрыть',
			remove: 'Удалить',
			startIngestion: 'Начать обработку'
		},
		dashboard: {
			title: 'Панель',
			welcome: 'С возвращением, {name}',
			ingestion: 'Загрузка',
			metrics: {
				activeBatches: 'Активные партии',
				activeBatchesHint: 'Сейчас в обработке или на проверке.',
				needsReview: 'Нужна проверка',
				needsReviewHint: 'Перед публикацией нужна проверка человеком.',
				pendingUploads: 'Ожидающие загрузки',
				pendingUploadsHint: 'Подготовленные элементы ждут назначения партии.'
			},
			recentActivity: 'Недавняя активность',
			lastDays: 'Последние 7 дней',
			intentTitle: 'Контроль человеческого замысла',
			intentBody:
				'Каждая загрузка начинается с заявленного замысла и заканчивается проверкой человеком. Держите партии осмысленными и ограниченными.'
		},
		login: {
			library: 'Цифровая библиотека Осими',
			title: 'Авторизованный доступ',
			description:
				'Этот интерфейс предназначен для уполномоченных архивистов. Войдите, чтобы продолжить рабочий процесс загрузки.',
			authHint:
				'Аутентификацию обрабатывает backend. Используйте выданные учетные данные, чтобы продолжить.',
			signIn: 'Войти',
			continue: 'Продолжить к загрузке',
			demoHint: 'Используйте одну из демо-учетных записей для проверки ролей.',
			username: 'Имя пользователя',
			password: 'Пароль',
			signingIn: 'Вход...',
			byContinuing:
				'Продолжая, вы подтверждаете, что в этой сессии будут обрабатываться чувствительные архивные материалы.'
		},
		ingestionOverview: {
			title: 'Загрузка',
			newIngestion: 'Новая загрузка',
			emptyKicker: 'Загрузок пока нет',
			emptyTitle: 'Начните первую загрузку',
			emptyBody: 'Загрузка выполняется партиями. Создайте первую партию, чтобы начать.',
			stats: {
				totalBatches: 'Всего партий',
				totalBatchesHint: 'Все партии отслеживаются.',
				objectsCreated: 'Создано объектов',
				objectsCreatedHint: 'Элементы из загрузок.',
				inProgress: 'В процессе',
				inProgressHint: 'Конвейеры выполняются.',
				needsAttention: 'Сбой / внимание',
				needsAttentionHint: 'Требуется действие.'
			},
			sections: {
				activeRecent: 'Активные и недавние партии',
				activeRecentHint: 'Отслеживайте текущие и завершенные загрузки.',
				drafts: 'Черновые и ожидающие партии',
				draftsHint: 'Управляйте черновиками, загрузками и отмененными партиями.'
			},
			table: {
				batch: 'Партия',
				created: 'Создано',
				progress: 'Прогресс',
				action: 'Действие',
				objects: '{completed} / {total} объектов'
			},
			actions: {
				view: 'Открыть',
				resume: 'Продолжить',
				retry: 'Повторить',
				cancel: 'Отменить',
				restore: 'Восстановить',
				delete: 'Удалить',
				working: 'Выполняется...',
				menu: 'Действия'
			},
			statuses: {
				draft: 'Черновик',
				uploading: 'Загрузка',
				queued: 'В очереди',
				ingesting: 'Обработка',
				completed: 'Завершено',
				failed: 'Ошибка',
				canceled: 'Отменено'
			},
			errors: {
				deleteConflict: 'Удалять можно только черновые, загружаемые или отмененные загрузки.',
				failedNamed: 'Не удалось выполнить действие {action} для загрузки {name}.',
				failed: 'Не удалось выполнить действие {action} для загрузки.'
			},
			pagination: {
				prev: '← Назад',
				next: 'Далее →'
			}
		},
		ingestionDetail: {
			title: 'Детали загрузки',
			back: 'Назад к загрузкам',
			metrics: {
				status: 'Статус',
				created: 'Создано',
				updated: 'Обновлено',
				progress: 'Прогресс'
			},
			files: {
				title: 'Файлы',
				subtitle: 'Файлы, зарегистрированные в этой партии.',
				empty: 'Для этой загрузки файлы не найдены.',
				headers: {
					file: 'Файл',
					status: 'Статус',
					type: 'Тип',
					size: 'Размер',
					created: 'Создано'
				}
			},
			logs: {
				title: 'Журнал активности',
				subtitle: 'События только для этой загрузки',
				empty: 'Для этой загрузки пока нет событий активности.',
				eventType: 'Тип события',
				objectId: 'Объект',
				actor: 'Пользователь',
				payload: 'Показать payload'
			},
			actions: {
				resume: 'Продолжить',
				retry: 'Повторить',
				cancel: 'Отменить',
				restore: 'Восстановить',
				delete: 'Удалить',
				working: 'Выполняется...',
				menu: 'Действия',
				confirmTitle: 'Подтвердите действие'
			},
			messages: {
				unknown: 'Неизвестно',
				actionFailed: 'Действие не выполнено.',
				delete: 'Удалить эту загрузку? Это действие нельзя отменить.',
				cancel: 'Отменить эту загрузку? Вы сможете восстановить ее позже, пока обработка не началась.',
				retry: 'Повторить эту загрузку сейчас?',
				restore: 'Восстановить эту отмененную загрузку?'
			},
			errors: {
				failed: 'Не удалось выполнить действие {action} для загрузки.'
			}
		},
		ingestionNew: {
			title: 'Создать новую загрузку',
			description:
				'Начните с архивных значений по умолчанию, затем уточните параметры на этапе настройки. Если оставить основные поля без изменений, будут использованы рекомендованные значения.',
			defaults: 'По умолчанию: Язык `en` · Конвейер `auto` · Доступ `private`',
			fields: {
				batchLabel: 'Метка партии',
				batchLabelPlaceholder: 'Необязательно - по умолчанию Untitled ingestion <timestamp>',
				itemKind: 'Вид элемента',
				classificationType: 'Тип классификации',
				classificationHintDocument: 'Обязательно для партий document и scanned_document.',
				classificationHintAuto: 'Подставляется по виду элемента; можно уточнить позже в настройке.',
				classificationUpdatedByKind: '↳ Обновлено по виду элемента',
				languageCode: 'Код языка',
				pipelinePreset: 'Набор конвейеров',
				pipelineHints: {
					auto: 'Конвейеры выбираются автоматически по виду элемента',
					none: 'Конвейеры обработки не запускаются',
					ocr_text: 'Запускает OCR для извлечения текста из изображений документов',
					audio_transcript: 'Транскрибирует речь в текст',
					video_transcript: 'Транскрибирует речь из видео в текст',
					ocr_and_audio_transcript: 'Запускает OCR и транскрипцию аудио',
					ocr_and_video_transcript: 'Запускает OCR и транскрипцию видео'
				},
				accessLevel: 'Уровень доступа',
				embargoUntil: 'Эмбарго до',
				rightsNote: 'Примечание о правах',
				sensitivityNote: 'Примечание о чувствительности'
			},
			policyNotes: 'Политика и примечания',
			summary: {
				title: 'Сводные метаданные',
				subtitle: 'Эти поля заполняют контекст сводки загрузки и могут быть уточнены на этапе настройки.',
				tags: 'Теги',
				tagsPlaceholder: 'Введите тег и нажмите Добавить',
				add: 'Добавить',
				summaryText: 'Текст сводки',
				summaryPlaceholder: 'Краткая контекстная сводка для классификационных метаданных'
			},
			continue: 'Перейти к настройке',
			creating: 'Создание…',
			cancel: 'Отмена'
		},
		objects: {
			header: {
				title: 'Объекты',
				subtitle: 'Каталог архивных объектов с состояниями доступа и доступности.',
				matching: '{filtered} совпадений · всего {total}',
				bulkActions: 'Массовые действия',
				selectVisible: 'Выбрать видимые',
				clearSelection: 'Снять выбор',
				copySelectionIds: 'Копировать выбранные ID',
				copiedSelection: 'ID скопированы',
				selectionState: 'Выбрано {selected} из {visible} видимых'
			},
			filters: {
				searchPlaceholder: 'Поиск по заголовку, id объекта, OCR...',
				search: 'Поиск',
				hint: 'Нажмите Enter для поиска. Доступность, доступ и сортировка применяются сразу.',
				availability: 'Доступность',
				access: 'Доступ',
				sort: 'Сортировка',
				all: 'Все',
				moreFilters: 'Больше фильтров',
				clearFilters: 'Очистить фильтры',
				noActiveFilters: 'Нет активных фильтров',
				closeFilters: 'Закрыть фильтры',
				drawerTitle: 'Фильтры',
				drawerSubtitle: 'Уточнить объекты ({count} активно)',
				drawerHint:
					'Используйте эту панель для детальных фильтров. Быстрые фильтры выше применяются сразу; эта форма применяется пакетом.',
				type: 'Тип',
				anyType: 'Любой тип',
				typeHint: 'Используются enum-значения backend.',
				language: 'Язык',
				anyLanguage: 'Любой язык',
				languageHint: 'Выберите распространенный код языка из метаданных объекта.',
				batchLabel: 'Метка партии',
				tag: 'Тег',
				datePresets: 'Пресеты дат',
				last24h: 'Последние 24ч',
				last7d: 'Последние 7д',
				last30d: 'Последние 30д',
				thisMonth: 'Этот месяц',
				from: 'От',
				to: 'До',
				invalidRange: 'Неверный диапазон: дата начала должна быть раньше даты конца.',
				limit: 'Лимит',
				reset: 'Сбросить',
				applyFilters: 'Применить фильтры',
				batchPlaceholder: 'batch-2026',
				tagPlaceholder: 'tag',
				moreSelected: 'ещё'
			},
			recent: {
				title: 'Недавно загруженные',
				subtitle: 'Быстрый доступ к недавним работам',
				lastCount: 'Последние {count} объектов',
				restricted: 'Ограничено',
				untitled: 'Без названия - {suffix}'
			},
			table: {
				headers: {
					preview: 'Превью',
					title: 'Название',
					type: 'Тип',
					processing: 'Обработка',
					indicators: 'Индикаторы',
					access: 'Доступ',
					updated: 'Обновлено',
					batch: 'Партия',
					actions: 'Действия'
				},
				emptyFiltered: 'Нет объектов, соответствующих текущим фильтрам.',
				empty: 'Для этого клиента пока нет объектов.',
				rowActions: 'Действия строки',
				open: 'Открыть',
				copyId: 'Копировать ID',
				copied: 'Скопировано',
				batchLink: 'Партия',
				showing: 'Показано {rows} из {filtered} (всего {total})',
				firstPage: 'Первая страница',
				next: 'Далее',
				noMore: 'Больше нет',
				untitled: 'Без названия - {suffix}',
				reasons: {
					OK: 'Доступно для скачивания',
					FORBIDDEN_POLICY: 'Доступ ограничен политикой',
					EMBARGO_ACTIVE: 'Эмбарго активно',
					RESTORE_REQUIRED: 'Для скачивания требуется восстановление',
					RESTORE_IN_PROGRESS: 'Восстановление выполняется',
					TEMP_UNAVAILABLE: 'Временно недоступно'
				},
				reasonActions: {
					RESTORE_REQUIRED: 'Запросить восстановление',
					FORBIDDEN_POLICY: 'Запросить доступ',
					RESTORE_IN_PROGRESS: 'Ожидает восстановления'
				},
				menuHints: {
					RESTORE_REQUIRED: 'Для скачивания требуется восстановление до состояния доступности.',
					FORBIDDEN_POLICY: 'Политика доступа блокирует скачивание для вашей роли.',
					RESTORE_IN_PROGRESS: 'Идет восстановление. Повторите попытку, когда состояние станет AVAILABLE.'
				}
			},
			sorts: {
				created_at_desc: 'Создано (сначала новые)',
				created_at_asc: 'Создано (сначала старые)',
				updated_at_desc: 'Обновлено (сначала новые)',
				updated_at_asc: 'Обновлено (сначала старые)',
				title_asc: 'Название (А-Я)',
				title_desc: 'Название (Я-А)'
			},
			languages: {
				en: 'Английский (en)',
				fa: 'Персидский (fa)',
				tg: 'Таджикский (tg)',
				ru: 'Русский (ru)'
			},
			resync: {
				button: 'Запросить синхронизацию',
				confirmTitle: 'Подтвердите синхронизацию',
				confirmBody: 'Запросить синхронизацию состояния объекта из архивной системы. Если синхронизация уже активна, существующий запрос будет использован повторно.',
				confirmBodyBulk: 'Запросить синхронизацию для {count} выбранных объектов? Активные запросы будут использованы повторно.',
				success: 'Синхронизация запрошена. Состояние объекта обновится по завершении.',
				failed: 'Не удалось запросить синхронизацию.',
				resyncSelected: 'Синхронизировать выбранные',
				resyncDone: 'Синхронизация запрошена для {succeeded} из {total} объектов.'
			},
		detail: {
				title: 'Детали объекта',
				back: 'Назад к объектам',
				untitled: 'Без названия - {suffix}',
				preview: {
					title: 'Превью',
					subtitle: 'Миниатюра объекта'
				},
				description: {
					title: 'Описание',
					empty: 'Описание пока не добавлено.',
					tags: 'Теги'
				},
				tabs: {
					files: 'Файлы',
					access: 'Доступ',
					requests: 'Запросы',
					raw: 'Сырой ingest'
				},
				metrics: {
					processing: 'Обработка',
					curation: 'Курация',
					availability: 'Доступность',
					access: 'Доступ'
				},
				common: {
					yes: 'Да',
					no: 'Нет'
				},
				access: {
					title: 'Доступ и доставляемость',
					canDownload: 'Скачивание разрешено',
					restricted: 'Ограничено',
					authorized: 'Авторизован',
					deliverable: 'Доставляемо',
					embargoUntil: 'Эмбарго до',
					language: 'Язык',
					rightsNote: 'Примечание о правах',
					sensitivityNote: 'Примечание о чувствительности'
				},
				provenance: {
					title: 'Происхождение',
					created: 'Создано',
					updated: 'Обновлено',
					type: 'Тип объекта',
					batch: 'Исходная партия',
					ingestion: 'Исходная загрузка'
				},
				artifacts: {
					title: 'Артефакты',
					count: '{count} файлов',
					empty: 'Для этого объекта артефакты не найдены.',
					kind: 'Тип',
					variant: 'Вариант',
					contentType: 'Контент-тип',
					size: 'Размер',
					created: 'Создано',
					actions: 'Действия',
					download: 'Скачать'
				},
				availableFiles: {
					title: 'Доступные архивные файлы',
					count: '{count} файлов',
					empty: 'Для этого объекта нет доступных архивных файлов.',
					displayName: 'Файл',
					kind: 'Тип артефакта',
					variant: 'Вариант',
					contentType: 'Контент-тип',
					size: 'Размер',
					syncedAt: 'Синхронизация',
					actions: 'Действия',
					requestDownload: 'Запросить скачивание'
				},
				pendingRequests: {
					title: 'Архивные запросы',
					count: '{count} запросов',
					empty: 'Активных запросов нет.',
					action: 'Действие',
					status: 'Статус',
					requested: 'Запрошено'
				},
				manifest: {
					title: 'Ingest manifest',
					subtitle: 'Исходные метаданные загрузки, прикрепленные к объекту.',
					show: 'Показать исходные метаданные',
					hide: 'Скрыть исходные метаданные'
				}
			}
		},
		ingestionSetup: {
			header: {
				kicker: 'Новая загрузка',
				title: 'Настройка партии',
				subtitle: 'Черновик партии {batchId} · Без обработки до подтверждения.'
			},
			dropzone: {
				label: 'Загрузка файлов',
				headline: 'Перетащите файлы сюда или нажмите, чтобы выбрать',
				headlineDragging: 'Отпустите, чтобы добавить файлы',
				support: 'Файлы остаются локально, пока вы не начнете обработку.',
				supportDragging: 'Отпустите, чтобы добавить файлы в список.',
				details: 'Изображения, PDF, аудио, видео и архивы. Файлы остаются в очереди до запуска обработки.',
				browse: 'Выбрать файлы',
				unlockedType: 'Тип партии определяется первым принятым файлом. Поддерживаемые форматы: {supportedFormats}.',
				lockedType: 'Партия зафиксирована для типа {mediaType}. Разрешенные форматы: {supportedFormats}.'
			},
			files: {
				title: 'Файлы',
				subtitle: 'Выберите файлы для переопределения метаданных и намерений.',
				selectedCount: 'Выбрано {count}',
				empty: 'Файлы не добавлены. Загрузите файлы, чтобы начать настройку.',
				batchType: 'Тип партии: {mediaType}',
				createOverride: 'Создать переопределение',
				editOverride: 'Изменить переопределение',
				removeOverride: 'Удалить переопределение',
				retryUpload: 'Повторить загрузку',
				cancelUpload: 'Отменить загрузку',
				removing: 'Удаление...',
				cannotRemoveCommitted: 'Нельзя удалить уже подтвержденный файл.',
				removeFailed: 'Не удалось удалить файл.',
				typeMismatch: 'В этой партии разрешены только файлы типа {expectedType}. Отклонено: {rejected}.',
				unsupportedFormats: 'Неподдерживаемый формат для этой партии. Отклонено: {rejected}. Поддерживаемые форматы: {supportedFormats}.',
				expectedTypeFallback: 'зафиксированный тип партии'
			},
			fileTypes: {
				image: 'Изображение',
				photo: 'Фото',
				pdf: 'PDF',
				audio: 'Аудио',
				video: 'Видео',
				document: 'Документ'
			},
			batchIntent: {
				title: 'Замысел партии',
				description: 'Параметры партии применяются ко всем файлам, если нет переопределений.',
				sections: {
					coreMetadata: 'Основные метаданные',
					summaryContext: 'Контекст сводки',
					dates: 'Даты',
					accessPolicy: 'Доступ и политика'
				},
				titleLabel: 'Название',
				language: 'Язык по умолчанию',
				itemKind: 'Вид элемента',
				classificationType: 'Тип классификации',
				classificationHintDocument: 'Для document/scanned_document выберите наиболее близкий тип классификации.',
				classificationHintAuto: 'Тип подставляется по виду элемента; меняйте только при необходимости.',
				tags: 'Теги',
				addTag: 'Добавить',
				summary: 'Краткое описание',
				datesTitle: 'Ключевые даты',
				dateHint: 'Выберите точность, затем укажите дату.',
				publishedDate: 'Дата публикации',
				createdDate: 'Дата создания',
				precisionNone: 'Не указано',
				precisionYear: 'Год',
				precisionMonth: 'Месяц',
				precisionDay: 'День',
				noDateSelected: 'Для этого поля дата не выбрана.',
				yearPlaceholder: 'ГГГГ',
				approximateDate: 'Приблизительно',
				confidenceLow: 'Низкая достоверность',
				confidenceMedium: 'Средняя достоверность',
				confidenceHigh: 'Высокая достоверность',
				dateNotePlaceholder: 'Необязательная заметка',
				invalidYear: '{label}: введите корректный год (ГГГГ).',
				invalidMonth: '{label}: введите корректный месяц (ГГГГ-ММ).',
				invalidDay: '{label}: введите корректную дату (ГГГГ-ММ-ДД).',
				pipelinePreset: 'Набор конвейеров',
				accessLevel: 'Уровень доступа',
				embargoUntil: 'Эмбарго до',
				rightsNote: 'Примечание о правах',
				sensitivityNote: 'Примечание о чувствительности',
				saveStateIdle: 'Изменения сохраняются автоматически',
				saveStateSaving: 'Сохранение изменений',
				saveStateSaved: 'Все изменения сохранены',
				saveStateError: 'Ошибка сохранения',
				accessLevels: {
					private: 'Приватный',
					family: 'Семейный',
					public: 'Публичный'
				},
				selectLanguage: 'Выберите язык',
				selectType: 'Выберите тип',
				tagsPlaceholder: 'Люди, места, темы'
			},
			languages: {
				en: 'Английский',
				ru: 'Русский',
				fa: 'Персидский',
				tg: 'Таджикский',
				persian: 'Персидский',
				tajik: 'Таджикский',
				english: 'Английский',
				mixed: 'Смешанный / неизвестно'
			},
			classificationTypes: {
				document: 'Документ',
				newspaper_article: 'Газетная статья',
				magazine_article: 'Журнальная статья',
				book_chapter: 'Глава книги',
				book: 'Книга',
				letter: 'Письмо',
				speech: 'Выступление',
				interview: 'Интервью',
				report: 'Отчет',
				manuscript: 'Рукопись',
				image: 'Изображение',
				other: 'Другое'
			},
			itemKinds: {
				document: 'Документ',
				scanned_document: 'Сканированный документ',
				photo: 'Фото',
				audio: 'Аудио',
				video: 'Видео',
				other: 'Другое'
			},
			pipelinePresets: {
				auto: 'Авто',
				none: 'Без конвейера',
				ocr_text: 'OCR текст',
				audio_transcript: 'Аудио транскрипт',
				video_transcript: 'Видео транскрипт',
				ocr_and_audio_transcript: 'OCR + аудио транскрипт',
				ocr_and_video_transcript: 'OCR + видео транскрипт',
				photos: 'Только фото (без OCR)',
				newspapers: 'Газеты (макетный OCR + проверка)',
				audioVideo: 'Аудио/видео (распознавание речи)'
			},
			overrides: {
				title: 'Переопределения файла',
				subtitle: 'Переопределения выбранного файла важнее параметров партии.',
				editorTitle: 'Переопределение · {fileName}',
				language: 'Язык',
				classificationType: 'Тип документа',
				tags: 'Теги',
				notes: 'Заметки',
				useBatchDefault: 'Использовать параметры партии',
				tagsPlaceholder: 'Теги для файла',
				notesPlaceholder: 'Человеческий контекст для файла',
				emptyTitle: 'Файл не выбран',
				emptyBody: 'Выберите файл из списка, чтобы редактировать переопределения.'
			},
			readiness: {
				title: 'Готовность',
				ready: 'Все обязательные поля заполнены. Можно переходить к подтверждению.',
				missing: 'Для каждого файла требуются язык и тип классификации.',
				missingCount: 'Не заполнены поля у {count} файлов.',
				missingItemMetadata: 'Для каждого объекта необходимо указать название, дату и хотя бы один тег.',
				missingItemMetadataCount: 'Неполные метаданные у {count} объектов.',
				uploading: 'Загрузка файлов еще выполняется.',
				uploadFailed: 'Часть файлов не загрузилась. Повторите загрузку для продолжения.'
			},
			confirmation: {
				title: 'Подтверждение обработки',
				subtitle: 'Проверьте перед запуском',
				batch: 'Партия',
				files: 'Файлы',
				objects: 'Объекты',
				languages: 'Языки',
				pipeline: 'Конвейер',
				submitting: 'Отправка...'
			},
			mismatch: {
				title: 'Несовпадение вида элемента',
				subtitle: 'Загруженные файлы не совпадают с выбранным видом элемента',
				details: 'Выбранный вид: {expected}. Похоже, загружаются файлы типа: {incoming}.',
				rejected: 'Отклонено файлов: {count}. Пример: {sample}.',
				keep: 'Оставить текущий вид',
				switchAndContinue: 'Сменить вид и продолжить'
			},
			objectMetadata: {
				title: 'Сведения об объекте',
				empty: 'Выберите файл или группу слева, чтобы добавить метаданные.',
				fields: {
					title: 'Название',
					titlePlaceholder: 'Название (наследуется от партии)',
					date: 'Дата',
					precisionNone: 'Без даты',
					precisionYear: 'Год',
					precisionMonth: 'Год и месяц',
					precisionDay: 'Полная дата',
					approximateDate: 'Приблизительно',
					tags: 'Теги',
					tagsPlaceholder: 'Добавить тег…',
					addTag: 'Добавить',
					batchTagHint: 'Тег партии (наследуется)',
					description: 'Описание',
					descriptionPlaceholder: 'Описание (наследуется от партии)',
					people: 'Упомянутые люди',
					peoplePlaceholder: 'Добавить человека…',
					addPerson: 'Добавить'
				}
			},
			objectGroup: {
				typeLabel: 'Объект',
				fileCount: '{count} файлов',
				fileCountOne: '{count} файл',
				ungroup: 'Разгруппировать',
				ungroupDisabledTooltip: 'Нельзя разгруппировать: этот элемент уже сохранён на сервере.',
				expandAriaLabel: 'Развернуть группу',
				collapseAriaLabel: 'Свернуть группу',
				defaultLabel: 'Группа {id}'
			}
		},
		footer: {
			note: 'Человеческий замысел подтвержден. Проверьте все до запуска.',
			download: 'Скачать catalog.json',
			start: 'Начать обработку'
		},
		statuses: {
			queued: 'В очереди',
			processing: 'В обработке',
			extracted: 'Извлечено',
			needsReview: 'Нужна проверка',
			approved: 'Одобрено',
			blocked: 'Заблокировано',
			skipped: 'Пропущено',
			failed: 'Ошибка'
		},
		values: {
			language: 'Персидский',
			category: 'Газета',
			preset: 'Макетный OCR + проверка',
			visibility: 'Команда',
			documentType: 'Скан газеты',
			unknown: '—'
		},
		pipelines: {
			ocr: 'OCR',
			layoutOcr: 'Макетный OCR',
			speechToText: 'Распознавание речи',
			imageTagging: 'Тегирование изображений'
		}
	}
} as const;

export type LocaleKey = keyof typeof translations;
