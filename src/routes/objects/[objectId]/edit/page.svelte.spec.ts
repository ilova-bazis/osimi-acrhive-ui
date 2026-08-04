import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
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
});
