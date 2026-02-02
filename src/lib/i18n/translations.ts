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
