import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { SubmitFunction } from '@sveltejs/kit';
import { locale } from '$lib/i18n/locale';
import type { ActionData } from './$types';

const { enhanceMock } = vi.hoisted(() => ({ enhanceMock: vi.fn() }));

vi.mock('$app/forms', () => ({
	enhance: (formElement: HTMLFormElement, submit: unknown) => {
		enhanceMock(formElement, submit);
		return { destroy: () => {} };
	}
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import NewIngestionPage from './+page.svelte';

const attemptData = {
	idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
	attemptCreatedAt: '2026-09-21T08:15:00.000Z'
};

const renderPage = (form: ActionData | null = null) =>
	render(NewIngestionPage, { data: attemptData as never, form });

const capturedSubmit = (): { formElement: HTMLFormElement; submit: SubmitFunction } => {
	const [formElement, submit] = enhanceMock.mock.calls[0] as [HTMLFormElement, SubmitFunction];
	return { formElement, submit };
};

const submitInput = (formElement: HTMLFormElement) => ({
	action: new URL('https://example.test/ingestion/new'),
	cancel: vi.fn(),
	controller: new AbortController(),
	formData: new FormData(formElement),
	formElement,
	submitter: null
});

type SubmitResultCallback = (opts: {
	formData: FormData;
	formElement: HTMLFormElement;
	action: URL;
	result: {
		type: 'success' | 'failure' | 'redirect' | 'error';
		status?: number;
		data?: Record<string, unknown>;
		location?: string;
	};
	update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>;
}) => Promise<void>;

describe('/ingestion/new +page.svelte localization', () => {
	beforeEach(() => {
		enhanceMock.mockReset();
	});

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

	describe('submission guard and attempt data', () => {
		it('renders hidden attempt fields from page data', () => {
			const screen = renderPage();
			const form = screen.container.querySelector('form#new-batch-form') as HTMLFormElement;
			const keyInput = form.querySelector('input[name="idempotencyKey"]') as HTMLInputElement;
			const tsInput = form.querySelector('input[name="attemptCreatedAt"]') as HTMLInputElement;

			expect(keyInput.value).toBe(attemptData.idempotencyKey);
			expect(tsInput.value).toBe(attemptData.attemptCreatedAt);
		});

		it('prefers action data attempt values after a failed submission', () => {
			const screen = renderPage({
				error: 'Invalid item kind.',
				code: 'INVALID_PIPELINE_CAPABILITY',
				idempotencyKey: '99999999-9999-4999-8999-999999999999',
				attemptCreatedAt: '2026-09-21T09:30:00.000Z',
				values: { name: 'Batch 01' }
			});
			const form = screen.container.querySelector('form#new-batch-form') as HTMLFormElement;
			const keyInput = form.querySelector('input[name="idempotencyKey"]') as HTMLInputElement;

			expect(keyInput.value).toBe('99999999-9999-4999-8999-999999999999');
		});

		it('rehydrates form state from action data after a native failure', () => {
			const screen = renderPage({
				error: 'Request failed for ingestions.create',
				code: 'UNKNOWN_ERROR',
				idempotencyKey: attemptData.idempotencyKey,
				attemptCreatedAt: attemptData.attemptCreatedAt,
				values: {
					name: 'Kept batch name',
					classificationType: 'image',
					itemKind: 'photo',
					languageCode: 'ru',
					pipelinePreset: 'auto',
					accessLevel: 'family',
					summaryTags: ['kept-tag'],
					summary: 'Kept summary text'
				}
			});
			const form = screen.container.querySelector('form#new-batch-form') as HTMLFormElement;

			const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
			expect(nameInput.value).toBe('Kept batch name');

			const kindInput = form.querySelector('input[name="itemKind"]') as HTMLInputElement;
			expect(kindInput.value).toBe('photo');

			const classificationInput = form.querySelector(
				'input[name="classificationType"]'
			) as HTMLInputElement;
			expect(classificationInput.value).toBe('image');

			const languageInput = form.querySelector('input[name="languageCode"]') as HTMLInputElement;
			expect(languageInput.value).toBe('ru');

			const presetInput = form.querySelector('input[name="pipelinePreset"]') as HTMLInputElement;
			expect(presetInput.value).toBe('auto');

			const accessInput = form.querySelector('input[name="accessLevel"]') as HTMLInputElement;
			expect(accessInput.value).toBe('family');

			const tagsInput = form.querySelector('input[name="summaryTags"]') as HTMLInputElement;
			expect(tagsInput.value).toBe('kept-tag');

			const summaryInput = form.querySelector('textarea[name="summary"]') as HTMLTextAreaElement;
			expect(summaryInput.value).toBe('Kept summary text');

			expect(screen.container.textContent).toContain('kept-tag');
		});

		it('enters the creating state on the first submission', async () => {
			renderPage();
			const { formElement, submit } = capturedSubmit();

			const result = submit(submitInput(formElement));

			await expect.element(page.getByRole('button', { name: 'Creating…' })).toBeInTheDocument();
			expect(typeof result).toBe('function');
		});

		it('cancels a second synchronous submission', async () => {
			renderPage();
			const { formElement, submit } = capturedSubmit();

			const first = submit(submitInput(formElement));
			expect(first).toBeTypeOf('function');

			const secondInput = submitInput(formElement);
			const second = submit(secondInput);
			expect(second).toBeUndefined();
			expect(secondInput.cancel).toHaveBeenCalledTimes(1);

			await expect.element(page.getByRole('button', { name: 'Creating…' })).toBeInTheDocument();
		});

		it('calls update and re-enables Continue for a failure result', async () => {
			renderPage();
			const { formElement, submit } = capturedSubmit();
			const callback = submit(submitInput(formElement)) as SubmitResultCallback;
			const update = vi.fn().mockResolvedValue(undefined);

			await callback({
				action: new URL('https://example.test/ingestion/new'),
				formData: new FormData(formElement),
				formElement,
				result: {
					type: 'failure',
					status: 400,
					data: { error: 'boom', code: 'BAD_REQUEST' }
				},
				update
			});

			expect(update).toHaveBeenCalledTimes(1);
			await expect.element(page.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
		});

		it('re-enables Continue when applying the result rejects', async () => {
			renderPage();
			const { formElement, submit } = capturedSubmit();
			const callback = submit(submitInput(formElement)) as SubmitResultCallback;
			const update = vi.fn().mockRejectedValue(new Error('apply failed'));

			await expect(
				callback({
					action: new URL('https://example.test/ingestion/new'),
					formData: new FormData(formElement),
					formElement,
					result: { type: 'failure', status: 502, data: { error: 'boom' } },
					update
				})
			).rejects.toThrow('apply failed');

			await expect.element(page.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
		});

		it('passes redirect results to the standard update path', async () => {
			renderPage();
			const { formElement, submit } = capturedSubmit();
			const callback = submit(submitInput(formElement)) as SubmitResultCallback;
			const update = vi.fn().mockResolvedValue(undefined);

			await callback({
				action: new URL('https://example.test/ingestion/new'),
				formData: new FormData(formElement),
				formElement,
				result: { type: 'redirect', status: 303, location: '/ingestion/batch-1/setup' },
				update
			});

			expect(update).toHaveBeenCalledTimes(1);
		});

		it('shows a fresh attempt link when the backend reports a conflict', async () => {
			renderPage({
				error: 'Idempotency key was already used for a different request.',
				code: 'CONFLICT',
				idempotencyKey: attemptData.idempotencyKey,
				attemptCreatedAt: attemptData.attemptCreatedAt,
				values: { name: 'Batch 01' }
			});

			await expect
				.element(page.getByRole('link', { name: 'Start a new batch' }))
				.toBeInTheDocument();

			const link = document.querySelector('a[data-sveltekit-reload]');
			expect(link).not.toBeNull();
			expect(link?.getAttribute('href')).toBe('/ingestion/new');
		});
	});
});
