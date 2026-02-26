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
			locale: 'UI'
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
				language: 'Default language',
				classificationType: 'Document type',
				tags: 'Tags',
				pipelinePreset: 'Pipeline preset',
				selectLanguage: 'Select language',
				selectType: 'Select type',
				tagsPlaceholder: 'People, places, themes'
			},
			languages: {
				en: 'English',
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
				photo: 'Photo',
				letter: 'Letter',
				speech: 'Speech',
				interview: 'Interview',
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
				missing: 'Language and document type are required for each file.',
				missingCount: 'Missing fields on {count} files.',
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
				pipeline: 'Pipeline'
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
			locale: 'Интерфейс'
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
				language: 'Язык по умолчанию',
				classificationType: 'Тип документа',
				tags: 'Теги',
				pipelinePreset: 'Набор конвейеров',
				selectLanguage: 'Выберите язык',
				selectType: 'Выберите тип',
				tagsPlaceholder: 'Люди, места, темы'
			},
			languages: {
				en: 'Английский',
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
				photo: 'Фотография',
				letter: 'Письмо',
				speech: 'Выступление',
				interview: 'Интервью',
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
				missing: 'Для каждого файла требуются язык и тип документа.',
				missingCount: 'Не заполнены поля у {count} файлов.',
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
				pipeline: 'Конвейер'
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
