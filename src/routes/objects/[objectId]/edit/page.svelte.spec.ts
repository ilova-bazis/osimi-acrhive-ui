import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { parse, stringify } from 'devalue';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
import { locale } from '$lib/i18n/locale';
import type { ArchiveSyncStatus, ObjectEditPayload } from '$lib/services/objectEdit';

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

type SyncSubmission = {
	id: string;
	requestId: string;
	submittedRevision: number;
	status: ArchiveSyncStatus;
	submittedAt: string;
	submittedBy: string | null;
	completedAt: string | null;
	failureReason: string | null;
};

type SyncStatusPayload = {
	objectId: string;
	currentRevision: number;
	latestSubmittedRevision: number | null;
	latestAppliedRevision: number | null;
	archiveOutOfSync: boolean;
	activeSubmission: SyncSubmission | null;
	latestSubmission: SyncSubmission | null;
};

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
	capabilities: { canEditMetadata: true, canCurateText: true, canSubmitChanges: true },
	curation: {
		kind: 'document' as const,
		machineOcrArtifactId: 'ocr-1',
		pageCount: 1,
		pages: [{ pageNumber: 1, label: '1', machineText: 'Raw OCR', curatedText: 'Curated OCR', status: 'edited' as const }],
	},
};

const renderPage = (payload = editPayload) =>
	render(EditPage, { data: { editPayload: payload, isLockedByOtherUser: false }, form: null });

const submission = (
	status: ArchiveSyncStatus,
	overrides: Partial<SyncSubmission> = {},
): SyncSubmission => ({
	id: 'sub-1',
	requestId: 'req-1',
	submittedRevision: 4,
	status,
	submittedAt: '2026-08-04T12:00:00.000Z',
	submittedBy: 'u1',
	completedAt: status === 'PENDING' || status === 'PROCESSING' ? null : '2026-08-04T12:01:00.000Z',
	failureReason: null,
	...overrides,
});

const syncStatusPayload = (overrides: Partial<SyncStatusPayload> = {}): SyncStatusPayload => ({
	objectId: 'OBJ-1',
	currentRevision: 4,
	latestSubmittedRevision: null,
	latestAppliedRevision: null,
	archiveOutOfSync: false,
	activeSubmission: null,
	latestSubmission: null,
	...overrides,
});

const statusResponse = (payload: SyncStatusPayload, status = 200): Response =>
	new Response(JSON.stringify(payload), {
		status,
		headers: { 'content-type': 'application/json' },
	});

const actionResponse = (type: 'success' | 'failure', data: Record<string, unknown>, status = 200): Response =>
	new Response(JSON.stringify({ type, status, data: stringify(data) }), {
		// SvelteKit returns action failures over HTTP 200; the action status is in the payload.
		status: 200,
		headers: { 'content-type': 'application/json' },
	});

const actionSubmission = (status: ArchiveSyncStatus, requestId = 'req-1') => ({
	id: 'sub-1',
	requestId,
	status,
	submittedAt: '2026-08-04T12:00:00.000Z',
	submittedBy: 'u1',
});

