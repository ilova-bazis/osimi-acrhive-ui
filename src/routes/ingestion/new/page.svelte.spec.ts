import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';

vi.mock('$app/forms', () => ({
	enhance: () => ({ destroy: () => {} })
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import NewIngestionPage from './+page.svelte';

const renderPage = () => render(NewIngestionPage, { form: null });

describe('/ingestion/new +page.svelte localization', () => {
	afterEach(() => {
		locale.setLocale('en');
	});

	it('renders the form in English', async () => {
		renderPage();

		await expect.element(page.getByText('New batch')).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Batch name' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('What does it represent?')).toBeInTheDocument();
		await expect.element(page.getByText('What kind of item is it?')).toBeInTheDocument();
		await expect.element(page.getByText('Scanned Pages', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Primary language')).toBeInTheDocument();
		await expect.element(page.getByText('Processing pipeline')).toBeInTheDocument();
		await expect.element(page.getByText('Visibility')).toBeInTheDocument();
		await expect.element(page.getByText('Provenance & notes')).toBeInTheDocument();
		await expect.element(page.getByText('Step 1 of 3')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
	});

	it('renders the form in Russian', async () => {
		locale.setLocale('ru');
		renderPage();

		await expect.element(page.getByText('Новая партия')).toBeInTheDocument();
		await expect.element(page.getByText('Название партии')).toBeInTheDocument();
		await expect.element(page.getByText('Что это представляет?')).toBeInTheDocument();
		await expect.element(page.getByText('Какой это тип элемента?')).toBeInTheDocument();
		await expect.element(page.getByText('Сканы страниц', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('Основной язык')).toBeInTheDocument();
		await expect.element(page.getByText('Конвейер обработки')).toBeInTheDocument();
		await expect.element(page.getByText('Доступ')).toBeInTheDocument();
		await expect.element(page.getByText('Происхождение и примечания')).toBeInTheDocument();
		await expect.element(page.getByText('Шаг 1 из 3')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Настройка, шаг 1 из 3' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Продолжить' })).toBeInTheDocument();
	});

	it('updates labels reactively when the locale changes', async () => {
		renderPage();

		await expect.element(page.getByText('Batch name')).toBeInTheDocument();
		locale.setLocale('ru');

		await expect.element(page.getByText('Название партии')).toBeInTheDocument();
		await expect.element(page.getByText('Что это представляет?')).toBeInTheDocument();
	});

	it('adds tags interactively without breaking translated labels', async () => {
		renderPage();

		await userEvent.type(page.getByPlaceholder('People, places, themes — press Enter to add'), 'Tehran');
		await userEvent.keyboard('{Enter}');

		await expect.element(page.getByRole('button', { name: 'Remove tag Tehran' })).toBeInTheDocument();
		await expect.element(page.getByText('Batch name')).toBeInTheDocument();
	});

	it('exposes an accessible discard action on mobile', async () => {
		await page.viewport(375, 667);
		renderPage();

		const link = page.getByRole('link', { name: 'Discard' });
		await expect.element(link).toBeInTheDocument();
		await expect.element(link).toHaveAttribute('aria-label', 'Discard');

		await page.viewport(1280, 720);
	});

	it('reflects allowed preset count and switches suggestion when item kind changes', async () => {
		renderPage();

		// Default classification is document, default item kind is scanned_document
		// Scanned document allowed presets: auto, none, ocr_text (3)
		// Suggested is OCR + Index
		await expect.element(page.getByText('OCR + Index', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('— OCR + Index suggested')).toBeInTheDocument();

		// Select OCR + Index
		await page.getByText('OCR + Index', { exact: true }).click();
		let form = document.querySelector('form#new-batch-form') as HTMLFormElement;
		let presetInput = form.querySelector('input[name="pipelinePreset"]') as HTMLInputElement;
		expect(presetInput.value).toBe('ocr_text');

		// Switch to "Other" classification and "Audio" kind
		await page.getByText('Other', { exact: true }).first().click();
		await page.getByText('Audio Recording', { exact: true }).click();

		// Suggested should be Transcribe Audio
		await expect.element(page.getByText('— Transcribe Audio suggested')).toBeInTheDocument();

		// Since ocr_text is not allowed for audio, it should switch to suggested: audio_transcript
		form = document.querySelector('form#new-batch-form') as HTMLFormElement;
		presetInput = form.querySelector('input[name="pipelinePreset"]') as HTMLInputElement;
		expect(presetInput.value).toBe('audio_transcript');
		const itemKindInput = form.querySelector('input[name="itemKind"]') as HTMLInputElement;
		expect(itemKindInput.value).toBe('audio');
	});

	it('retains compatible manual preset selection across item kind changes', async () => {
		renderPage();

		// Select 'none' (Store only)
		await page.getByText('Store only', { exact: true }).click();
		let form = document.querySelector('form#new-batch-form') as HTMLFormElement;
		let presetInput = form.querySelector('input[name="pipelinePreset"]') as HTMLInputElement;
		expect(presetInput.value).toBe('none');

		// Switch to "Other" classification and "Audio" kind
		await page.getByText('Other', { exact: true }).first().click();
		await page.getByText('Audio Recording', { exact: true }).click();

		// 'none' is compatible with audio, so it should stay selected
		form = document.querySelector('form#new-batch-form') as HTMLFormElement;
		presetInput = form.querySelector('input[name="pipelinePreset"]') as HTMLInputElement;
		expect(presetInput.value).toBe('none');
	});

	it.each([
		{
			kind: 'scanned_document',
			select: async () => undefined,
			enabled: ['Auto', 'Store only', 'OCR + Index'],
			suggested: 'OCR + Index'
		},
		{
			kind: 'photo',
			select: async () => {
				await page.getByText('Image / Photograph', { exact: true }).click();
			},
			enabled: ['Auto', 'Store only'],
			suggested: 'Store only'
		},
		{
			kind: 'audio',
			select: async () => {
				await page.getByText('Other', { exact: true }).first().click();
				await page.getByText('Audio Recording', { exact: true }).click();
			},
			enabled: ['Auto', 'Store only', 'Transcribe Audio'],
			suggested: 'Transcribe Audio'
		},
		{
			kind: 'video',
			select: async () => {
				await page.getByText('Other', { exact: true }).first().click();
				await page.getByText('Video Recording', { exact: true }).click();
			},
			enabled: ['Auto', 'Store only', 'Transcribe Video', 'OCR + Video'],
			suggested: 'Transcribe Video'
		},
		{
			kind: 'document',
			select: async () => {
				await page.getByText('Digital Document', { exact: true }).click();
			},
			enabled: ['Auto', 'Store only'],
			suggested: 'Store only'
		},
		{
			kind: 'other',
			select: async () => {
				await page.getByText('Other', { exact: true }).first().click();
				await page.getByText('Other', { exact: true }).last().click();
			},
			enabled: [
				'Auto',
				'Store only',
				'OCR + Index',
				'Transcribe Audio',
				'Transcribe Video',
				'OCR + Audio',
				'OCR + Video'
			],
			suggested: 'Auto'
		}
	])('enables the exact preset set for $kind', async ({ select, enabled, suggested }) => {
		renderPage();
		await select();

		const labels = [
			'Auto',
			'Store only',
			'OCR + Index',
			'Transcribe Audio',
			'Transcribe Video',
			'OCR + Audio',
			'OCR + Video'
		];
		for (const label of labels) {
			const card = Array.from(document.querySelectorAll('button')).find((button) =>
				button.textContent?.trim().startsWith(label)
			) as HTMLButtonElement | undefined;
			expect(card, `Missing preset card ${label}`).toBeDefined();
			if (enabled.includes(label)) {
				expect(card?.disabled).toBe(false);
			} else {
				expect(card?.disabled).toBe(true);
			}
		}
		await expect.element(page.getByText(`— ${suggested} suggested`)).toBeInTheDocument();
	});

	it('submits auto literally instead of expanding detection into stages', () => {
		renderPage();
		const presetInput = document.querySelector(
			'form#new-batch-form input[name="pipelinePreset"]'
		) as HTMLInputElement;
		expect(presetInput.value).toBe('auto');
	});
});
