import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

const { beforeNavigateMock, gotoMock } = vi.hoisted(() => ({
	beforeNavigateMock: vi.fn(),
	gotoMock: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	beforeNavigate: beforeNavigateMock,
	goto: gotoMock
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string, params?: Record<string, string>) =>
		params
			? Object.entries(params).reduce((result, [key, value]) => result.replace(`[${key}]`, value), path)
			: path
}));

import ReviewPage from './+page.svelte';
import type { IngestionDetailFile } from '$lib/services/ingestionDetail';
import type { PageData } from './$types';

const makeFile = (overrides: Partial<IngestionDetailFile> = {}): IngestionDetailFile => ({
	id: 'file-1',
	name: 'page-1.jpg',
	status: 'uploaded',
	statusRaw: 'uploaded',
	contentType: 'image/jpeg',
	sizeBytes: 100,
	createdAt: null,
	preview: {
		status: 'ready',
		contentType: 'image/jpeg',
		width: 640,
		height: 480,
		url: '/api/ingestions/batch-1/files/file-1/preview'
	},
	...overrides
});

const pageData = (): PageData => ({
	session: null,
	activeBatches: [],
	batchId: 'batch-1',
	batchLabel: 'Batch label',
	classificationType: 'document',
	itemKind: 'photo',
	languageCode: 'en',
	pipelinePreset: 'none',
	accessLevel: 'private',
	summary: {
		title: { primary: 'Batch title', original_script: null, translations: [] },
		classification: { tags: [], summary: null },
		dates: {
			published: { value: null, approximate: false, confidence: 'medium', note: null },
			created: { value: null, approximate: false, confidence: 'medium', note: null }
		}
	},
	enabledFiles: [makeFile()],
	skippedFiles: [],
	totalSizeBytes: 100,
	items: []
});

