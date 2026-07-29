import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { IngestionCapabilities } from '$lib/services/ingestionCapabilities';

const { beforeNavigateMock, gotoMock } = vi.hoisted(() => ({
	beforeNavigateMock: vi.fn(),
	gotoMock: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	beforeNavigate: beforeNavigateMock,
	goto: gotoMock
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import SetupPage from './+page.svelte';

const itemSummary = {
	classification: { tags: ['archive'], summary: 'Item summary' },
	dates: { published: { value: '2020', approximate: false } },
	people: { mentioned: [] }
};

const batchSummary: {
	title: { primary: string; original_script: string | null; translations: unknown[] };
	classification: { tags: string[]; summary: string | null };
	dates: {
		published: { value: string | null; approximate: boolean; confidence: string; note: string | null };
		created: { value: string | null; approximate: boolean; confidence: string; note: string | null };
	};
} = {
	title: { primary: 'Batch title', original_script: null, translations: [] },
	classification: { tags: [], summary: null },
	dates: {
		published: { value: null, approximate: false, confidence: 'medium', note: null },
		created: { value: null, approximate: false, confidence: 'medium', note: null }
	}
};

const capabilities: IngestionCapabilities = {
	mediaKinds: ['image', 'audio', 'video', 'document'],
	extensionsByKind: {
		image: ['jpg'],
		audio: ['mp3'],
		video: ['mp4'],
		document: ['pdf']
	},
	mimeByKind: {
		image: ['image/jpeg'],
		audio: ['audio/mpeg'],
		video: ['video/mp4'],
		document: ['application/pdf']
	},
	mimeAliases: {}
};

const pageData = () => ({
	batchId: 'batch-1',
	capabilities,
	existingFiles: [
		{
			id: 'file-1',
			name: 'page-1.jpg',
			status: 'uploaded',
			contentType: 'image/jpeg',
			sizeBytes: 100,
			createdAt: null,
			preview: null
		},
		{
			id: 'file-2',
			name: 'page-2.jpg',
			status: 'uploaded',
			contentType: 'image/jpeg',
			sizeBytes: 100,
			createdAt: null,
			preview: null
		}
	],
	items: [
		{
			id: 'item-1',
			itemIndex: 1,
			label: 'Object one',
			status: 'DRAFT',
			summary: itemSummary,
			files: [
				{ id: 'link-1', ingestionFileId: 'file-1', sortOrder: 1 },
				{ id: 'link-2', ingestionFileId: 'file-2', sortOrder: 2 }
			]
		}
	],
	metadata: {
		classificationType: 'document' as const,
		itemKind: 'photo' as const,
		languageCode: 'en',
		pipelinePreset: 'none',
		accessLevel: 'private' as const,
		embargoUntil: null,
		rightsNote: null,
		sensitivityNote: null,
		summary: batchSummary
	}
});

const openEmptyBatchDialog = (): void => {
	const guard = beforeNavigateMock.mock.calls.at(-1)?.[0] as (event: {
		cancel: () => void;
		to: { url: { pathname: string; search: string; hash: string } };
	}) => void;
	guard({
		cancel: vi.fn(),
		to: { url: { pathname: '/ingestion', search: '', hash: '' } }
	});
};

describe('/ingestion/[batchId]/setup +page.svelte', () => {
	beforeEach(() => {
		beforeNavigateMock.mockReset();
		gotoMock.mockReset();
		gotoMock.mockResolvedValue(undefined);
	});

	it('blocks Continue and surfaces an HTTP mutation failure', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ error: 'Item is locked.' }), {
				status: 409,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		render(SetupPage, { data: pageData() });

		const organizeContinue = page.getByRole('button', { name: 'Continue' });
		await expect.element(organizeContinue).not.toBeDisabled();
		await organizeContinue.click();

		const objectCard = page.getByRole('button', { name: /Object one/ }).last();
		await objectCard.click();
		const titleInput = page.getByRole('textbox', { name: 'Title' }).last();
		await titleInput.fill('Changed title');

		await new Promise((resolve) => setTimeout(resolve, 350));

		await expect
			.element(page.getByText('Object metadata could not be saved'))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('keeps Continue and navigation blocked while a mutation is in flight', async () => {
		let resolveFetch: (response: Response) => void = () => undefined;
		const fetchMock = vi.fn().mockReturnValue(
			new Promise<Response>((resolve) => {
				resolveFetch = resolve;
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		render(SetupPage, { data: pageData() });
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: /Object one/ }).last().click();
		await page.getByRole('textbox', { name: 'Title' }).last().fill('Changed title');
		await new Promise((resolve) => setTimeout(resolve, 350));

		const cancel = vi.fn();
		const guard = beforeNavigateMock.mock.calls[0]?.[0] as (event: {
			cancel: () => void;
			to: { url: { pathname: string } };
		}) => void;
		guard({ cancel, to: { url: { pathname: '/ingestion' } } });

		expect(cancel).toHaveBeenCalledTimes(1);
		await expect.element(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

		resolveFetch(new Response(null, { status: 200 }));
		await new Promise((resolve) => setTimeout(resolve, 0));
		await expect.element(page.getByRole('button', { name: 'Continue' })).not.toBeDisabled();
	});

	it('surfaces network mutation failures instead of treating them as saved', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('Network unavailable.'));
		vi.stubGlobal('fetch', fetchMock);

		render(SetupPage, { data: pageData() });
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: /Object one/ }).last().click();
		await page.getByRole('textbox', { name: 'Title' }).last().fill('Changed title');
		await new Promise((resolve) => setTimeout(resolve, 350));

		await expect
			.element(page.getByText('Object metadata could not be saved'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Network unavailable.')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
	});

	it('retries only unfinished standalone item work after metadata save failure', async () => {
		const actions: string[] = [];
		let metadataAttempts = 0;
		const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
			const body = JSON.parse((init as RequestInit).body as string) as { action: string };
			actions.push(body.action);
			if (body.action === 'create_item') {
				return new Response(JSON.stringify({ id: 'item-1', itemIndex: 1 }), { status: 200 });
			}
			if (body.action === 'update_item') {
				metadataAttempts += 1;
				return new Response(null, { status: metadataAttempts === 1 ? 409 : 200 });
			}
			return new Response(null, { status: 200 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const standaloneData = pageData();
		standaloneData.existingFiles = [standaloneData.existingFiles[0]!];
		standaloneData.items = [];
		standaloneData.metadata = {
			...standaloneData.metadata,
			summary: {
				...batchSummary,
				classification: { tags: ['batch'], summary: null } as {
					tags: string[];
					summary: string | null;
				},
				dates: {
					...batchSummary.dates,
					created: {
						value: '2020',
						approximate: false,
						confidence: 'medium',
						note: null
					} as {
						value: string | null;
						approximate: boolean;
						confidence: 'low' | 'medium' | 'high';
						note: string | null;
					}
				}
			}
		};

		render(SetupPage, { data: standaloneData });
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: 'Continue' }).click();
		await expect.element(page.getByText('Failed to save object metadata.')).toBeInTheDocument();

		await page.getByRole('button', { name: 'Continue' }).click();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(actions).toEqual(['create_item', 'attach_file', 'update_item', 'update_item']);
	});

	it('stops queued mutations after an unauthorized response', async () => {
		let resolveFetch: (response: Response) => void = () => undefined;
		const fetchMock = vi.fn().mockReturnValue(
			new Promise<Response>((resolve) => {
				resolveFetch = resolve;
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		render(SetupPage, { data: pageData() });
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: /Object one/ }).last().click();
		const titleInput = page.getByRole('textbox', { name: 'Title' }).last();
		await titleInput.fill('First change');
		await new Promise((resolve) => setTimeout(resolve, 350));
		await titleInput.fill('Second change');
		await new Promise((resolve) => setTimeout(resolve, 350));

		resolveFetch(new Response(null, { status: 401 }));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(gotoMock).toHaveBeenCalledWith('/login');
	});

	it('allocates after sparse persisted standalone item indexes', async () => {
		const createIndexes: number[] = [];
		const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
			const body = JSON.parse((init as RequestInit).body as string) as {
				action: string;
				itemIndex?: number;
			};
			if (body.action === 'create_item') {
				createIndexes.push(body.itemIndex!);
				return new Response(JSON.stringify({ id: 'item-10', itemIndex: body.itemIndex }), {
					status: 200
				});
			}
			return new Response(null, { status: 200 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const sparseData = pageData();
		sparseData.existingFiles = [
			...sparseData.existingFiles,
			{
				...sparseData.existingFiles[0]!,
				id: 'file-3',
				name: 'page-3.jpg'
			}
		];
		sparseData.items = [
			{
				...sparseData.items[0]!,
				id: 'item-9',
				itemIndex: 9,
				files: [{ id: 'link-1', ingestionFileId: 'file-1', sortOrder: 1 }]
			},
			{
				...sparseData.items[0]!,
				id: 'item-2',
				itemIndex: 2,
				files: [{ id: 'link-2', ingestionFileId: 'file-2', sortOrder: 1 }]
			}
		];
		sparseData.metadata = {
			...sparseData.metadata,
			summary: {
				...batchSummary,
				classification: { tags: ['batch'], summary: null },
				dates: {
					...batchSummary.dates,
					created: { value: '2020', approximate: false, confidence: 'medium', note: null }
				}
			}
		};

		render(SetupPage, { data: sparseData });
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: 'Continue' }).click();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(createIndexes).toEqual([10]);
	});

	it('leaves an empty batch only after confirmed deletion', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ ok: true }), { status: 200 })
		);
		vi.stubGlobal('fetch', fetchMock);
		const emptyData = pageData();
		emptyData.existingFiles = [];
		emptyData.items = [];
		render(SetupPage, { data: emptyData });
		openEmptyBatchDialog();

		await page.getByRole('button', { name: 'Delete batch' }).click();

		expect(gotoMock).toHaveBeenCalledWith('/ingestion');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('treats a missing batch as an idempotent deletion success', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
		const emptyData = pageData();
		emptyData.existingFiles = [];
		emptyData.items = [];
		render(SetupPage, { data: emptyData });
		openEmptyBatchDialog();

		await page.getByRole('button', { name: 'Delete batch' }).click();

		expect(gotoMock).toHaveBeenCalledWith('/ingestion');
	});

	it('keeps the deletion dialog open after a backend rejection', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ error: 'Batch is locked.' }), {
					status: 423,
					headers: { 'content-type': 'application/json' }
				})
			)
		);
		const emptyData = pageData();
		emptyData.existingFiles = [];
		emptyData.items = [];
		render(SetupPage, { data: emptyData });
		openEmptyBatchDialog();

		await page.getByRole('button', { name: 'Delete batch' }).click();

		await expect.element(page.getByRole('alert')).toHaveTextContent('Batch is locked.');
		await expect.element(page.getByRole('button', { name: 'Retry delete' })).toBeInTheDocument();
		expect(gotoMock).not.toHaveBeenCalled();
	});

	it('keeps the deletion dialog open after a network failure', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
		const emptyData = pageData();
		emptyData.existingFiles = [];
		emptyData.items = [];
		render(SetupPage, { data: emptyData });
		openEmptyBatchDialog();

		await page.getByRole('button', { name: 'Delete batch' }).click();

		await expect.element(page.getByRole('alert')).toHaveTextContent('Failed to delete the batch.');
		expect(gotoMock).not.toHaveBeenCalled();
	});

	it('navigates only to login after an unauthorized deletion', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
		const emptyData = pageData();
		emptyData.existingFiles = [];
		emptyData.items = [];
		render(SetupPage, { data: emptyData });
		openEmptyBatchDialog();

		await page.getByRole('button', { name: 'Delete batch' }).click();

		expect(gotoMock).toHaveBeenCalledWith('/login');
		expect(gotoMock).not.toHaveBeenCalledWith('/ingestion');
	});

});
