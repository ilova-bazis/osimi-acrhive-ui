import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';
import type { ObjectEditPayload } from '$lib/services/objectEdit';

const { beforeNavigateMock, invalidateAllMock } = vi.hoisted(() => ({
	beforeNavigateMock: vi.fn(),
	invalidateAllMock: vi.fn(),
}));

vi.mock('$app/navigation', () => ({
	beforeNavigate: beforeNavigateMock,
	invalidateAll: invalidateAllMock,
}));

import EditPage from './+page.svelte';

const editPayload: ObjectEditPayload = {
	objectId: 'OBJ-1',
	revision: 4,
	mediaType: 'document' as const,
	lock: { locked: true, lockedBy: 'u1', lockedUntil: '2026-08-04T19:00:00.000Z' },
	curationState: 'needs_review' as const,
	draft: null,
	metadata: {
		title: 'Object title', publicationDate: '', datePrecision: 'none' as const,
		dateApproximate: false, language: 'en', tags: [], people: [], description: null,
	},
	rights: { accessLevel: 'family' as const, rightsNote: null, sensitivityNote: null },
	capabilities: { canEditMetadata: true, canCurateText: true, canSubmitReview: true },
	curation: {
		kind: 'document' as const,
		machineOcrArtifactId: 'ocr-1',
		pageCount: 1,
		pages: [{ pageNumber: 1, label: '1', machineText: 'Raw OCR', curatedText: 'Curated OCR', status: 'edited' as const }],
	},
};

const renderPage = (payload = editPayload): void => {
	render(EditPage, { data: { editPayload: payload, isLockedByOtherUser: false }, form: null });
};