describe('/objects/[objectId]/edit +page.svelte', () => {
	beforeEach(() => {
		beforeNavigateMock.mockReset();
		actionUpdateMock.mockReset();
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(syncStatusPayload())));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		locale.setLocale('en');
	});

	it('confirms that submission queues an archive synchronization', async () => {
		renderPage();

		await page.getByRole('button', { name: 'Submit changes' }).click();

		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toBeInTheDocument();
		await expect.element(dialog.getByText(/asynchronous archive update/)).toBeInTheDocument();
		await expect.element(dialog.getByRole('textbox', { name: /Change note/ })).toBeInTheDocument();
		await expect.element(dialog.getByRole('button', { name: 'Submit changes' })).toBeInTheDocument();
	});

	it('explains unavailable OCR pages while keeping metadata and submission available', async () => {
		renderPage({
			...editPayload,
			curation: { kind: 'document', machineOcrArtifactId: null, pageCount: null, pages: [] },
		});

		await expect.element(page.getByText('Curated OCR pages are not available.')).toBeInTheDocument();
		await expect.element(page.getByRole('textbox', { name: 'Title' })).toBeEnabled();
		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeEnabled();
	});

	it('requires draft changes to be saved before submission', async () => {
		renderPage();
		await page.getByRole('textbox', { name: 'Title' }).fill('Changed title');

		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeDisabled();
		await expect.element(page.getByText('Unsaved changes')).toBeInTheDocument();
	});

	it('sends current metadata on the first save click', async () => {
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return new Promise<Response>(() => undefined);
			}
			return Promise.resolve(statusResponse(syncStatusPayload()));
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

	it('renders the latest failed synchronization reason with a retry action', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(syncStatusPayload({
			latestSubmittedRevision: 4,
			latestSubmission: submission('FAILED', { failureReason: 'Archive unavailable' }),
		}))));

		renderPage();

		await expect.element(page.getByText(/synchronization failed: Archive unavailable/)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Retry synchronization' })).toBeInTheDocument();
	});

	it('marks an active cache stale, recovers, and stops polling at a terminal status', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(statusResponse(syncStatusPayload({
				latestSubmittedRevision: 4,
				activeSubmission: submission('PENDING'),
				latestSubmission: submission('PENDING'),
				archiveOutOfSync: true,
			})))
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(statusResponse(syncStatusPayload({
				latestSubmittedRevision: 4,
				latestAppliedRevision: 4,
				latestSubmission: submission('COMPLETED'),
			})));
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await vi.advanceTimersByTimeAsync(0);

		await expect.element(page.getByRole('button', { name: 'Changes queued' })).toBeDisabled();
		await vi.advanceTimersByTimeAsync(12_000);
		await expect.element(page.getByText('Last known')).toBeInTheDocument();
		await expect.element(page.getByText(/Last successful check:/)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeDisabled();

		await vi.advanceTimersByTimeAsync(2_000);
		await expect.element(page.getByText('Revision 4 is synchronized with the archive.')).toBeInTheDocument();
		await expect.element(page.getByText('Archive synchronization status connection recovered.')).toBeInTheDocument();
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
		await expect.element(page.getByText('Archive synchronization status is temporarily unavailable.')).toBeInTheDocument();

		fetchMock.mockResolvedValueOnce(statusResponse(syncStatusPayload()));
		await page.getByRole('button', { name: 'Retry' }).click();
		await vi.advanceTimersByTimeAsync(0);
		expect(fetchMock).toHaveBeenCalledTimes(7);
		await expect.element(page.getByText('Archive synchronization status connection recovered.')).toBeInTheDocument();
	});

	it('requires a session after a 401 without losing unsaved edits', async () => {
		let resolveStatus!: (response: Response) => void;
		vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>((resolve) => {
			resolveStatus = resolve;
		})));
		renderPage();
		const title = page.getByRole('textbox', { name: 'Title' });
		await title.fill('Unsaved title');
		resolveStatus(statusResponse(syncStatusPayload(), 401));

		await expect.element(page.getByText(/Your session expired/)).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute('target', '_blank');
		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeDisabled();
		await expect.element(title).toHaveValue('Unsaved title');
	});

	it('disables submission in the dialog when the submit action reports session expiry', async () => {
		let resolveStatus!: (response: Response) => void;
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return Promise.resolve(actionResponse('failure', { sessionRequired: true }, 401));
			}
			return new Promise<Response>((resolve) => {
				resolveStatus = resolve;
			});
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		resolveStatus(statusResponse(syncStatusPayload()));
		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeEnabled();
		await page.getByRole('button', { name: 'Submit changes' }).click();
		await expect.element(page.getByRole('dialog').getByRole('button', { name: 'Submit changes' })).toBeEnabled();

		await page.getByRole('dialog').getByRole('button', { name: 'Submit changes' }).click();

		await expect.element(page.getByText(/Your session expired/)).toBeInTheDocument();
		await expect.element(page.getByRole('dialog').getByRole('button', { name: 'Submit changes' })).toBeDisabled();
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
		resolveStatus(statusResponse(syncStatusPayload({
			activeSubmission: submission('PENDING'),
			latestSubmission: submission('PENDING'),
		})));
		await vi.advanceTimersByTimeAsync(60_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('aborts object status work and ignores the previous object response', async () => {
		let resolveFirst!: (response: Response) => void;
		const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
			if (String(input).includes('OBJ-1')) {
				return new Promise<Response>((resolve) => { resolveFirst = resolve; });
			}
			return Promise.resolve(statusResponse({
				...syncStatusPayload(),
				objectId: 'OBJ-2',
				latestSubmittedRevision: 4,
				latestSubmission: submission('COMPLETED', { requestId: 'req-object-2' }),
			}));
		});
		vi.stubGlobal('fetch', fetchMock);
		const view = renderPage();
		await view.rerender({
			data: { editPayload: { ...editPayload, objectId: 'OBJ-2' }, isLockedByOtherUser: false },
			form: null,
		});
		await expect.element(page.getByText(/Request req-object-2/)).toBeInTheDocument();

		resolveFirst(statusResponse(syncStatusPayload({
			activeSubmission: submission('PENDING', { requestId: 'req-object-1' }),
			latestSubmission: submission('PENDING', { requestId: 'req-object-1' }),
		})));
		await new Promise((resolve) => setTimeout(resolve, 0));
		await expect.element(page.getByText(/Request req-object-2/)).toBeInTheDocument();
		await expect.element(page.getByText(/Request req-object-1/)).not.toBeInTheDocument();
	});

	it('seeds a successful action result and continues polling the seeded request', async () => {
		vi.useFakeTimers();
		let resolveInitial!: (response: Response) => void;
		let statusCalls = 0;
		const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return Promise.resolve(actionResponse('success', {
					success: true,
					currentRevision: 4,
					submittedRevision: 4,
					submission: actionSubmission('PENDING', 'req-seeded'),
				}));
			}
			statusCalls += 1;
			if (statusCalls === 1) {
				return new Promise<Response>((resolve) => { resolveInitial = resolve; });
			}
			return Promise.resolve(statusResponse(syncStatusPayload({
				activeSubmission: submission('PROCESSING', { requestId: 'req-seeded' }),
				latestSubmission: submission('PROCESSING', { requestId: 'req-seeded' }),
				archiveOutOfSync: true,
			})));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await vi.advanceTimersByTimeAsync(0);

		// Submit stays disabled while the initial status check is unresolved.
		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeDisabled();
		resolveInitial(statusResponse(syncStatusPayload()));
		await vi.advanceTimersByTimeAsync(0);
		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeEnabled();

		await page.getByRole('button', { name: 'Submit changes' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Submit changes' }).click();
		await vi.advanceTimersByTimeAsync(0);

		await expect.element(page.getByText(/Request req-seeded/)).toBeInTheDocument();
		expect(actionUpdateMock).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(12_000);
		expect(fetchMock.mock.calls.filter(([input]) => String(input).includes('sync-status'))).toHaveLength(2);
		await expect.element(page.getByText(/Request req-seeded/)).toBeInTheDocument();
	});

	it('reconciles an ambiguous submission result without applying the action response', async () => {
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
			if (statusCalls === 1) return Promise.resolve(statusResponse(syncStatusPayload()));
			return Promise.resolve(statusResponse(syncStatusPayload({
				latestSubmittedRevision: 4,
				activeSubmission: submission('PENDING', { requestId: 'req-reconciled' }),
				latestSubmission: submission('PENDING', { requestId: 'req-reconciled' }),
				archiveOutOfSync: true,
			})));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await page.getByRole('button', { name: 'Submit changes' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Submit changes' }).click();

		await expect.element(page.getByText(/Request req-reconciled/)).toBeInTheDocument();
		expect(actionUpdateMock).not.toHaveBeenCalled();
		const postBody = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')?.[1]?.body as URLSearchParams;
		expect(postBody.get('revision')).toBe('4');
		await expect.element(page.getByRole('button', { name: 'Changes queued' })).toBeDisabled();
	});

	it('does not abort an in-flight submission from its own state updates', async () => {
		let resolveAction!: (response: Response) => void;
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return new Promise<Response>((resolve) => { resolveAction = resolve; });
			}
			return Promise.resolve(statusResponse(syncStatusPayload()));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await page.getByRole('button', { name: 'Submit changes' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Submit changes' }).click();

		const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
		const signal = postCall?.[1]?.signal as AbortSignal;
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(signal.aborted).toBe(false);

		resolveAction(actionResponse('success', {
			success: true,
			currentRevision: 4,
			submittedRevision: 4,
			submission: actionSubmission('PENDING', 'req-in-flight'),
		}));
		await expect.element(page.getByText(/Request req-in-flight/)).toBeInTheDocument();
	});

	it('aborts a submission action on object change and ignores its late result', async () => {
		let resolveAction!: (response: Response) => void;
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return new Promise<Response>((resolve) => { resolveAction = resolve; });
			}
			return Promise.resolve(statusResponse(syncStatusPayload()));
		});
		vi.stubGlobal('fetch', fetchMock);
		const view = renderPage();
		await page.getByRole('button', { name: 'Submit changes' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Submit changes' }).click();
		const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
		const signal = postCall?.[1]?.signal as AbortSignal;

		await view.rerender({
			data: { editPayload: { ...editPayload, objectId: 'OBJ-2' }, isLockedByOtherUser: false },
			form: null,
		});
		expect(signal.aborted).toBe(true);
		resolveAction(actionResponse('success', {
			success: true,
			currentRevision: 4,
			submittedRevision: 4,
			submission: actionSubmission('PENDING', 'req-old-object'),
		}));
		await new Promise((resolve) => setTimeout(resolve, 0));

		await expect.element(page.getByText(/Request req-old-object/)).not.toBeInTheDocument();
		expect(actionUpdateMock).not.toHaveBeenCalled();
	});

	it('adopts an active-submission conflict action result', async () => {
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return Promise.resolve(actionResponse('failure', {
					submissionAlreadyActive: true,
					requestId: 'req-existing',
					requestStatus: 'PROCESSING',
				}, 409));
			}
			return Promise.resolve(statusResponse(syncStatusPayload()));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await page.getByRole('button', { name: 'Submit changes' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Submit changes' }).click();

		await expect.element(page.getByText(/Request req-existing/)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Synchronizing…' })).toBeDisabled();
	});

	it('renders unknown status without disabling submission or polling', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockResolvedValue(statusResponse(syncStatusPayload({
			latestSubmittedRevision: 4,
			latestSubmission: submission('PAUSED' as ArchiveSyncStatus),
		})));
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await vi.advanceTimersByTimeAsync(0);

		await expect.element(page.getByText('Archive synchronization has an unknown status: PAUSED.')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeEnabled();
		await vi.advanceTimersByTimeAsync(60_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('allows editing and saving while an earlier revision is synchronizing', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(syncStatusPayload({
			latestSubmittedRevision: 4,
			activeSubmission: submission('PROCESSING'),
			latestSubmission: submission('PROCESSING'),
			archiveOutOfSync: true,
		}))));
		renderPage();
		await expect.element(page.getByText(/Revision 4 is being synchronized with the archive/)).toBeInTheDocument();

		await page.getByRole('textbox', { name: 'Title' }).fill('Edited while synchronizing');

		await expect.element(page.getByRole('button', { name: 'Save draft' })).toBeEnabled();
		await expect.element(page.getByRole('button', { name: 'Synchronizing…' })).toBeDisabled();
	});

	it('shows newer saved changes as not included after a completed older revision', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(syncStatusPayload({
			currentRevision: 5,
			latestSubmittedRevision: 4,
			latestAppliedRevision: 4,
			latestSubmission: submission('COMPLETED'),
			archiveOutOfSync: true,
		}))));
		renderPage({
			...editPayload,
			revision: 5,
		});

		await expect.element(
			page.getByText('Revision 4 is synchronized; newer saved changes are not yet included.'),
		).toBeInTheDocument();
	});

	it('shows the out-of-sync notice for saved changes that were never submitted', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(syncStatusPayload({
			archiveOutOfSync: true,
		}))));
		renderPage();

		await expect.element(
			page.getByText('Saved changes have not been synchronized with the archive.'),
		).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Submit changes' })).toBeEnabled();
	});

	it('requeues a failed submission through the retry action', async () => {
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return Promise.resolve(actionResponse('success', {
					success: true,
					currentRevision: 4,
					submittedRevision: 4,
					submission: actionSubmission('PENDING', 'req-1'),
				}));
			}
			return Promise.resolve(statusResponse(syncStatusPayload({
				latestSubmittedRevision: 4,
				latestSubmission: submission('FAILED'),
			})));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage();

		await expect.element(page.getByRole('button', { name: 'Retry synchronization' })).toBeInTheDocument();
		await page.getByRole('button', { name: 'Retry synchronization' }).click();

		await expect.element(page.getByText(/Revision 4 is queued for archive synchronization/)).toBeInTheDocument();
	});

	it('warns before navigating away with unsaved changes', async () => {
		const confirmMock = vi.fn().mockReturnValue(false);
		vi.stubGlobal('confirm', confirmMock);
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(syncStatusPayload())));
		renderPage();
		await page.getByRole('textbox', { name: 'Title' }).fill('Unsaved title');

		const handler = beforeNavigateMock.mock.calls[0]?.[0] as (navigation: {
			cancel: () => void;
			to: { url: URL };
		}) => void;
		const navigation = { cancel: vi.fn(), to: { url: new URL('http://localhost/objects') } };
		handler(navigation);

		expect(confirmMock).toHaveBeenCalled();
		expect(navigation.cancel).toHaveBeenCalled();
	});

	it('renders editor chrome in English', async () => {
		renderPage();

		await expect.element(page.getByText('No changes')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Save draft' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Submit changes' }))
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
			.element(page.getByRole('button', { name: 'Отправить изменения' }))
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
		await expect.element(page.getByRole('region', { name: 'OCR text' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Curated text' }))
			.toBeInTheDocument();

		locale.setLocale('ru');

		await expect
			.element(page.getByRole('button', { name: 'Скопировать из источника' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('region', { name: 'OCR-текст' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Курированный текст' }))
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

	it('moves focus into the submit dialog when opened', async () => {
		renderPage();

		await page.getByRole('button', { name: 'Submit changes' }).click();
		await expect.element(page.getByRole('dialog')).toBeInTheDocument();

		await vi.waitFor(() => {
			expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull();
		});
	});

	it('restores focus to the submit trigger when the dialog closes', async () => {
		renderPage();

		const trigger = page.getByRole('button', { name: 'Submit changes' });
		await trigger.click();
		await page.getByRole('button', { name: 'Cancel' }).click();

		await vi.waitFor(() => {
			expect(document.activeElement).toBe(trigger.element());
		});
	});

	it('closes the submit dialog on Escape', async () => {
		renderPage();

		await page.getByRole('button', { name: 'Submit changes' }).click();
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

	it('exposes precision options as a named pressed-button group', async () => {
		renderPage();

		const group = page.getByRole('group', { name: 'Date precision' });
		await expect.element(group).toBeInTheDocument();
		await expect
			.element(group.getByRole('button', { pressed: true }))
			.toHaveTextContent('No date');
	});

	it('activates a focused precision option with Enter', async () => {
		renderPage();

		page.getByRole('button', { name: 'Year', exact: true }).element().focus();
		await userEvent.keyboard('{Enter}');

		await expect
			.element(page.getByRole('button', { name: 'Year', exact: true, pressed: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'No date', pressed: true }))
			.not.toBeInTheDocument();
	});

	it('activates a focused precision option with Space', async () => {
		renderPage();

		page.getByRole('button', { name: 'Year', exact: true }).element().focus();
		await userEvent.keyboard(' ');

		await expect
			.element(page.getByRole('button', { name: 'Year', exact: true, pressed: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'No date', pressed: true }))
			.not.toBeInTheDocument();
	});

	it('labels the publication date input when a precision is selected', async () => {
		renderPage({
			...editPayload,
			metadata: {
				...editPayload.metadata,
				publicationDate: '2026',
				datePrecision: 'year' as const
			}
		});

		await expect
			.element(page.getByRole('textbox', { name: 'Publication date' }))
			.toBeInTheDocument();
	});

	it('renders the precision group and publication date label in Russian', async () => {
		locale.setLocale('ru');
		renderPage({
			...editPayload,
			metadata: {
				...editPayload.metadata,
				publicationDate: '2026',
				datePrecision: 'year' as const
			}
		});

		await expect.element(page.getByRole('group', { name: 'Точность даты' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Дата публикации' }))
			.toBeInTheDocument();
	});

	it('links the publication date error to the input and hides both when precision becomes none', async () => {
		render(EditPage, {
			data: {
				editPayload: {
					...editPayload,
					metadata: {
						...editPayload.metadata,
						publicationDate: '2026',
						datePrecision: 'year' as const
					}
				},
				isLockedByOtherUser: false
			},
			form: {
				errorCode: 'highlightedFields',
				fieldErrors: { publicationDate: 'publicationDateInvalid' }
			}
		});

		const input = page.getByRole('textbox', { name: 'Publication date' });
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		await expect.element(input).toHaveAttribute(
			'aria-describedby',
			'edit-publication-date-error'
		);
		await expect
			.element(page.getByText('Publication date does not match selected precision.'))
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Check the highlighted fields.'))
			.toBeInTheDocument();

		await page.getByRole('button', { name: 'No date' }).click();

		await expect.element(input).not.toBeInTheDocument();
		await expect
			.element(page.getByText('Publication date does not match selected precision.'))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByText('Check the highlighted fields.'))
			.not.toBeInTheDocument();
	});

	it('clears date and approximation when precision returns to none and submits cleared metadata', async () => {
		const fetchMock = vi.fn().mockImplementation((_input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				return Promise.resolve(actionResponse('success', { editPayload }));
			}
			return Promise.resolve(statusResponse(syncStatusPayload()));
		});
		vi.stubGlobal('fetch', fetchMock);
		renderPage({
			...editPayload,
			metadata: {
				...editPayload.metadata,
				publicationDate: '2026-05',
				datePrecision: 'month' as const,
				dateApproximate: true
			}
		});

		await expect
			.element(page.getByRole('button', { name: 'Year + Month', pressed: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Publication date' }))
			.toHaveValue('2026-05');
		await expect
			.element(page.getByRole('checkbox', { name: 'Approximate date' }))
			.toBeChecked();

		await page.getByRole('button', { name: 'No date' }).click();

		await expect
			.element(page.getByRole('textbox', { name: 'Publication date' }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('checkbox', { name: 'Approximate date' }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'No date', pressed: true }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Save draft' })).toBeEnabled();

		await page.getByRole('button', { name: 'Save draft' }).click();

		await vi.waitFor(() => {
			const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
			expect(postCalls).toHaveLength(1);
		});

		const postBodies = fetchMock.mock.calls
			.filter(([, init]) => init?.method === 'POST')
			.map(([, init]) => init?.body as URLSearchParams);
		expect(JSON.parse(postBodies[0]?.get('metadata') ?? '{}')).toEqual({
			title: 'Object title',
			publicationDate: '',
			datePrecision: 'none',
			dateApproximate: false,
			language: 'en',
			tags: [],
			people: [],
			description: null
		});
		expect(JSON.parse(postBodies[0]?.get('rights') ?? '{}')).toEqual({
			rightsNote: null,
			sensitivityNote: null
		});
		expect(postBodies[0]?.get('revision')).toBe('4');
		expect(postBodies[0]?.has('pages')).toBe(false);
	});
});

describe('object edit page-count pluralization', () => {
	it('renders English singular and plural page counts', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(syncStatusPayload())));
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
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(statusResponse(syncStatusPayload())));
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
