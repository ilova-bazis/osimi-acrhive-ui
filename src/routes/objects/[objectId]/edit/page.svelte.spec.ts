import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { parse, stringify } from 'devalue';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
import { locale } from '$lib/i18n/locale';
import type { ObjectEditPayload } from '$lib/services/objectEdit';

const { beforeNavigateMock, invalidateAllMock, actionUpdateMock } = vi.hoisted(() => ({
	beforeNavigateMock: vi.fn(),
	invalidateAllMock: vi.fn(),
	actionUpdateMock: vi.fn(),
}));

vi.mock('$app/navigation', () => ({
	beforeNavigate: beforeNavigateMock,
	invalidateAll: invalidateAllMock,
}));

// Component tests do not initialize SvelteKit's client app decoders, so the real
// enhance action cannot deserialize mocked ActionResult payloads.
vi.mock('$app/forms', () => ({
	enhance: (formElement: HTMLFormElement, submit?: SubmitFunction) => {
		const handleSubmit = async (event: SubmitEvent): Promise<void> => {
			event.preventDefault();
			const formData = new FormData(formElement);
			const action = new URL(formElement.action);
			const controller = new AbortController();
			let canceled = false;
			const callback = await submit?.({
				action,
				formData,
				formElement,
				controller,
				submitter: event.submitter,
				cancel: () => { canceled = true; },
			});
			if (canceled) return;

			const body = new URLSearchParams();
			for (const [key, value] of formData) {
				if (typeof value === 'string') body.append(key, value);
			}
			const response = await fetch(action, {
				method: 'POST',
				body,
				signal: controller.signal,
			});
			const result = JSON.parse(await response.text()) as ActionResult;
			if ('data' in result && typeof result.data === 'string') {
				result.data = parse(result.data);
			}
			await callback?.({
				action,
				formData,
				formElement,
				result,
				update: actionUpdateMock,
			});
		};
		formElement.addEventListener('submit', handleSubmit);
		return { destroy: () => formElement.removeEventListener('submit', handleSubmit) };
	},
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

const renderPage = (payload = editPayload) =>
	render(EditPage, { data: { editPayload: payload, isLockedByOtherUser: false }, form: null });

const publicationRequest = (status: string, id = 'req-1') => ({
	id,
	status,
	failureReason: null,
	createdAt: '2026-08-04T12:00:00.000Z',
	updatedAt: '2026-08-04T12:01:00.000Z',
	completedAt: status === 'PENDING' || status === 'PROCESSING' ? null : '2026-08-04T12:01:00.000Z',
	publicationRevision: null as number | null,
	targetVersion: null as string | null,
});

const statusResponse = (request: ReturnType<typeof publicationRequest> | null, status = 200): Response =>
	new Response(JSON.stringify({ request }), {
		status,
		headers: { 'content-type': 'application/json' },
	});

const actionResponse = (type: 'success' | 'failure', data: Record<string, unknown>, status = 200): Response =>
	new Response(JSON.stringify({ type, status, data: stringify(data) }), {
		// SvelteKit returns action failures over HTTP 200; the action status is in the payload.
		status: 200,
		headers: { 'content-type': 'application/json' },
	});

describe('/objects/[objectId]/edit +page.svelte', () => {
	beforeEach(() => {
		beforeNavigateMock.mockReset();
		actionUpdateMock.mockReset();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ request: null }), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		})));
	});

	afterEach(() => {
		vi.useRealTimers();
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

	it('marks an active cache stale, recovers, and stops polling at a terminal status', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(statusResponse(publicationRequest('PENDING')))
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(statusResponse(publicationRequest('COMPLETED')));
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await vi.advanceTimersByTimeAsync(0);

		await expect.element(page.getByRole('button', { name: 'Publication queued' })).toBeDisabled();
		await vi.advanceTimersByTimeAsync(12_000);
		await expect.element(page.getByText('Last known')).toBeInTheDocument();
		await expect.element(page.getByText(/Last successful check:/)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Publish curated OCR' })).toBeEnabled();

		await vi.advanceTimersByTimeAsync(2_000);
		await expect.element(page.getByText('Curated OCR was published successfully.')).toBeInTheDocument();
		await expect.element(page.getByText('Publication status connection recovered.')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(60_000);
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('uses exact retry backoff, exhausts five retries, and resets on manual retry', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		for (const [index, delay] of [2_000, 4_000, 8_000, 16_000, 30_000].entries()) {
			await vi.advanceTimersByTimeAsync(delay - 1);
			expect(fetchMock).toHaveBeenCalledTimes(index + 1);
			await vi.advanceTimersByTimeAsync(1);
			expect(fetchMock).toHaveBeenCalledTimes(index + 2);
		}
		await expect.element(page.getByText('Publication status is temporarily unavailable.')).toBeInTheDocument();

		fetchMock.mockResolvedValueOnce(statusResponse(null));
		await page.getByRole('button', { name: 'Retry' }).click();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchMock).toHaveBeenCalledTimes(7);
		await expect.element(page.getByText('Publication status connection recovered.')).toBeInTheDocument();
	});

	it('requires a session after a 401 without losing unsaved edits', async () => {
		let resolveStatus!: (response: Response) => void;
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>((resolve) => {
			resolveStatus = resolve;
		})));
		renderPage();
		const title = page.getByRole('textbox', { name: 'Title' });
		await title.fill('Unsaved title');
		resolveStatus(statusResponse(null, 401));

		await expect.element(page.getByText(/Your session expired/)).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute('target', '_blank');
		await expect.element(page.getByRole('button', { name: 'Publish curated OCR' })).toBeDisabled();
		await expect.element(title).toHaveValue('Unsaved title');
	});

	it('disables submission when the session expires while the publication dialog is open', async () => {
		let resolveStatus!: (response: Response) => void;
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>((resolve) => {
			resolveStatus = resolve;
		})));
		renderPage();
		await page.getByRole('button', { name: 'Publish curated OCR' }).click();
		await expect.element(page.getByRole('button', { name: 'Queue publication' })).toBeEnabled();

		resolveStatus(statusResponse(null, 401));

		await expect.element(page.getByText(/Your session expired/)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Queue publication' })).toBeDisabled();
	});

	it('treats an opaque login redirect as session expiry and localizes the action', async () => {
		locale.setLocale('ru');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
			status: 0,
			type: 'opaqueredirect',
			redirected: false,
			ok: false,
		} as Response));
		renderPage();

		await expect.element(page.getByText(/Сеанс истёк/)).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Войти' })).toBeInTheDocument();
	});

	it('aborts status work on unmount and ignores a late response', async () => {
		vi.useFakeTimers();
		let resolveStatus!: (response: Response) => void;
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) =>
			new Promise<Response>((resolve) => {
				resolveStatus = resolve;
				expect(init?.signal).toBeInstanceOf(AbortSignal);
			}),
		);
		vi.stubGlobal('fetch', fetchMock);
		const view = renderPage();
		await vi.advanceTimersByTimeAsync(0);
		const signal = fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal;

		await view.unmount();
		expect(signal.aborted).toBe(true);
		resolveStatus(statusResponse(publicationRequest('PENDING')));
		await vi.advanceTimersByTimeAsync(60_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('aborts object status work and ignores the previous object response', async () => {
		let resolveFirst!: (response: Response) => void;
		const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
			if (String(input).includes('OBJ-1')) {
				return new Promise<Response>((resolve) => { resolveFirst = resolve; });
			}
			return Promise.resolve(statusResponse(publicationRequest('COMPLETED', 'req-object-2')));
		});
		vi.stubGlobal('fetch', fetchMock);
		const view = renderPage();
		await view.rerender({
			data: { editPayload: { ...editPayload, objectId: 'OBJ-2' }, isLockedByOtherUser: false },
			form: null,
		});
		await expect.element(page.getByText(/Request req-object-2/)).toBeInTheDocument();

		resolveFirst(statusResponse(publicationRequest('PENDING', 'req-object-1')));
		await new Promise((resolve) => setTimeout(resolve, 0));
		await expect.element(page.getByText(/Request req-object-2/)).toBeInTheDocument();
		await expect.element(page.getByText(/Request req-object-1/)).not.toBeInTheDocument();
	});

	it('seeds a successful action result and ignores the canceled status race', async () => {
		vi.useFakeTimers();
		let resolveInitial!: (response: Response) => void;
		const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return Promise.resolve(actionResponse('success', {
					success: true,
					requestId: 'req-seeded',
					requestStatus: 'PENDING',
				}));
			}
			if (String(input).includes('publication-status') && fetchMock.mock.calls.length === 1) {
				return new Promise<Response>((resolve) => { resolveInitial = resolve; });
			}
			return Promise.resolve(statusResponse(publicationRequest('PROCESSING', 'req-seeded')));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await page.getByRole('button', { name: 'Publish curated OCR' }).click();
		await page.getByRole('button', { name: 'Queue publication' }).click();
		await vi.advanceTimersByTimeAsync(0);

		await expect.element(page.getByText(/Request req-seeded/)).toBeInTheDocument();
		expect(fetchMock.mock.calls.filter(([input]) => String(input).includes('publication-status'))).toHaveLength(1);
		resolveInitial(statusResponse(publicationRequest('COMPLETED', 'req-old')));
		await vi.advanceTimersByTimeAsync(0);
		await expect.element(page.getByText(/Request req-seeded/)).toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(12_000);
		expect(fetchMock.mock.calls.filter(([input]) => String(input).includes('publication-status'))).toHaveLength(2);
	});

	it('reconciles an ambiguous publication result without applying the action response', async () => {
		let statusCalls = 0;
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return Promise.resolve(new Response(JSON.stringify({
					type: 'error',
					status: 500,
					error: { message: 'Response interrupted' },
				}), { status: 200, headers: { 'content-type': 'application/json' } }));
			}
			statusCalls += 1;
			if (statusCalls === 1) return Promise.resolve(statusResponse(null));
			return Promise.resolve(statusResponse({
				...publicationRequest('PENDING', 'req-reconciled'),
				publicationRevision: 5,
				targetVersion: '2026-08-21',
			}));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await page.getByRole('button', { name: 'Publish curated OCR' }).click();
		await page.getByRole('button', { name: 'Queue publication' }).click();

		await expect.element(page.getByText(/Request req-reconciled/)).toBeInTheDocument();
		expect(actionUpdateMock).not.toHaveBeenCalled();
		const postBody = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')?.[1]?.body as URLSearchParams;
		expect(postBody.get('revision')).toBe('4');
		await expect.element(page.getByRole('button', { name: 'Publication queued' })).toBeDisabled();
	});

	it('aborts a publication action on object change and ignores its late result', async () => {
		let resolveAction!: (response: Response) => void;
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return new Promise<Response>((resolve) => { resolveAction = resolve; });
			}
			return Promise.resolve(statusResponse(null));
		});
		vi.stubGlobal('fetch', fetchMock);
		const view = renderPage();
		await page.getByRole('button', { name: 'Publish curated OCR' }).click();
		await page.getByRole('button', { name: 'Queue publication' }).click();
		const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
		const signal = postCall?.[1]?.signal as AbortSignal;

		await view.rerender({
			data: { editPayload: { ...editPayload, objectId: 'OBJ-2' }, isLockedByOtherUser: false },
			form: null,
		});
		expect(signal.aborted).toBe(true);
		resolveAction(actionResponse('success', {
			success: true,
			requestId: 'req-old-object',
			requestStatus: 'PENDING',
		}));
		await new Promise((resolve) => setTimeout(resolve, 0));

		await expect.element(page.getByText(/Request req-old-object/)).not.toBeInTheDocument();
		expect(actionUpdateMock).not.toHaveBeenCalled();
	});

	it('adopts an active-publication conflict action result', async () => {
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return Promise.resolve(actionResponse('failure', {
					publicationAlreadyActive: true,
					requestId: 'req-existing',
					requestStatus: 'PROCESSING',
				}, 409));
			}
			return Promise.resolve(statusResponse(null));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await page.getByRole('button', { name: 'Publish curated OCR' }).click();
		await page.getByRole('button', { name: 'Queue publication' }).click();

		await expect.element(page.getByText(/Request req-existing/)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Publishing…' })).toBeDisabled();
	});

	it('renders unknown status without disabling publication or polling', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockResolvedValue(statusResponse(publicationRequest('PAUSED')));
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await vi.advanceTimersByTimeAsync(0);

		await expect.element(page.getByText('Publication has an unknown status: PAUSED.')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Publish curated OCR' })).toBeEnabled();
		await vi.advanceTimersByTimeAsync(60_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);
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