describe('/ingestion/[batchId]/review +page.svelte', () => {
	beforeEach(() => {
		beforeNavigateMock.mockReset();
		gotoMock.mockReset();
		gotoMock.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		locale.setLocale('en');
	});

	it('renders a thumbnail for files with a ready preview', async () => {
		render(ReviewPage, { data: pageData() });

		const thumbnail = page.getByRole('img', { name: 'page-1.jpg' });
		await expect.element(thumbnail).toBeInTheDocument();
		await expect
			.element(thumbnail)
			.toHaveAttribute('src', '/ingestion/batch-1/files/file-1/preview');
	});

	it('does not render a thumbnail for files without a ready preview', async () => {
		const data = pageData();
		data.enabledFiles = [
			makeFile({
				id: 'file-2',
				name: 'page-2.jpg',
				preview: { status: 'pending', contentType: null, width: null, height: null, url: null }
			})
		];

		render(ReviewPage, { data });

		await expect
			.element(page.getByRole('img', { name: 'page-2.jpg' }))
			.not.toBeInTheDocument();
	});

	it('renders localized English review copy', async () => {
		render(ReviewPage, { data: pageData() });

		await expect.element(page.getByText('Step 03 — Review what will run')).toBeInTheDocument();
		await expect.element(page.getByText('Files included')).toBeInTheDocument();
		await expect
			.element(page.getByText('Ready to submit', { exact: true }).first())
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Begin processing' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Back to setup' })).toBeInTheDocument();
	});

	it('renders localized Russian review copy', async () => {
		locale.setLocale('ru');
		render(ReviewPage, { data: pageData() });

		await expect
			.element(page.getByText('Шаг 03 — Проверка перед запуском'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Файлов включено')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Начать обработку' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: 'Назад к настройке' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Проверка, шаг 3 из 3' })).toBeInTheDocument();
	});

	it('retranslates after switching locale without remounting', async () => {
		render(ReviewPage, { data: pageData() });

		await expect.element(page.getByText('Files included')).toBeInTheDocument();
		locale.setLocale('ru');

		await expect.element(page.getByText('Файлов включено')).toBeInTheDocument();
	});

	it('shows the structured summary title as the page heading', async () => {
		render(ReviewPage, { data: pageData() });

		await expect
			.element(page.getByRole('heading', { level: 1, name: 'Batch title' }))
			.toBeInTheDocument();
	});

	it('supports a legacy string title', async () => {
		const data = pageData();
		data.summary = {
			...data.summary,
			title: 'Legacy string title' as unknown as typeof data.summary.title
		};
		render(ReviewPage, { data });

		await expect
			.element(page.getByRole('heading', { level: 1, name: 'Legacy string title' }))
			.toBeInTheDocument();
	});

	it('falls back to the batch label when the title is missing', async () => {
		const data = pageData();
		data.summary = { ...data.summary, title: null as unknown as typeof data.summary.title };
		render(ReviewPage, { data });

		await expect
			.element(page.getByRole('heading', { level: 1, name: 'Batch label' }))
			.toBeInTheDocument();
	});

	it.each([
		{ id: 'auto', en: 'Auto', ocr: false, transcribe: false },
		{ id: 'none', en: 'Store only', ocr: false, transcribe: false },
		{ id: 'ocr_text', en: 'OCR + Index', ocr: true, transcribe: false },
		{ id: 'audio_transcript', en: 'Transcribe', ocr: false, transcribe: true },
		{ id: 'video_transcript', en: 'Transcribe Video', ocr: false, transcribe: true },
		{
			id: 'ocr_and_audio_transcript',
			en: 'OCR + Audio',
			ocr: true,
			transcribe: true
		},
		{
			id: 'ocr_and_video_transcript',
			en: 'OCR + Video',
			ocr: true,
			transcribe: true
		}
	])(
		'renders preset $id with a localized label and correct stages',
		async ({ id, en, ocr, transcribe }) => {
			const data = pageData();
			data.pipelinePreset = id;
			render(ReviewPage, { data });

			await expect
				.element(page.getByText(en, { exact: true }).first())
				.toBeInTheDocument();
			if (ocr) {
				await expect
					.element(page.getByText('OCR', { exact: true }).first())
					.toBeInTheDocument();
			}
			if (transcribe) {
				await expect
					.element(page.getByText('Transcribe', { exact: true }).first())
					.toBeInTheDocument();
			}
			await expect.element(page.getByText(id, { exact: true })).not.toBeInTheDocument();
		}
	);

	it('describes auto as automatic detection without claiming concrete stages', async () => {
		const data = pageData();
		data.pipelinePreset = 'auto';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('Automatic detection', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Pipelines selected automatically', { exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByText('OCR', { exact: true })).not.toBeInTheDocument();
		await expect.element(page.getByText('Index', { exact: true })).not.toBeInTheDocument();
		await expect
			.element(page.getByText('Transcribe', { exact: true }))
			.not.toBeInTheDocument();
	});

	it('describes auto as automatic detection in Russian', async () => {
		locale.setLocale('ru');
		const data = pageData();
		data.pipelinePreset = 'auto';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('Автоопределение', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Конвейеры выбираются автоматически', { exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByText('OCR', { exact: true })).not.toBeInTheDocument();
	});

	it('localizes supported presets in Russian', async () => {
		locale.setLocale('ru');
		const data = pageData();
		data.pipelinePreset = 'video_transcript';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('Транскрипция видео', { exact: true }).first())
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Транскрипция', { exact: true }).first())
			.toBeInTheDocument();
		await expect.element(page.getByText('video_transcript', { exact: true })).not.toBeInTheDocument();
	});

	it('keeps unknown backend presets visible as raw values', async () => {
		const data = pageData();
		data.pipelinePreset = 'future_pipeline';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('future_pipeline', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('localizes the typed item kind and visibility labels in Russian', async () => {
		locale.setLocale('ru');
		render(ReviewPage, { data: pageData() });

		await expect
			.element(page.getByText('Фотография', { exact: true }).first())
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Приватный', { exact: true }).first())
			.toBeInTheDocument();
		await expect.element(page.getByText('photo', { exact: true })).not.toBeInTheDocument();
		await expect.element(page.getByText('private', { exact: true })).not.toBeInTheDocument();
	});

	it.each([
		{ extra: 1, ru: 'ещё 1 файл' },
		{ extra: 2, ru: 'ещё 2 файла' },
		{ extra: 5, ru: 'ещё 5 файлов' },
		{ extra: 21, ru: 'ещё 21 файл' },
		{ extra: 22, ru: 'ещё 22 файла' }
	])('uses the correct Russian plural form for $extra extra files', async ({ extra, ru }) => {
		locale.setLocale('ru');
		const data = pageData();
		data.enabledFiles = Array.from({ length: 8 + extra }, (_, i) =>
			makeFile({ id: `file-${i}` })
		);
		render(ReviewPage, { data });

		await expect.element(page.getByText(ru, { exact: true })).toBeInTheDocument();
	});

	it('localizes the discard action in Russian', async () => {
		locale.setLocale('ru');
		render(ReviewPage, { data: pageData() });

		await expect
			.element(page.getByRole('link', { name: 'Отменить' }))
			.toBeInTheDocument();
	});

	it('localizes known language codes and keeps unknown codes readable', async () => {
		const data = pageData();
		data.languageCode = 'tg';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('Tajik (tg)', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('falls back to the raw code for unknown languages', async () => {
		const data = pageData();
		data.languageCode = 'xx';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('xx', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('localizes mixed and unknown languages in English', async () => {
		const data = pageData();
		data.languageCode = 'mixed';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('Mixed', { exact: true }).first())
			.toBeInTheDocument();

		data.languageCode = 'unknown';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('Unknown', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('localizes mixed and unknown languages in Russian', async () => {
		locale.setLocale('ru');
		const data = pageData();
		data.languageCode = 'mixed';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('Смешанный', { exact: true }).first())
			.toBeInTheDocument();

		data.languageCode = 'unknown';
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('Неизвестно', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('localizes known file statuses', async () => {
		render(ReviewPage, { data: pageData() });

		await expect
			.element(page.getByText('Uploaded', { exact: true }))
			.toBeInTheDocument();
	});

	it('localizes known file statuses in Russian', async () => {
		locale.setLocale('ru');
		render(ReviewPage, { data: pageData() });

		await expect
			.element(page.getByText('Загружен', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('keeps unknown backend statuses visible as raw values', async () => {
		const data = pageData();
		data.enabledFiles = [makeFile({ status: null, statusRaw: 'mystery' })];
		render(ReviewPage, { data });

		await expect
			.element(page.getByText('mystery', { exact: true }))
			.toBeInTheDocument();
	});
});