describe('/objects/[objectId]/edit +page.svelte', () => {
	beforeEach(() => {
		beforeNavigateMock.mockReset();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ request: null }), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		})));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		locale.setLocale('en');
	});

	it('confirms that publication queues an archive update', async () => {
		renderPage();

		await page.getByRole('button', { name: 'Publish curated OCR' }).click();

		await expect.element(page.getByRole('dialog')).toBeInTheDocument();
		await expect.element(page.getByText(/asynchronous archive update/)).toBeInTheDocument();
		await expect.element(page.getByRole('textbox', { name: /Publication note/ })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Queue publication' })).toBeInTheDocument();
	});

	it('explains unavailable OCR pages while leaving metadata editable', async () => {
		renderPage({
			...editPayload,
			capabilities: { canEditMetadata: true, canCurateText: false, canSubmitReview: false },
			curation: { kind: 'document', machineOcrArtifactId: null, pageCount: null, pages: [] },
		});

		await expect.element(page.getByText('Curated OCR cannot be published yet.')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'OCR unavailable' })).toBeDisabled();
		await expect.element(page.getByRole('textbox', { name: 'Title' })).toBeEnabled();
	});

	it('requires draft changes to be saved before publication', async () => {
		renderPage();
		await page.getByRole('textbox', { name: 'Title' }).fill('Changed title');

		await expect.element(page.getByRole('button', { name: 'Publish curated OCR' })).toBeDisabled();
		await expect.element(page.getByText('Unsaved changes')).toBeInTheDocument();
	});

	it('sends current metadata on the first save click', async () => {
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return new Promise<Response>(() => undefined);
			}
			return Promise.resolve(new Response(JSON.stringify({ request: null }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			}));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();

		const title = page.getByRole('textbox', { name: 'Title' });
		await title.fill('First saved title');
		await page.getByRole('button', { name: 'Save draft' }).click();

		const postBodies = fetchMock.mock.calls
			.filter(([, init]) => init?.method === 'POST')
			.map(([, init]) => init?.body as URLSearchParams);
		expect(postBodies).toHaveLength(1);
		expect(postBodies[0]?.get('revision')).toBe('4');
		expect(JSON.parse(postBodies[0]?.get('metadata') ?? '{}')).toMatchObject({ title: 'First saved title' });
		expect(postBodies[0]?.get('rights')).not.toBeNull();
		expect(postBodies[0]?.has('pages')).toBe(false);
	});

	it('renders the latest failed publication reason', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
			request: {
				id: 'req-1', status: 'FAILED', failureReason: 'Archive unavailable',
				createdAt: '2026-08-04T12:00:00.000Z', updatedAt: '2026-08-04T12:01:00.000Z',
				completedAt: '2026-08-04T12:01:00.000Z',
			},
		}), { status: 200, headers: { 'content-type': 'application/json' } })));

		renderPage();

		await expect.element(page.getByText(/publication failed: Archive unavailable/)).toBeInTheDocument();
	});

	it('renders editor chrome in English', async () => {
		renderPage();

		await expect.element(page.getByText('No changes')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Save draft' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Publish curated OCR' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Title' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Date precision')).toBeInTheDocument();
		await expect.element(page.getByText('Rights & Access', { exact: true })).toBeInTheDocument();
	});

	it('renders editor chrome in Russian', async () => {
		locale.setLocale('ru');
		renderPage();

		await expect.element(page.getByText('Нет изменений')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Сохранить черновик' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Опубликовать курированный OCR' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Название' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Точность даты')).toBeInTheDocument();
		await expect.element(page.getByText('Права и доступ', { exact: true })).toBeInTheDocument();
		await page.getByRole('button', { name: /Права и доступ/ }).click();
		await expect.element(page.getByText(/Семейный/)).toBeInTheDocument();
		await expect.element(page.getByText('family', { exact: true })).not.toBeInTheDocument();
	});

	it('renders and retranslates typed form and field errors', async () => {
		render(EditPage, {
			data: { editPayload, isLockedByOtherUser: false },
			form: {
				errorCode: 'validationFailed',
				fieldErrors: { title: 'titleRequired' }
			}
		});

		await expect.element(page.getByText('Check the highlighted fields and try again.')).toBeInTheDocument();
		await expect.element(page.getByText('Enter a title.')).toBeInTheDocument();

		locale.setLocale('ru');
		await expect.element(page.getByText('Проверьте выделенные поля и повторите попытку.')).toBeInTheDocument();
		await expect.element(page.getByText('Введите название.')).toBeInTheDocument();
	});

	it('interpolates a localized media label into the audio intro', async () => {
		locale.setLocale('ru');
		renderPage({
			...editPayload,
			mediaType: 'audio',
			curation: { kind: 'audio' }
		});

		await expect.element(page.getByText(/объектов типа Аудио/)).toBeInTheDocument();
	});

	it('renders the OCR editor controls in English', async () => {
		renderPage();

		await expect
			.element(page.getByRole('button', { name: 'Copy from source' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Read-only')).toBeInTheDocument();
	});

	it('renders the OCR editor controls in Russian', async () => {
		locale.setLocale('ru');
		renderPage();

		await expect
			.element(page.getByRole('button', { name: 'Скопировать из источника' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Только чтение')).toBeInTheDocument();
	});

	it('retranslates the editor after switching locale without remounting', async () => {
		renderPage();

		await expect
			.element(page.getByRole('button', { name: 'Copy from source' }))
			.toBeInTheDocument();

		locale.setLocale('ru');

		await expect
			.element(page.getByRole('button', { name: 'Скопировать из источника' }))
			.toBeInTheDocument();
	});

	it('names tag removal controls after their tag', async () => {
		renderPage({
			...editPayload,
			metadata: { ...editPayload.metadata, tags: ['Persia'] }
		});

		await expect
			.element(page.getByRole('button', { name: 'Remove tag Persia' }))
			.toBeInTheDocument();
	});

	it('names tag removal controls after their tag in Russian', async () => {
		locale.setLocale('ru');
		renderPage({
			...editPayload,
			metadata: { ...editPayload.metadata, tags: ['Persia'] }
		});

		await expect
			.element(page.getByRole('button', { name: 'Удалить тег Persia' }))
			.toBeInTheDocument();
	});

	it('moves focus into the publish dialog when opened', async () => {
		renderPage();

		await page.getByRole('button', { name: 'Publish curated OCR' }).click();
		await expect.element(page.getByRole('dialog')).toBeInTheDocument();

		await vi.waitFor(() => {
			expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull();
		});
	});

	it('restores focus to the publish trigger when the dialog closes', async () => {
		renderPage();

		const trigger = page.getByRole('button', { name: 'Publish curated OCR' });
		await trigger.click();
		await page.getByRole('button', { name: 'Cancel' }).click();

		await vi.waitFor(() => {
			expect(document.activeElement).toBe(trigger.element());
		});
	});

	it('closes the publish dialog on Escape', async () => {
		renderPage();

		await page.getByRole('button', { name: 'Publish curated OCR' }).click();
		await expect.element(page.getByRole('dialog')).toBeInTheDocument();

		await userEvent.keyboard('{Escape}');

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('renders precision options in Russian', async () => {
		locale.setLocale('ru');
		renderPage();

		for (const label of ['Без даты', 'Год', 'Год и месяц', 'Полная дата']) {
			await expect.element(page.getByText(label, { exact: true })).toBeInTheDocument();
		}
	});
});

describe('object edit page-count pluralization', () => {
	it('renders English singular and plural page counts', async () => {
		renderPage();

		await expect.element(page.getByText('1 page')).toBeInTheDocument();

		renderPage({
			...editPayload,
			curation: {
				...editPayload.curation,
				pageCount: 5,
				pages: Array.from({ length: 5 }, (_, index) => ({
					pageNumber: index + 1,
					label: String(index + 1),
					machineText: 'Raw OCR',
					curatedText: '',
					status: 'machine' as const,
				})),
			} as unknown as typeof editPayload.curation,
		});

		await expect.element(page.getByText('5 pages')).toBeInTheDocument();
	});

	it('renders Russian page-count plural forms', async () => {
		locale.setLocale('ru');
		renderPage();

		await expect.element(page.getByText('Страница: 1')).toBeInTheDocument();

		renderPage({
			...editPayload,
			curation: {
				...editPayload.curation,
				pageCount: 2,
				pages: [
					{ pageNumber: 1, label: '1', machineText: 'Raw OCR', curatedText: '', status: 'machine' as const },
					{ pageNumber: 2, label: '2', machineText: 'Raw OCR', curatedText: '', status: 'machine' as const },
				],
			} as unknown as typeof editPayload.curation,
		});

		await expect.element(page.getByText('Страницы: 2')).toBeInTheDocument();

		renderPage({
			...editPayload,
			curation: {
				...editPayload.curation,
				pageCount: 5,
				pages: Array.from({ length: 5 }, (_, index) => ({
					pageNumber: index + 1,
					label: String(index + 1),
					machineText: 'Raw OCR',
					curatedText: '',
					status: 'machine' as const,
				})),
			} as unknown as typeof editPayload.curation,
		});

		await expect.element(page.getByText('Страниц: 5')).toBeInTheDocument();
	});
});
