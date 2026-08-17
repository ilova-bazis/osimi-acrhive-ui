export const translations = {
	en: {
		app: {
			title: 'Batch Ingestion',
			subtitle: 'Human intent first. Machines assist, people decide.',
			session: 'Session'
		},
		header: {
			library: 'Osimi Digital Library',
			librarySubtitle: 'Digital Library',
			textSize: 'Text size',
			locale: 'UI',
			localeSelector: 'Interface language',
			signOut: 'Sign out',
			activeBatches: 'Active batches',
			nav: {
				primaryLabel: 'Primary navigation',
				dashboard: 'Dashboard',
				ingestion: 'Ingestion',
				overview: 'Overview',
				newBatch: 'New batch',
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
			stepper: {
				ariaLabel: '{label}, step {current} of {total}'
			},
			dashboard: {
			title: 'Dashboard',
			welcome: 'Welcome back, {name}',
			guestName: 'Guest',
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
				roles: {
					admin: {
						primaryAction: 'Review access requests',
						secondaryAction: 'Audit recent activity',
						tagline: 'System oversight and access control.'
					},
					archiver: {
						primaryAction: 'Start a new batch',
						secondaryAction: 'Review flagged items',
						tagline: 'Prepare and validate ingestion batches.'
					},
					viewer: {
						primaryAction: 'Open latest releases',
						secondaryAction: 'View activity summary',
						tagline: 'Browse approved materials and reports.'
					}
				},
				activity: {
					ingestionUpdated: 'Ingestion {id} updated.',
					objectUpdated: 'Object {id} updated.',
					recorded: 'Activity event recorded.',
					events: {
						INGESTION_SUBMITTED: 'Ingestion submitted',
						INGESTION_QUEUED: 'Ingestion queued',
						INGESTION_PROCESSING: 'Ingestion processing',
						INGESTION_COMPLETED: 'Ingestion completed',
						INGESTION_FAILED: 'Ingestion failed',
						INGESTION_CANCELED: 'Ingestion canceled',
						LEASE_GRANTED: 'Lease granted',
						LEASE_RENEWED: 'Lease renewed',
						LEASE_EXPIRED: 'Lease expired',
						LEASE_RELEASED: 'Lease released',
						FILE_VALIDATED: 'File validated',
						FILE_FAILED: 'File failed',
						PIPELINE_STEP_STARTED: 'Pipeline step started',
						PIPELINE_STEP_COMPLETED: 'Pipeline step completed',
						PIPELINE_STEP_FAILED: 'Pipeline step failed',
						INGESTION_ITEM_CREATED: 'Ingestion item created',
						INGESTION_ITEM_UPDATED: 'Ingestion item updated',
						INGESTION_ITEM_PROCESSING: 'Ingestion item processing',
						INGESTION_ITEM_COMPLETED: 'Ingestion item completed',
						INGESTION_ITEM_FAILED: 'Ingestion item failed',
						OBJECT_CREATED: 'Object created',
						ARTIFACT_CREATED: 'Artifact created'
					}
				},
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
				'By continuing, you confirm that this session will handle sensitive archival material.',
				errors: {
				invalidOrigin: 'Invalid request origin.',
				credentialsRequired: 'Username and password are required.',
				invalidCredentials: 'Invalid username or password.',
					loginFailed: 'Sign-in failed. Please try again.',
					generic: 'Sign-in failed. Please try again.'
			}
		},
		ingestionOverview: {
			title: 'Ingestion',
			heading: 'Batch Overview',
			statsLine: '{total} batches · {inProgress} in progress',
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
				completed_with_errors: 'Completed with errors',
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
				previewPurged: 'Preview unavailable: retention period expired',
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
				removeTag: 'Remove tag {tag}',
			title: 'Create new ingestion',
			description:
				'Start with archival defaults, then refine in setup. If you leave core fields unchanged, we use recommended values automatically.',
			defaults: 'Defaults: Language `en` · Pipeline `auto` · Access `private`',
			fields: {
				batchLabel: 'Batch label',
				batchLabelPlaceholder: 'Optional - defaults to Untitled ingestion <timestamp>',				itemKind: 'Item kind',
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
				sensitivityNote: 'Sensitivity note',
				nameLabel: 'Batch name',
				namePlaceholder: 'e.g. NoorMags Issue 80–82, Family letters 1974',
				tagsPlaceholder: 'People, places, themes — press Enter to add',
				provenancePlaceholder:
					'Donor, condition, context — anything the next archivist should know.'
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
			cancel: 'Cancel',
			untitledBatch: 'Untitled ingestion {stamp}',
			fallbackTitle: 'Bring new material into the archive',
			statusDraft: 'Draft · not yet submitted',
			discard: 'Discard',
			continueShort: 'Continue',
			stepCounter: 'Step {current} of {total}',
			pipelineSuggested: '— {preset} suggested',
			sections: {
				classification: 'What does it represent?',
				itemKind: 'What kind of item is it?',
				pipeline: 'Processing pipeline',
				provenance: 'Provenance & notes'
			},
			steps: {
				configure: 'Configure',
				upload: 'Upload',
				review: 'Review'
			},
			itemKinds: {
				scannedDocument: {
					label: 'Scanned Pages',
					sub: 'Physical material scanned to images'
				},
				photo: {
					label: 'Photograph',
					sub: 'Original photographic image'
				},
				audio: {
					label: 'Audio Recording',
					sub: 'Spoken word, music, or sound'
				},
				video: {
					label: 'Video Recording',
					sub: 'Film or video footage'
				},
				document: {
					label: 'Digital Document',
					sub: 'Born-digital file (PDF, Word, etc.)'
				},
				other: {
					label: 'Other',
					sub: 'Mixed or uncategorized media'
				}
			},
			classifications: {
				image: 'Image / Photograph'
			},
			languages: {
				mixed: 'Mixed',
				unknown: 'Unknown',
				mixedNative: 'Multiple',
				unknownNative: 'Detect'
			},
			presets: {
				auto: {
					label: 'Auto',
					sub: 'Detect content and run appropriate pipelines'
				},
				ocrText: {
					label: 'OCR + Index',
					sub: 'Extract text from scanned pages, build search index'
				},
				audioTranscript: {
					label: 'Transcribe Audio',
					sub: 'Speech-to-text from audio with speaker diarization'
				},
				videoTranscript: {
					label: 'Transcribe Video',
					sub: 'Speech-to-text from video footage'
				},
				ocrAudio: {
					label: 'OCR + Audio',
					sub: 'Extract text and transcribe audio tracks'
				},
				ocrVideo: {
					label: 'OCR + Video',
					sub: 'Extract text and transcribe video footage'
				},
				none: {
					label: 'Store only',
					sub: 'Catalog and store — no AI processing'
				}
			},
			visibility: {
				private: { label: 'Private', sub: 'Only you' },
				family: { label: 'Team', sub: 'Your team' },
				public: { label: 'Public', sub: 'Everyone' }
			}
		},
		ingestionReview: {
			kicker: 'Step 03 — Review what will run',
			intro: 'Check the summary below before beginning. Once submitted, files will be uploaded and the selected pipelines will run automatically.',
			stampReady: 'Ready to submit',
			backToSetup: 'Back to setup',
			discard: 'Discard',
			submitting: 'Submitting…',
			beginProcessing: 'Begin processing',
			stats: {
				filesIncluded: 'Files included',
				skippedCount: '{count} skipped',
				allIncluded: 'all included',
				totalVolume: 'Total volume',
				toUpload: 'to upload',
				language: 'Language',
				primary: 'primary',
				pipeline: 'Pipeline',
				presetSub: 'preset'
			},
			flow: {
				upload: 'Upload',
				detect: 'Automatic detection',
				transcribe: 'Transcribe',
				archive: 'Archive'
			},
			table: {
				name: 'Name',
				moreFilesOne: '+{count} more file',
				moreFilesFew: '+{count} more files',
				moreFilesMany: '+{count} more files',
				moreFilesOther: '+{count} more files',
				empty: 'No files to process.'
			},
			confirm: {
				title: 'I understand what will be processed and want to begin.',
				body: 'Files will be uploaded and pipelines will run. This action cannot be undone without canceling the batch.'
			},
			summary: {
				kind: 'Kind',
				language: 'Language',
				pipeline: 'Pipeline',
				visibility: 'Visibility'
			},
			counts: {
				title: 'Counts',
				filesToProcess: 'Files to process',
				skipped: 'Skipped',
				totalUpload: 'Total upload',
				objects: 'Objects'
			},
			footprint: {
				title: 'Pipeline footprint',
				none: 'Store only — no AI processing.',
				detect: 'Pipelines selected automatically',
				upload: 'Upload',
				ocr: 'OCR',
				index: 'Index',
				transcribe: 'Transcribe',
				archive: 'Archive'
			},
			kind: {
				scanned_document: 'Newspaper',
				photo: 'Photograph',
				audio: 'Audio',
				video: 'Video',
				document: 'Document',
				other: 'Other'
			},
			preset: {
				auto: 'Auto',
				ocr_text: 'OCR + Index',
				audio_transcript: 'Transcribe',
				video_transcript: 'Transcribe Video',
				ocr_and_audio_transcript: 'OCR + Audio',
				ocr_and_video_transcript: 'OCR + Video',
				none: 'Store only'
			},
			visibility: {
				private: 'Private',
				family: 'Team',
				public: 'Public'
			},
			errors: {
				submitFailed: 'Failed to submit ingestion.'
			}
		},
		objectEdit: {
			pageTitle: 'Edit: {title} — Osimi Archive',
			errors: {
				objectNotFound: 'Object not found.',
				highlightedFields: 'Check the highlighted fields.',
				invalidPayload: 'Invalid form payload.',
				saveForbidden: 'You do not have permission to save this draft.',
				changedBeforeSave: 'This object changed while you were editing. Review the refreshed values before retrying.',
				partialConflict: 'Metadata saved, but document curation needs review before retrying.',
				partialFailedReview: 'Metadata saved, but document curation failed. Review the refreshed values before retrying.',
				partialFailedRefresh: 'Metadata saved, but document curation failed. Refresh before retrying.',
				validationFailed: 'Check the highlighted fields and try again.',
				saveFailed: 'Failed to save draft.',
				ocrUnavailable: 'OCR pages are unavailable. Synchronize this object before publishing curated OCR.',
				publishForbidden: 'You do not have permission to publish curated OCR.',
				changedBeforePublish: 'This object changed while you were editing. Review the refreshed values before submitting.',
				publishFailed: 'Failed to publish curated OCR.',
				withRequest: '{message} (request: {id})'
			},
			fieldErrors: {
				titleRequired: 'Enter a title.',
				publicationDateInvalid: 'Publication date does not match selected precision.',
				tagsBlank: 'Tags cannot be blank.',
				peopleBlank: 'People cannot be blank.',
				pagesInvalid: 'Review the page curation values.',
				invalidValue: 'Enter a valid value.'
			},
			backToObject: '← Object',
			state: {
				unsaved: 'Unsaved changes',
				clean: 'No changes'
			},
			lockConflictBanner:
				'Another user started editing this object. Your changes could not be saved.',
			refresh: 'Refresh',
			recovery: {
				partial: 'Partial save recovered. Review and retry remaining changes.',
				full: 'Server changes loaded. Review your rebased edits before retrying.'
			},
			saveDraft: 'Save draft',
			saving: 'Saving…',
			publish: {
				disabledNoPages: 'OCR pages are unavailable',
				disabledDirty: 'Save changes before publishing',
				disabledActive: 'A publication is already in progress',
				processing: 'Publishing…',
				queued: 'Publication queued',
				submit: 'Publish curated OCR',
				unavailable: 'OCR unavailable'
			},
			lockedBanner:
				'This object is currently being edited by another user. It will be available after they finish.',
			noProjection: {
				title: 'Curated OCR cannot be published yet.',
				body: 'This document has no synchronized OCR pages. You can still save metadata changes.',
				resyncLink: 'Return to the object to request a resync.'
			},
			publication: {
				statusPENDING: 'Curated OCR publication is queued.',
				statusPROCESSING: 'Curated OCR is being published to the archive.',
				statusCOMPLETED: 'Curated OCR was published successfully.',
				statusFAILED: 'Curated OCR publication failed{suffix}',
				statusCANCELED: 'Curated OCR publication was canceled.',
				requestId: 'Request {id}',
				statusUnavailable: 'Publication status is temporarily unavailable.'
			},
			pages: {
				countOne: '{count} page',
				countFew: '{count} pages',
				countMany: '{count} pages',
				countOther: '{count} pages',
				fallback: 'Document pages',
				pageLabel: 'Page {number}',
				hasCuratedText: 'Has curated text',
				statusEdited: 'Edited',
				statusMachine: 'Machine OCR',
				previous: 'Previous page',
				next: 'Next page',
				counter: '{current} / {total}'
			},
			editor: {
				inProgress: 'Curation in progress — compare source and refine below',
				empty: 'No curated text yet — copy from source or write from scratch',
				details: 'Details',
				confidence: '{confidence}% confidence',
				readOnly: 'Read-only',
				noSourceText: 'No source text available',
				copyFromSource: 'Copy from source',
				reset: 'Reset',
				curatedPlaceholder: 'Enter curated text, or copy from source and edit...'
			},
			diff: {
				sourceLabel: 'OCR text',
				curatedLabel: 'Curated text'
			},
			sections: {
				details: 'Details',
				rightsAccess: 'Rights & Access',
				objectDetails: 'Object details'
			},
			metadata: {
				readOnly: 'Metadata is read-only for your role.',
				title: 'Title',
				datePrecision: 'Date precision',
				precisionNone: 'No date',
				precisionYear: 'Year',
				precisionMonth: 'Year + Month',
				precisionDay: 'Full date',
				yearPlaceholder: 'YYYY',
				monthPlaceholder: 'YYYY-MM',
				dayPlaceholder: 'YYYY-MM-DD',
				approximateDate: 'Approximate date',
				language: 'Language',
				languagePlaceholder: 'e.g. Tajik',
				tags: 'Tags',
				addTagPlaceholder: 'Add tag…',
				people: 'People',
				addPersonPlaceholder: 'Add person…',
				description: 'Description',
				descriptionPlaceholder: 'Description…',
				add: 'Add',
				removeTag: 'Remove tag {tag}',
				removePerson: 'Remove person {person}'
			},
			intro: {
				image: 'Images have no machine-extracted text — enrich metadata and access settings directly.',
				audioVideo:
					'Transcript curation for {kind} objects is not yet available. You can edit metadata below.',
				default: 'Edit metadata and access settings for this object.'
			},
			publishDialog: {
				title: 'Publish curated OCR?',
				body: 'This publishes the currently saved OCR as an asynchronous archive update. Metadata changes are saved separately and unsaved changes cannot be included.',
				noteLabel: 'Publication note',
				optional: '(optional)',
				notePlaceholder: 'Record context for the edit history',
				noteHint: 'This note is recorded in edit history; it is not sent to a human reviewer.',
				queueing: 'Queueing…',
				queue: 'Queue publication'
			},
			rights: {
				accessLevel: 'Access level',
				readOnly: '(read-only)',
				rightsNote: 'Rights note',
				rightsNotePlaceholder: 'Rights note…',
				sensitivityNote: 'Sensitivity note',
				sensitivityNotePlaceholder: 'Sensitivity note…'
			}
		},
		objects: {
			header: {
				kicker: 'Catalog',
				title: 'Objects',
				subtitle: 'Archive object catalog with access and availability states.',
				matchingOne: '{filtered} matching object · {total} total',
				matchingFew: '{filtered} matching objects · {total} total',
				matchingMany: '{filtered} matching objects · {total} total',
				matchingOther: '{filtered} matching objects · {total} total',
				totalCount: '{total} total',
				bulkActions: 'Bulk actions',
				selectVisible: 'Select visible',
				clearSelection: 'Clear selection',
				copySelectionIds: 'Copy selected IDs',
				copiedSelection: 'Copied IDs',
				selectionState: '{selected} selected from {visible} visible'
			},
			filters: {
				searchPlaceholder: 'Title, object ID, indexed OCR/transcript...',
				search: 'Search',
				hint: 'Materialized OCR/transcript text only. Press Enter to search.',
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
				lastCountOne: 'Last {count} object',
				lastCountFew: 'Last {count} objects',
				lastCountMany: 'Last {count} objects',
				lastCountOther: 'Last {count} objects',
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
				materializedPdf: 'Materialized PDF derivative',
				materializedOcr: 'Materialized OCR text',
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
				ru: 'Russian (ru)',
				mixed: 'Mixed',
				unknown: 'Unknown'
			},
			types: {
				GENERIC: 'Generic',
				IMAGE: 'Image',
				AUDIO: 'Audio',
				VIDEO: 'Video',
				DOCUMENT: 'Document'
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
				typeObject: '{type} object',
				fallbackDescription:
					'Read-only object inspection with media-first access, preview artifacts, and request-aware behavior.',
				viewMode: 'View mode',
				edit: 'Edit',
				support: 'Support',
				review: {
					available: 'Media available in read-only mode',
					requestPending: 'Primary media request in progress',
					requestRequired: 'Primary media available on request',
					restricted: 'Preview artifacts only',
					readOnly: 'Read-only object inspection'
				},
				chips: {
					requestRequired: 'Request required',
					requestPending: 'Request pending',
					availableNow: 'Available now'
				},
				topBar: {
					back: 'Back',
					info: 'Info',
					resyncing: 'Resyncing',
					resync: 'Resync'
				},
				info: {
					kicker: 'Object info',
					description:
						'Metadata remains secondary so the object itself stays central in view mode.',
					type: 'Type',
					language: 'Language',
					created: 'Created',
					updated: 'Updated',
					batch: 'Batch',
					ingestion: 'Ingestion',
					tags: 'Tags',
					descriptionTitle: 'Description',
					noDescription: 'No description available.',
					rightsNote: 'Rights note',
					sensitivityNote: 'Sensitivity note',
					close: 'Close info panel',
					closeBackdrop: 'Close details'
				},
				supportSheet: {
					kicker: 'Support',
					expand: 'Expand support panel',
					collapse: 'Collapse support panel',
					close: 'Close support panel'
				},
				errors: {
					loadArtifacts: 'Failed to load object artifacts.',
					loadArtifactsRequest: 'Failed to load object artifacts (request: {requestId}).',
					loadAvailableFiles: 'Failed to load available archive files.',
					loadAvailableFilesRequest: 'Failed to load available archive files (request: {requestId}).',
					loadPendingRequests: 'Failed to load pending requests.',
					loadPendingRequestsRequest: 'Failed to load pending requests (request: {requestId}).',
					missingFileId: 'Missing available file id.',
					invalidFileId: 'Invalid available file id.',
					requestDownloadFailed: 'Failed to request download.',
					requestDownloadFailedRequest: 'Failed to request download (request: {requestId}).'
				},
				downloadMessages: {
					available: 'File is already available and ready to download.',
					completed: 'Download request is completed and file is ready.',
					queued: 'Download request queued. The file will be available after archive sync completes.'
				},
				mediaRequest: {
					unavailable: 'Not available',
					unavailableBody: 'This {media} is not currently available for access.',
					restoring: 'Restoring',
					restoringBody:
						'Your {media} will be ready shortly. This usually takes a few minutes.',
					archived: 'Stored in archive',
					archivedBody:
						'This {media} is in long-term storage. Request access to view the full file.',
					requestAccess: 'Request access'
				},
				viewer: {
					unavailable: 'Viewer unavailable',
					unavailableBody: 'This object does not yet expose a media viewer contract.',
					pagesOne: '{count} page',
					pagesFew: '{count} pages',
					pagesMany: '{count} pages',
					pagesOther: '{count} pages',
					previewQuality: 'Preview quality',
					ocr: 'OCR',
					pageLabel: 'Page {number}',
					ocrExcerpt: 'OCR excerpt - {page}',
					noOcrPreview: 'No OCR preview is available.',
					listeningRoom: 'Listening room',
					transcript: 'Transcript',
					captions: 'Captions',
					transcriptEmpty: 'Transcript is not available.',
					captionsEmpty: 'Captions are not available.',
					sceneNotes: 'Scene notes',
					previewAvailable: 'Preview available',
					videoPreview: 'Video preview',
					documentScans: 'document scans',
					audioFile: 'audio file',
					videoFile: 'video file',
					zoomIn: 'Zoom in',
					zoomOut: 'Zoom out',
					reset: 'Reset',
					dragToPan: 'Drag to pan',
					zoomToInspect: 'Zoom to inspect',
					loading: 'Loading',
					loadFailed: 'Unable to load preview.'
				},
				values: {
					processing: {
						queued: 'Queued',
						ingesting: 'Ingesting',
						ingested: 'Ingested',
						derivatives_running: 'Derivatives running',
						derivatives_done: 'Derivatives done',
						ocr_running: 'OCR running',
						ocr_done: 'OCR done',
						index_running: 'Index running',
						index_done: 'Index done',
						processing_failed: 'Processing failed',
						processing_skipped: 'Processing skipped'
					},
					curation: {
						needs_review: 'Needs review',
						review_in_progress: 'Review in progress',
						reviewed: 'Reviewed',
						curation_failed: 'Curation failed'
					},
					availability: {
						AVAILABLE: 'Available',
						ARCHIVED: 'Archived',
						RESTORE_PENDING: 'Restore pending',
						RESTORING: 'Restoring',
						UNAVAILABLE: 'Unavailable'
					},
					accessReasons: {
						OK: 'Available',
						FORBIDDEN_POLICY: 'Restricted by policy',
						EMBARGO_ACTIVE: 'Embargo active',
						RESTORE_REQUIRED: 'Restore required',
						RESTORE_IN_PROGRESS: 'Restore in progress',
						TEMP_UNAVAILABLE: 'Temporarily unavailable'
					},
					mediaTypes: {
						document: 'Document',
						image: 'Image',
						audio: 'Audio',
						video: 'Video',
						other: 'Other'
					},
					primarySourceStatus: {
						available: 'Available',
						request_required: 'Request required',
						request_pending: 'Request pending',
						restricted: 'Restricted',
						temporarily_unavailable: 'Temporarily unavailable'
					},
					requestStatus: {
						PENDING: 'Pending',
						PROCESSING: 'Processing',
						COMPLETED: 'Completed',
						FAILED: 'Failed',
						CANCELED: 'Canceled'
					},
					requestAction: {
						artifact_fetch: 'Fetch artifact',
						curation_apply: 'Apply curation',
						object_resync: 'Resync object'
					},
					languages: {
						en: 'English',
						ru: 'Russian',
						mixed: 'Mixed / Unknown',
						unknown: 'Unknown'
					}
				},
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
					countOne: '{count} file',
					countFew: '{count} files',
					countMany: '{count} files',
					countOther: '{count} files',
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
					countOne: '{count} file',
					countFew: '{count} files',
					countMany: '{count} files',
					countOther: '{count} files',
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
					countOne: '{count} request',
					countFew: '{count} requests',
					countMany: '{count} requests',
					countOther: '{count} requests',
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
				expectedTypeFallback: 'the locked batch type',
				previewPurged: 'Preview unavailable: retention period expired',
				previewExpand: 'Expand preview of {name}'
			},
			previewViewer: {
				objectFiles: 'Object files',
				itemsCountOne: '{count} item',
				itemsCountFew: '{count} items',
				itemsCountMany: '{count} items',
				itemsCountOther: '{count} items',
				dialogLabel: 'Preview: {name}',
				dialogLabelFallback: 'File preview',
				counter: '{current} of {total}',
				previous: 'Previous file',
				next: 'Next file',
				close: 'Close preview',
				openFile: 'Preview {name}, {position} of {total}',
				ready: 'Ready',
				pending: 'Preparing',
				pendingNote: 'Preview renders in the background — usually under a minute.',
				checkTimedOut: 'Preview not ready',
				checkTimedOutNote: 'The preview is still being prepared, or its readiness could not be confirmed.',
				checkAgain: 'Check again',
				checkAgainHint: 'Re-checks whether the preview is ready.',
				failed: 'Preview failed',
				failedNote: 'The preview could not be generated for this file.',
				purged: 'Preview purged',
				unsupported: 'No visual preview',
				unsupportedNote: 'This file type has no visual preview.',
				loadFailed: 'Preview could not be loaded',
				loadFailedNote: 'The preview image could not be loaded. The original file is unaffected.'
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
				intentSaveRollback:
					'We could not save that classification and item kind change. Restored the last saved values.',
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
			organize: {
				objectsCountOne: '{count} object',
				objectsCountFew: '{count} objects',
				objectsCountMany: '{count} objects',
				objectsCountOther: '{count} objects',
				filesCountOne: '{count} file',
				filesCountFew: '{count} files',
				filesCountMany: '{count} files',
				filesCountOther: '{count} files',
				totalSuffix: 'total',
				selectedCount: '{count} selected',
				unassignedCount: '{count} unassigned',
				eachSeparate: 'each becomes its own object',
				readySummaryOne: '{count} object ready',
				readySummaryFew: '{count} objects ready',
				readySummaryMany: '{count} objects ready',
				readySummaryOther: '{count} objects ready',
				standaloneWarningOne:
					'You have {count} file that will become its own separate object. Is this correct?',
				standaloneWarningFew:
					'You have {count} files that will each become their own separate object. Is this correct?',
				standaloneWarningMany:
					'You have {count} files that will each become their own separate object. Is this correct?',
				standaloneWarningOther:
					'You have {count} files that will each become their own separate object. Is this correct?',
				groupingWarningOne:
					'You have {count} separate object with 1 file each. If these are pages of the same document, consider grouping them first.',
				groupingWarningFew:
					'You have {count} separate objects with 1 file each. If these are pages of the same document, consider grouping them first.',
				groupingWarningMany:
					'You have {count} separate objects with 1 file each. If these are pages of the same document, consider grouping them first.',
				groupingWarningOther:
					'You have {count} separate objects with 1 file each. If these are pages of the same document, consider grouping them first.',
				dismiss: 'Dismiss',
				contextBannerLead: 'Each group will become',
				contextBannerObject: 'ONE object',
				contextBannerTail: 'in your library.',
				autoGroupToast:
					'✓ Files grouped automatically by filename. Please review and adjust.',
				autoGroupAction: 'Auto-group',
				confirmStandalone: "Yes, that's correct",
				dropMore: 'Drop files to add more',
				dropIntoGroup: 'Drop files here to add them to this group',
				dragToReorder: 'Drag to reorder',
				dragToGroup: 'Drag to a group above',
				removeFile: 'Remove file',
				removeFileAria: 'Remove {name}',
				ungrouped: 'Ungrouped',
				merge: 'Merge',
				split: 'Split',
				clear: 'Clear',
				needsInfo: 'needs info',
				missingFieldsTitle: 'Missing: {fields}',
				oversizedGroupOne:
					'This document has {count} page. Please confirm this grouping before continuing.',
				oversizedGroupFew:
					'This document has {count} pages. Please confirm this grouping before continuing.',
				oversizedGroupMany:
					'This document has {count} pages. Please confirm this grouping before continuing.',
				oversizedGroupOther:
					'This document has {count} pages. Please confirm this grouping before continuing.'
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
					addPerson: 'Add',
					required: 'Required',
					requiredTag: 'Required — add at least one tag',
					peopleUpdatesUnavailable: 'People updates are not available yet.',
					removeTag: 'Remove tag {tag}',
					removePerson: 'Remove person {person}'
				}
			},
			objectGroup: {
				typeLabel: 'Object',
				fileCountOne: '{count} file',
				fileCountFew: '{count} files',
				fileCountMany: '{count} files',
				fileCountOther: '{count} files',
				ungroup: 'Ungroup',
				ungroupDisabledTooltip: 'Cannot ungroup: this item has already been saved to the server.',
				expandAriaLabel: 'Expand group',
				collapseAriaLabel: 'Collapse group',
				defaultLabel: 'Group {id}',
				renameHint: 'Click to rename',
				missingMetadataHint: 'Missing required metadata (title, date, tags)'
			},
			flow: {
				headerKicker: 'Ingestion',
				draftStatus: 'Draft · not yet submitted',
				discard: 'Discard',
				stepOrganize: '1 · Organize',
				stepMetadata: '2 · Metadata',
				autoGroupByFilename: 'Auto-group by filename',
				perObjectMetadata: 'Per-Object Metadata',
				back: 'Back',
				continue: 'Continue',
				preparing: 'Preparing…',
				objectFallback: 'Object {id}',
				submitFailed: 'Failed to submit ingestion.'
			},
			mutations: {
				labels: {
					metadata: 'Object metadata',
					rename: 'Object rename',
					attach: 'File attachment',
					reorder: 'File order'
				},
				failedToSave: '{label} failed to save.',
				couldNotBeSaved: '{label} could not be saved',
				reconcileHint: 'Reload to reconcile saved changes',
				saving: 'Saving object changes…',
				savingBlocked:
					'Saving object changes… Continue and navigation are temporarily disabled.',
				reloadHint: 'Reload the saved setup before making more changes.',
				reloadAction: 'Reload saved setup',
				fallbackSaveMetadata: 'Failed to save object metadata.',
				fallbackRename: 'Failed to rename the object.',
				fallbackAttach: 'Failed to attach the file to the object.',
				fallbackReorder: 'Failed to reorder object files.',
				fallbackUpdateDefaults: 'Failed to update ingestion defaults.',
				fallbackPrepareUpload: 'Failed to prepare upload for {name}.',
				fallbackUpload: 'Failed to upload {name}.',
				fallbackCommit: 'Failed to commit {name}.',
				fallbackInitOrdering: 'Failed to initialize item ordering.',
				fallbackAttachItem: 'Failed to attach file to item.',
				fallbackCreateGroupedItem: 'Failed to create item for grouped files.',
				fallbackCreateStandaloneItem: 'Failed to create item for standalone file.'
			},
			abandon: {
				title: 'Empty batch',
				subtitle: 'No files uploaded yet',
				body: "You haven't uploaded any files. Delete this batch or keep it as a draft to continue later.",
				keepDraft: 'Keep as draft',
				deleting: 'Deleting…',
				retryDelete: 'Retry delete',
				deleteBatch: 'Delete batch',
				sessionExpired: 'Your session expired. Please sign in again.',
				deleteFailed: 'Failed to delete the batch. Check your connection and try again.',
				deleteUnconfirmed: 'Failed to confirm the batch was deleted. Check your connection and try again.'
			}
		},
		footer: {
			note: 'Human intent confirmed. Review everything before ingestion starts.',
			download: 'Download catalog.json',
			start: 'Start ingestion'
		},
		ingestionStatuses: {
			files: {
				pending: 'Pending',
				uploaded: 'Uploaded',
				validated: 'Validated',
				failed: 'Failed'
			},
			items: {
				pending: 'Pending',
				ready: 'Ready',
				processing: 'Processing',
				completed: 'Completed',
				failed: 'Failed',
				skipped: 'Skipped'
			}
		},
		statuses: {
			queued: 'Queued',
			processing: 'Processing',
			extracted: 'Extracted',
			needsReview: 'Needs Review',
			approved: 'Approved',
			blocked: 'Blocked',
			skipped: 'Skipped',
			failed: 'Failed',
			uploaded: 'Uploaded'
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
			librarySubtitle: 'Цифровая библиотека',
			textSize: 'Размер текста',
			locale: 'Интерфейс',
			localeSelector: 'Язык интерфейса',
			signOut: 'Выйти',
			activeBatches: 'Активные партии',
			nav: {
				primaryLabel: 'Основная навигация',
				dashboard: 'Панель',
				ingestion: 'Загрузка',
				overview: 'Обзор',
				newBatch: 'Новая партия',
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
			stepper: {
				ariaLabel: '{label}, шаг {current} из {total}'
			},
			dashboard: {
			title: 'Панель',
			welcome: 'С возвращением, {name}',
			guestName: 'Гость',
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
				roles: {
					admin: {
						primaryAction: 'Проверить запросы доступа',
						secondaryAction: 'Проверить недавнюю активность',
						tagline: 'Контроль системы и управление доступом.'
					},
					archiver: {
						primaryAction: 'Начать новую партию',
						secondaryAction: 'Проверить отмеченные элементы',
						tagline: 'Подготовка и проверка партий загрузки.'
					},
					viewer: {
						primaryAction: 'Открыть последние публикации',
						secondaryAction: 'Посмотреть сводку активности',
						tagline: 'Просмотр утверждённых материалов и отчётов.'
					}
				},
				activity: {
					ingestionUpdated: 'Загрузка {id} обновлена.',
					objectUpdated: 'Объект {id} обновлён.',
					recorded: 'Событие активности зарегистрировано.',
					events: {
						INGESTION_SUBMITTED: 'Загрузка отправлена',
						INGESTION_QUEUED: 'Загрузка поставлена в очередь',
						INGESTION_PROCESSING: 'Загрузка обрабатывается',
						INGESTION_COMPLETED: 'Загрузка завершена',
						INGESTION_FAILED: 'Ошибка загрузки',
						INGESTION_CANCELED: 'Загрузка отменена',
						LEASE_GRANTED: 'Аренда предоставлена',
						LEASE_RENEWED: 'Аренда продлена',
						LEASE_EXPIRED: 'Срок аренды истёк',
						LEASE_RELEASED: 'Аренда освобождена',
						FILE_VALIDATED: 'Файл проверен',
						FILE_FAILED: 'Ошибка файла',
						PIPELINE_STEP_STARTED: 'Этап конвейера начат',
						PIPELINE_STEP_COMPLETED: 'Этап конвейера завершён',
						PIPELINE_STEP_FAILED: 'Ошибка этапа конвейера',
						INGESTION_ITEM_CREATED: 'Элемент загрузки создан',
						INGESTION_ITEM_UPDATED: 'Элемент загрузки обновлён',
						INGESTION_ITEM_PROCESSING: 'Элемент загрузки обрабатывается',
						INGESTION_ITEM_COMPLETED: 'Элемент загрузки завершён',
						INGESTION_ITEM_FAILED: 'Ошибка элемента загрузки',
						OBJECT_CREATED: 'Объект создан',
						ARTIFACT_CREATED: 'Артефакт создан'
					}
				},
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
				'Продолжая, вы подтверждаете, что в этой сессии будут обрабатываться чувствительные архивные материалы.',
			errors: {
				invalidOrigin: 'Недопустимый источник запроса.',
				credentialsRequired: 'Требуются имя пользователя и пароль.',
				invalidCredentials: 'Неверное имя пользователя или пароль.',
					loginFailed: 'Вход не выполнен. Попробуйте ещё раз.',
					generic: 'Не удалось войти. Попробуйте ещё раз.'
			}
		},
		ingestionOverview: {
			title: 'Загрузка',
			heading: 'Обзор партий',
			statsLine: 'Всего партий: {total} · в процессе: {inProgress}',
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
				completed_with_errors: 'Завершено с ошибками',
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
				previewPurged: 'Предпросмотр недоступен: срок хранения истек',
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
				removeTag: 'Удалить тег {tag}',
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
				sensitivityNote: 'Примечание о чувствительности',
				nameLabel: 'Название партии',
				namePlaceholder: 'напр. NoorMags, выпуски 80–82; семейные письма 1974',
				tagsPlaceholder: 'Люди, места, темы — Enter для добавления',
				provenancePlaceholder:
					'Даритель, состояние, контекст — всё, что должен знать следующий архивист.'
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
			cancel: 'Отмена',
			untitledBatch: 'Загрузка без названия {stamp}',
			fallbackTitle: 'Добавить новый материал в архив',
			statusDraft: 'Черновик · ещё не отправлен',
			discard: 'Отменить',
			continueShort: 'Продолжить',
			stepCounter: 'Шаг {current} из {total}',
			pipelineSuggested: '— рекомендовано: {preset}',
			sections: {
				classification: 'Что это представляет?',
				itemKind: 'Какой это тип элемента?',
				pipeline: 'Конвейер обработки',
				provenance: 'Происхождение и примечания'
			},
			steps: {
				configure: 'Настройка',
				upload: 'Загрузка',
				review: 'Проверка'
			},
			itemKinds: {
				scannedDocument: {
					label: 'Сканы страниц',
					sub: 'Физический материал, отсканированный в изображения'
				},
				photo: {
					label: 'Фотография',
					sub: 'Оригинальное фотоизображение'
				},
				audio: {
					label: 'Аудиозапись',
					sub: 'Речь, музыка или звук'
				},
				video: {
					label: 'Видеозапись',
					sub: 'Кино- или видеосъёмка'
				},
				document: {
					label: 'Цифровой документ',
					sub: 'Файл, созданный в цифровом виде (PDF, Word и т. д.)'
				},
				other: {
					label: 'Другое',
					sub: 'Смешанные или неклассифицированные материалы'
				}
			},
			classifications: {
				image: 'Изображение / Фотография'
			},
			languages: {
				mixed: 'Смешанный',
				unknown: 'Неизвестно',
				mixedNative: 'Несколько',
				unknownNative: 'Определить'
			},
			presets: {
				auto: {
					label: 'Авто',
					sub: 'Определить содержимое и запустить подходящие конвейеры'
				},
				ocrText: {
					label: 'OCR + Индекс',
					sub: 'Извлечь текст из сканов и построить поисковый индекс'
				},
				audioTranscript: {
					label: 'Транскрипция аудио',
					sub: 'Преобразование речи в текст с диаризацией говорящих'
				},
				videoTranscript: {
					label: 'Транскрипция видео',
					sub: 'Преобразование речи из видео в текст'
				},
				ocrAudio: {
					label: 'OCR + Аудио',
					sub: 'Извлечь текст и транскрибировать аудиодорожки'
				},
				ocrVideo: {
					label: 'OCR + Видео',
					sub: 'Извлечь текст и транскрибировать видео'
				},
				none: {
					label: 'Только хранение',
					sub: 'Каталогизация и хранение — без ИИ-обработки'
				}
			},
			visibility: {
				private: { label: 'Приватный', sub: 'Только вы' },
				family: { label: 'Команда', sub: 'Ваша команда' },
				public: { label: 'Публичный', sub: 'Все' }
			}
		},
		ingestionReview: {
			kicker: 'Шаг 03 — Проверка перед запуском',
			intro: 'Проверьте сводку перед началом. После отправки файлы будут загружены, а выбранные конвейеры запустятся автоматически.',
			stampReady: 'Готово к отправке',
			backToSetup: 'Назад к настройке',
			discard: 'Отменить',
			submitting: 'Отправка…',
			beginProcessing: 'Начать обработку',
			stats: {
				filesIncluded: 'Файлов включено',
				skippedCount: '{count} пропущено',
				allIncluded: 'включены все',
				totalVolume: 'Общий объём',
				toUpload: 'к загрузке',
				language: 'Язык',
				primary: 'основной',
				pipeline: 'Конвейер',
				presetSub: 'набор'
			},
			flow: {
				upload: 'Загрузка',
				detect: 'Автоопределение',
				transcribe: 'Транскрипция',
				archive: 'Архив'
			},
			table: {
				name: 'Название',
				moreFilesOne: 'ещё {count} файл',
				moreFilesOther: 'ещё {count} файлов',
				moreFilesFew: 'ещё {count} файла',
				moreFilesMany: 'ещё {count} файлов',
				empty: 'Нет файлов для обработки.'
			},
			confirm: {
				title: 'Я понимаю, что будет обработано, и хочу начать.',
				body: 'Файлы будут загружены, и конвейеры запустятся. Это действие нельзя отменить без отмены партии.'
			},
			summary: {
				kind: 'Вид',
				language: 'Язык',
				pipeline: 'Конвейер',
				visibility: 'Доступ'
			},
			counts: {
				title: 'Счётчики',
				filesToProcess: 'Файлов к обработке',
				skipped: 'Пропущено',
				totalUpload: 'Общий объём',
				objects: 'Объекты'
			},
			footprint: {
				title: 'След конвейера',
				none: 'Только хранение — без ИИ-обработки.',
				detect: 'Конвейеры выбираются автоматически',
				upload: 'Загрузка',
				ocr: 'OCR',
				index: 'Индекс',
				transcribe: 'Транскрипция',
				archive: 'Архив'
			},
			kind: {
				scanned_document: 'Газета',
				photo: 'Фотография',
				audio: 'Аудио',
				video: 'Видео',
				document: 'Документ',
				other: 'Другое'
			},
			preset: {
				auto: 'Авто',
				ocr_text: 'OCR + Индекс',
				audio_transcript: 'Транскрипция',
				video_transcript: 'Транскрипция видео',
				ocr_and_audio_transcript: 'OCR + Аудио',
				ocr_and_video_transcript: 'OCR + Видео',
				none: 'Только хранение'
			},
			visibility: {
				private: 'Приватный',
				family: 'Команда',
				public: 'Публичный'
			},
			errors: {
				submitFailed: 'Не удалось отправить загрузку.'
			}
		},
		objectEdit: {
			pageTitle: 'Редактирование: {title} — Архив Осими',
			errors: {
				objectNotFound: 'Объект не найден.',
				highlightedFields: 'Проверьте выделенные поля.',
				invalidPayload: 'Недопустимые данные формы.',
				saveForbidden: 'У вас нет разрешения сохранять этот черновик.',
				changedBeforeSave: 'Объект изменился во время редактирования. Проверьте обновлённые значения перед повторной попыткой.',
				partialConflict: 'Метаданные сохранены, но перед повторной попыткой нужно проверить курирование документа.',
				partialFailedReview: 'Метаданные сохранены, но курирование документа не удалось. Проверьте обновлённые значения.',
				partialFailedRefresh: 'Метаданные сохранены, но курирование документа не удалось. Обновите страницу.',
				validationFailed: 'Проверьте выделенные поля и повторите попытку.',
				saveFailed: 'Не удалось сохранить черновик.',
				ocrUnavailable: 'Страницы OCR недоступны. Синхронизируйте объект перед публикацией курированного OCR.',
				publishForbidden: 'У вас нет разрешения публиковать курированный OCR.',
				changedBeforePublish: 'Объект изменился во время редактирования. Проверьте обновлённые значения перед публикацией.',
				publishFailed: 'Не удалось опубликовать курированный OCR.',
				withRequest: '{message} (запрос: {id})'
			},
			fieldErrors: {
				titleRequired: 'Введите название.',
				publicationDateInvalid: 'Дата публикации не соответствует выбранной точности.',
				tagsBlank: 'Теги не могут быть пустыми.',
				peopleBlank: 'Имена людей не могут быть пустыми.',
				pagesInvalid: 'Проверьте значения курирования страниц.',
				invalidValue: 'Введите допустимое значение.'
			},
			backToObject: '← Объект',
			state: {
				unsaved: 'Есть несохранённые изменения',
				clean: 'Нет изменений'
			},
			lockConflictBanner:
				'Другой пользователь начал редактировать этот объект. Ваши изменения не удалось сохранить.',
			refresh: 'Обновить',
			recovery: {
				partial:
					'Частичное сохранение восстановлено. Проверьте и повторите оставшиеся изменения.',
				full: 'Серверные изменения загружены. Проверьте ваши перебазированные правки перед повторной попыткой.'
			},
			saveDraft: 'Сохранить черновик',
			saving: 'Сохранение…',
			publish: {
				disabledNoPages: 'Страницы OCR недоступны',
				disabledDirty: 'Сохраните изменения перед публикацией',
				disabledActive: 'Публикация уже выполняется',
				processing: 'Публикация…',
				queued: 'Публикация в очереди',
				submit: 'Опубликовать курированный OCR',
				unavailable: 'OCR недоступен'
			},
			lockedBanner:
				'Этот объект сейчас редактирует другой пользователь. Он станет доступен после завершения.',
			noProjection: {
				title: 'Курированный OCR пока нельзя опубликовать.',
				body: 'У этого документа нет синхронизированных OCR-страниц. Вы по-прежнему можете сохранять изменения метаданных.',
				resyncLink: 'Вернитесь к объекту, чтобы запросить синхронизацию.'
			},
			publication: {
				statusPENDING: 'Публикация курированного OCR поставлена в очередь.',
				statusPROCESSING: 'Курированный OCR публикуется в архив.',
				statusCOMPLETED: 'Курированный OCR успешно опубликован.',
				statusFAILED: 'Публикация курированного OCR не удалась{suffix}',
				statusCANCELED: 'Публикация курированного OCR отменена.',
				requestId: 'Запрос {id}',
				statusUnavailable: 'Статус публикации временно недоступен.'
			},
			pages: {
				countOne: 'Страница: {count}',
				countFew: 'Страницы: {count}',
				countMany: 'Страниц: {count}',
				countOther: 'Страниц: {count}',
				fallback: 'Страницы документа',
				pageLabel: 'Страница {number}',
				hasCuratedText: 'Есть курированный текст',
				statusEdited: 'Отредактировано',
				statusMachine: 'Машинный OCR',
				previous: 'Предыдущая страница',
				next: 'Следующая страница',
				counter: '{current} / {total}'
			},
			editor: {
				inProgress: 'Курирование выполняется — сравните источник и уточните ниже',
				empty: 'Курированного текста пока нет — скопируйте из источника или напишите с нуля',
				details: 'Детали',
				confidence: '{confidence}% уверенности',
				readOnly: 'Только чтение',
				noSourceText: 'Исходный текст недоступен',
				copyFromSource: 'Скопировать из источника',
				reset: 'Сбросить',
				curatedPlaceholder:
					'Введите курированный текст или скопируйте из источника и отредактируйте…'
			},
			diff: {
				sourceLabel: 'OCR-текст',
				curatedLabel: 'Курированный текст'
			},
			sections: {
				details: 'Детали',
				rightsAccess: 'Права и доступ',
				objectDetails: 'Детали объекта'
			},
			metadata: {
				readOnly: 'Метаданные доступны только для чтения для вашей роли.',
				title: 'Название',
				datePrecision: 'Точность даты',
				precisionNone: 'Без даты',
				precisionYear: 'Год',
				precisionMonth: 'Год и месяц',
				precisionDay: 'Полная дата',
				yearPlaceholder: 'ГГГГ',
				monthPlaceholder: 'ГГГГ-ММ',
				dayPlaceholder: 'ГГГГ-ММ-ДД',
				approximateDate: 'Приблизительная дата',
				language: 'Язык',
				languagePlaceholder: 'напр. Таджикский',
				tags: 'Теги',
				addTagPlaceholder: 'Добавить тег…',
				people: 'Люди',
				addPersonPlaceholder: 'Добавить человека…',
				description: 'Описание',
				descriptionPlaceholder: 'Описание…',
				add: 'Добавить',
				removeTag: 'Удалить тег {tag}',
				removePerson: 'Удалить человека {person}'
			},
			intro: {
				image:
					'У изображений нет машинно извлечённого текста — дополните метаданные и настройки доступа напрямую.',
				audioVideo:
					'Курирование транскриптов для объектов типа {kind} пока недоступно. Метаданные можно редактировать ниже.',
				default: 'Редактируйте метаданные и настройки доступа этого объекта.'
			},
			publishDialog: {
				title: 'Опубликовать курированный OCR?',
				body: 'Будет опубликован текущий сохранённый OCR как асинхронное обновление архива. Изменения метаданных сохраняются отдельно, несохранённые изменения не войдут в публикацию.',
				noteLabel: 'Примечание к публикации',
				optional: '(необязательно)',
				notePlaceholder: 'Опишите контекст для истории правок',
				noteHint: 'Это примечание записывается в историю правок и не отправляется рецензенту.',
				queueing: 'Постановка в очередь…',
				queue: 'Поставить в очередь'
			},
			rights: {
				accessLevel: 'Уровень доступа',
				readOnly: '(только чтение)',
				rightsNote: 'Примечание о правах',
				rightsNotePlaceholder: 'Примечание о правах…',
				sensitivityNote: 'Примечание о чувствительности',
				sensitivityNotePlaceholder: 'Примечание о чувствительности…'
			}
		},
		objects: {
			header: {
				kicker: 'Каталог',
				title: 'Объекты',
				subtitle: 'Каталог архивных объектов с состояниями доступа и доступности.',
				matchingOne: '{filtered} совпадение · всего {total}',
				matchingFew: '{filtered} совпадения · всего {total}',
				matchingMany: '{filtered} совпадений · всего {total}',
				matchingOther: '{filtered} совпадений · всего {total}',
				totalCount: 'Всего: {total}',
				bulkActions: 'Массовые действия',
				selectVisible: 'Выбрать видимые',
				clearSelection: 'Снять выбор',
				copySelectionIds: 'Копировать выбранные ID',
				copiedSelection: 'ID скопированы',
				selectionState: 'Выбрано {selected} из {visible} видимых'
			},
			filters: {
				searchPlaceholder: 'Заголовок, ID объекта, индексированные OCR/транскрипты...',
				search: 'Поиск',
				hint: 'Только материализованный текст OCR/транскриптов. Нажмите Enter для поиска.',
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
				lastCountOne: 'Последний {count} объект',
				lastCountFew: 'Последние {count} объекта',
				lastCountMany: 'Последние {count} объектов',
				lastCountOther: 'Последние {count} объектов',
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
				materializedPdf: 'Материализованный PDF-производный файл',
				materializedOcr: 'Материализованный OCR-текст',
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
				ru: 'Русский (ru)',
				mixed: 'Смешанный',
				unknown: 'Неизвестно'
			},
			types: {
				GENERIC: 'Общий',
				IMAGE: 'Изображение',
				AUDIO: 'Аудио',
				VIDEO: 'Видео',
				DOCUMENT: 'Документ'
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
				typeObject: 'Объект типа {type}',
				fallbackDescription:
					'Осмотр объекта в режиме чтения с медиа-доступом, артефактами предпросмотра и поведением на основе запросов.',
				viewMode: 'Режим просмотра',
				edit: 'Редактировать',
				support: 'Поддержка',
				review: {
					available: 'Медиа доступно в режиме чтения',
					requestPending: 'Запрос основного медиа обрабатывается',
					requestRequired: 'Основное медиа доступно по запросу',
					restricted: 'Только артефакты предпросмотра',
					readOnly: 'Осмотр объекта в режиме чтения'
				},
				chips: {
					requestRequired: 'Требуется запрос',
					requestPending: 'Запрос отправлен',
					availableNow: 'Доступно сейчас'
				},
				topBar: {
					back: 'Назад',
					info: 'Информация',
					resyncing: 'Синхронизация…',
					resync: 'Синхронизировать'
				},
				info: {
					kicker: 'Информация об объекте',
					description:
						'Метаданные остаются вторичными, чтобы объект оставался в центре в режиме просмотра.',
					type: 'Тип',
					language: 'Язык',
					created: 'Создан',
					updated: 'Обновлён',
					batch: 'Партия',
					ingestion: 'Загрузка',
					tags: 'Теги',
					descriptionTitle: 'Описание',
					noDescription: 'Описание недоступно.',
					rightsNote: 'Примечание о правах',
					sensitivityNote: 'Примечание о чувствительности',
					close: 'Закрыть панель информации',
					closeBackdrop: 'Закрыть детали'
				},
				supportSheet: {
					kicker: 'Поддержка',
					expand: 'Развернуть панель поддержки',
					collapse: 'Свернуть панель поддержки',
					close: 'Закрыть панель поддержки'
				},
				errors: {
					loadArtifacts: 'Не удалось загрузить артефакты объекта.',
					loadArtifactsRequest: 'Не удалось загрузить артефакты объекта (запрос: {requestId}).',
					loadAvailableFiles: 'Не удалось загрузить доступные архивные файлы.',
					loadAvailableFilesRequest: 'Не удалось загрузить доступные архивные файлы (запрос: {requestId}).',
					loadPendingRequests: 'Не удалось загрузить ожидающие запросы.',
					loadPendingRequestsRequest: 'Не удалось загрузить ожидающие запросы (запрос: {requestId}).',
					missingFileId: 'Отсутствует ID доступного файла.',
					invalidFileId: 'Неверный ID доступного файла.',
					requestDownloadFailed: 'Не удалось запросить скачивание.',
					requestDownloadFailedRequest: 'Не удалось запросить скачивание (запрос: {requestId}).'
				},
				downloadMessages: {
					available: 'Файл уже доступен и готов к скачиванию.',
					completed: 'Запрос на скачивание выполнен, файл готов.',
					queued: 'Запрос на скачивание поставлен в очередь. Файл будет доступен после завершения синхронизации архива.'
				},
				mediaRequest: {
					unavailable: 'Недоступно',
					unavailableBody: '{media} в настоящее время недоступно для доступа.',
					restoring: 'Восстановление',
					restoringBody:
						'{media} скоро будет готово. Обычно это занимает несколько минут.',
					archived: 'Хранится в архиве',
					archivedBody:
						'{media} находится в долгосрочном хранилище. Запросите доступ для просмотра полного файла.',
					requestAccess: 'Запросить доступ'
				},
				viewer: {
					unavailable: 'Просмотр недоступен',
					unavailableBody: 'Этот объект пока не предоставляет контракт медиапросмотра.',
					pagesOne: '{count} страница',
					pagesFew: '{count} страницы',
					pagesMany: '{count} страниц',
					pagesOther: '{count} страниц',
					previewQuality: 'Качество предпросмотра',
					ocr: 'OCR',
					pageLabel: 'Страница {number}',
					ocrExcerpt: 'Фрагмент OCR — {page}',
					noOcrPreview: 'Предпросмотр OCR недоступен.',
					listeningRoom: 'Комната прослушивания',
					transcript: 'Транскрипция',
					captions: 'Субтитры',
					transcriptEmpty: 'Транскрипция недоступна.',
					captionsEmpty: 'Субтитры недоступны.',
					sceneNotes: 'Заметки сцены',
					previewAvailable: 'Предпросмотр доступен',
					videoPreview: 'Предпросмотр видео',
					documentScans: 'сканы документа',
					audioFile: 'аудиофайл',
					videoFile: 'видеофайл',
					zoomIn: 'Приблизить',
					zoomOut: 'Отдалить',
					reset: 'Сбросить',
					dragToPan: 'Перетащите для панорамы',
					zoomToInspect: 'Приблизить для осмотра',
					loading: 'Загрузка',
					loadFailed: 'Не удалось загрузить предпросмотр.'
				},
				values: {
					processing: {
						queued: 'В очереди',
						ingesting: 'Загрузка',
						ingested: 'Загружено',
						derivatives_running: 'Производные создаются',
						derivatives_done: 'Производные готовы',
						ocr_running: 'OCR выполняется',
						ocr_done: 'OCR готов',
						index_running: 'Индексирование',
						index_done: 'Индекс готов',
						processing_failed: 'Обработка не удалась',
						processing_skipped: 'Обработка пропущена'
					},
					curation: {
						needs_review: 'Нужна проверка',
						review_in_progress: 'Идёт проверка',
						reviewed: 'Проверено',
						curation_failed: 'Курация не удалась'
					},
					availability: {
						AVAILABLE: 'Доступен',
						ARCHIVED: 'В архиве',
						RESTORE_PENDING: 'Восстановление ожидается',
						RESTORING: 'Восстанавливается',
						UNAVAILABLE: 'Недоступен'
					},
					accessReasons: {
						OK: 'Доступно',
						FORBIDDEN_POLICY: 'Ограничено политикой',
						EMBARGO_ACTIVE: 'Действует эмбарго',
						RESTORE_REQUIRED: 'Требуется восстановление',
						RESTORE_IN_PROGRESS: 'Идёт восстановление',
						TEMP_UNAVAILABLE: 'Временно недоступно'
					},
					mediaTypes: {
						document: 'Документ',
						image: 'Изображение',
						audio: 'Аудио',
						video: 'Видео',
						other: 'Другое'
					},
					primarySourceStatus: {
						available: 'Доступен',
						request_required: 'Нужен запрос',
						request_pending: 'Запрос обрабатывается',
						restricted: 'Ограничено',
						temporarily_unavailable: 'Временно недоступно'
					},
					requestStatus: {
						PENDING: 'Ожидает',
						PROCESSING: 'Выполняется',
						COMPLETED: 'Завершён',
						FAILED: 'Ошибка',
						CANCELED: 'Отменён'
					},
					requestAction: {
						artifact_fetch: 'Получение артефакта',
						curation_apply: 'Применение курации',
						object_resync: 'Синхронизация объекта'
					},
					languages: {
						en: 'Английский',
						ru: 'Русский',
						mixed: 'Смешанный / неизвестен',
						unknown: 'Неизвестен'
					}
				},
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
					raw: 'Исходные данные'
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
					countOne: '{count} файл',
					countFew: '{count} файла',
					countMany: '{count} файлов',
					countOther: '{count} файлов',
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
					countOne: '{count} файл',
					countFew: '{count} файла',
					countMany: '{count} файлов',
					countOther: '{count} файлов',
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
					countOne: '{count} запрос',
					countFew: '{count} запроса',
					countMany: '{count} запросов',
					countOther: '{count} запросов',
					empty: 'Активных запросов нет.',
					action: 'Действие',
					status: 'Статус',
					requested: 'Запрошено'
				},
				manifest: {
					title: 'Манифест загрузки',
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
				expectedTypeFallback: 'зафиксированный тип партии',
				previewPurged: 'Предпросмотр недоступен: срок хранения истек',
				previewExpand: 'Развернуть предпросмотр {name}'
			},
			previewViewer: {
				objectFiles: 'Файлы объекта',
				itemsCountOne: 'Файл: {count}',
				itemsCountFew: 'Файла: {count}',
				itemsCountMany: 'Файлов: {count}',
				itemsCountOther: 'Файлов: {count}',
				dialogLabel: 'Предпросмотр: {name}',
				dialogLabelFallback: 'Предпросмотр файла',
				counter: '{current} из {total}',
				previous: 'Предыдущий файл',
				next: 'Следующий файл',
				close: 'Закрыть предпросмотр',
				openFile: 'Предпросмотр {name}, {position} из {total}',
				ready: 'Готов',
				pending: 'Подготовка',
				pendingNote: 'Предпросмотр создается в фоне — обычно в течение минуты.',
				checkTimedOut: 'Предпросмотр не готов',
				checkTimedOutNote: 'Предпросмотр все еще готовится, либо его готовность не удалось подтвердить.',
				checkAgain: 'Проверить снова',
				checkAgainHint: 'Повторно проверяет готовность предпросмотра.',
				failed: 'Предпросмотр не удался',
				failedNote: 'Предпросмотр для этого файла не удалось создать.',
				purged: 'Предпросмотр очищен',
				unsupported: 'Нет визуального предпросмотра',
				unsupportedNote: 'Для этого типа файла нет визуального предпросмотра.',
				loadFailed: 'Не удалось загрузить предпросмотр',
				loadFailedNote: 'Изображение предпросмотра не загрузилось. Исходный файл не пострадал.'
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
				intentSaveRollback:
					'Не удалось сохранить изменение типа классификации и вида элемента. Восстановлены последние сохраненные значения.',
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
			organize: {
				objectsCountOne: '{count} объект',
				objectsCountFew: '{count} объекта',
				objectsCountMany: '{count} объектов',
				objectsCountOther: '{count} объектов',
				filesCountOne: '{count} файл',
				filesCountFew: '{count} файла',
				filesCountMany: '{count} файлов',
				filesCountOther: '{count} файлов',
				totalSuffix: 'всего',
				selectedCount: 'Выбрано: {count}',
				unassignedCount: '{count} не распределено',
				eachSeparate: 'каждый станет отдельным объектом',
				readySummaryOne: 'Готов {count} объект',
				readySummaryFew: 'Готово {count} объекта',
				readySummaryMany: 'Готово {count} объектов',
				readySummaryOther: 'Готово {count} объектов',
				standaloneWarningOne:
					'У вас {count} файл, который станет отдельным объектом. Это верно?',
				standaloneWarningFew:
					'У вас {count} файла, каждый из которых станет отдельным объектом. Это верно?',
				standaloneWarningMany:
					'У вас {count} файлов, каждый из которых станет отдельным объектом. Это верно?',
				standaloneWarningOther:
					'У вас {count} файлов, каждый из которых станет отдельным объектом. Это верно?',
				groupingWarningOne:
					'У вас {count} отдельный объект с 1 файлом. Если это страницы одного документа, подумайте о группировке.',
				groupingWarningFew:
					'У вас {count} отдельных объекта с 1 файлом каждый. Если это страницы одного документа, подумайте о группировке.',
				groupingWarningMany:
					'У вас {count} отдельных объектов с 1 файлом каждый. Если это страницы одного документа, подумайте о группировке.',
				groupingWarningOther:
					'У вас {count} отдельных объектов с 1 файлом каждый. Если это страницы одного документа, подумайте о группировке.',
				dismiss: 'Скрыть',
				contextBannerLead: 'Каждая группа станет',
				contextBannerObject: 'ОДНИМ объектом',
				contextBannerTail: 'в вашей библиотеке.',
				autoGroupToast:
					'✓ Файлы автоматически сгруппированы по имени. Проверьте и при необходимости скорректируйте.',
				autoGroupAction: 'Сгруппировать',
				confirmStandalone: 'Да, всё верно',
				dropMore: 'Перетащите файлы, чтобы добавить ещё',
				dropIntoGroup: 'Перетащите файлы сюда, чтобы добавить их в эту группу',
				dragToReorder: 'Перетащите для изменения порядка',
				dragToGroup: 'Перетащите в группу выше',
				removeFile: 'Удалить файл',
				removeFileAria: 'Удалить {name}',
				ungrouped: 'Без группы',
				merge: 'Объединить',
				split: 'Разделить',
				clear: 'Очистить',
				needsInfo: 'нужны данные',
				missingFieldsTitle: 'Не хватает: {fields}',
				oversizedGroupOne:
					'В этом документе {count} страница. Проверьте группировку перед продолжением.',
				oversizedGroupFew:
					'В этом документе {count} страницы. Проверьте группировку перед продолжением.',
				oversizedGroupMany:
					'В этом документе {count} страниц. Проверьте группировку перед продолжением.',
				oversizedGroupOther:
					'В этом документе {count} страниц. Проверьте группировку перед продолжением.'
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
					addPerson: 'Добавить',
					required: 'Обязательно',
					requiredTag: 'Обязательно — добавьте хотя бы один тег',
					peopleUpdatesUnavailable: 'Обновление списка людей пока недоступно.',
					removeTag: 'Удалить тег {tag}',
					removePerson: 'Удалить человека {person}'
				}
			},
			objectGroup: {
				typeLabel: 'Объект',
				fileCountOne: '{count} файл',
				fileCountFew: '{count} файла',
				fileCountMany: '{count} файлов',
				fileCountOther: '{count} файлов',
				ungroup: 'Разгруппировать',
				ungroupDisabledTooltip: 'Нельзя разгруппировать: этот элемент уже сохранён на сервере.',
				expandAriaLabel: 'Развернуть группу',
				collapseAriaLabel: 'Свернуть группу',
				defaultLabel: 'Группа {id}',
				renameHint: 'Нажмите, чтобы переименовать',
				missingMetadataHint: 'Отсутствуют обязательные метаданные (название, дата, теги)'
			},
			flow: {
				headerKicker: 'Загрузка',
				draftStatus: 'Черновик · ещё не отправлен',
				discard: 'Отменить',
				stepOrganize: '1 · Организация',
				stepMetadata: '2 · Метаданные',
				autoGroupByFilename: 'Автогруппировка по имени файла',
				perObjectMetadata: 'Метаданные по объектам',
				back: 'Назад',
				continue: 'Продолжить',
				preparing: 'Подготовка…',
				objectFallback: 'Объект {id}',
				submitFailed: 'Не удалось отправить загрузку.'
			},
			mutations: {
				labels: {
					metadata: 'Метаданные объекта',
					rename: 'Переименование объекта',
					attach: 'Прикрепление файла',
					reorder: 'Порядок файлов'
				},
				failedToSave: 'Не удалось сохранить: {label}.',
				couldNotBeSaved: 'Не удалось сохранить: {label}',
				reconcileHint: 'Перезагрузите, чтобы применить сохранённые изменения',
				saving: 'Сохранение изменений объекта…',
				savingBlocked:
					'Сохранение изменений объекта… Кнопка «Продолжить» и навигация временно отключены.',
				reloadHint: 'Перезагрузите сохранённую настройку перед дальнейшими изменениями.',
				reloadAction: 'Перезагрузить сохранённую настройку',
				fallbackSaveMetadata: 'Не удалось сохранить метаданные объекта.',
				fallbackRename: 'Не удалось переименовать объект.',
				fallbackAttach: 'Не удалось прикрепить файл к объекту.',
				fallbackReorder: 'Не удалось изменить порядок файлов объекта.',
				fallbackUpdateDefaults: 'Не удалось обновить параметры загрузки по умолчанию.',
				fallbackPrepareUpload: 'Не удалось подготовить загрузку файла {name}.',
				fallbackUpload: 'Не удалось загрузить файл {name}.',
				fallbackCommit: 'Не удалось подтвердить загрузку файла {name}.',
				fallbackInitOrdering: 'Не удалось инициализировать порядок элементов.',
				fallbackAttachItem: 'Не удалось прикрепить файл к элементу.',
				fallbackCreateGroupedItem: 'Не удалось создать элемент для сгруппированных файлов.',
				fallbackCreateStandaloneItem: 'Не удалось создать элемент для отдельного файла.'
			},
			abandon: {
				title: 'Пустая партия',
				subtitle: 'Файлы ещё не загружены',
				body: 'Вы ещё не загрузили ни одного файла. Удалите партию или оставьте её как черновик, чтобы продолжить позже.',
				keepDraft: 'Оставить как черновик',
				deleting: 'Удаление…',
				retryDelete: 'Повторить удаление',
				deleteBatch: 'Удалить партию',
				sessionExpired: 'Сеанс истёк. Войдите снова.',
				deleteFailed: 'Не удалось удалить партию. Проверьте соединение и попробуйте снова.',
				deleteUnconfirmed: 'Не удалось подтвердить удаление партии. Проверьте соединение и попробуйте снова.'
			}
		},
		footer: {
			note: 'Человеческий замысел подтвержден. Проверьте все до запуска.',
			download: 'Скачать catalog.json',
			start: 'Начать обработку'
		},
		ingestionStatuses: {
			files: {
				pending: 'Ожидает',
				uploaded: 'Загружен',
				validated: 'Проверен',
				failed: 'Ошибка'
			},
			items: {
				pending: 'Ожидает',
				ready: 'Готов',
				processing: 'Обработка',
				completed: 'Завершён',
				failed: 'Ошибка',
				skipped: 'Пропущен'
			}
		},
		statuses: {
			queued: 'В очереди',
			processing: 'В обработке',
			extracted: 'Извлечено',
			needsReview: 'Нужна проверка',
			approved: 'Одобрено',
			blocked: 'Заблокировано',
			skipped: 'Пропущено',
			failed: 'Ошибка',
			uploaded: 'Загружен'
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

type LeafPaths<T> = {
	[K in keyof T & string]: T[K] extends string
		? K
		: T[K] extends Record<string, unknown>
			? `${K}.${LeafPaths<T[K]>}`
			: never;
}[keyof T & string];

export type TranslationKey = LeafPaths<typeof translations.en>;

export type TranslationDictionary = (typeof translations)[LocaleKey];
