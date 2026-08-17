import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { IngestionCapabilities } from '$lib/services/ingestionCapabilities';
import type { IngestionDetailFile, IngestionDetailItem } from '$lib/services/ingestionDetail';
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

const pageData = (): {
	batchId: string;
	capabilities: IngestionCapabilities;
	existingFiles: IngestionDetailFile[];
	items: IngestionDetailItem[];
	metadata: {
		classificationType:
			| 'newspaper_article'
			| 'magazine_article'
			| 'book_chapter'
			| 'book'
			| 'letter'
			| 'speech'
			| 'interview'
			| 'report'
			| 'manuscript'
			| 'image'
			| 'document'
			| 'other';
		itemKind?: 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other';
		languageCode: string;
		pipelinePreset: string;
		accessLevel: 'private' | 'family' | 'public';
		embargoUntil: string | null;
		rightsNote: string | null;
		sensitivityNote: string | null;
		summary: Record<string, unknown>;
	};
} => ({
	batchId: 'batch-1',
	capabilities,
	existingFiles: [
		{
			id: 'file-1',
			name: 'page-1.jpg',
			status: 'uploaded',
			statusRaw: 'uploaded',
			contentType: 'image/jpeg',
			sizeBytes: 100,
			createdAt: null,
			preview: null as IngestionDetailFile['preview']
		},
		{
			id: 'file-2',
			name: 'page-2.jpg',
			status: 'uploaded',
			statusRaw: 'uploaded',
			contentType: 'image/jpeg',
			sizeBytes: 100,
			createdAt: null,
			preview: null as IngestionDetailFile['preview']
		}
	],
	items: [
		{
			id: 'item-1',
			itemIndex: 1,
			label: 'Object one',
			status: null,
			statusRaw: 'DRAFT',
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

	afterEach(() => {
		vi.useRealTimers();
		locale.setLocale('en');
	});

	it('localizes the setup stepper position in Russian', async () => {
		locale.setLocale('ru');
		render(SetupPage, { data: pageData() });

		await expect.element(page.getByText('Шаг 2 из 3')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Загрузка, шаг 2 из 3' })).toBeInTheDocument();
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

	it('shows purged grouped previews as unavailable without polling', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const purgedData = pageData();
		purgedData.existingFiles[0] = {
			...purgedData.existingFiles[0]!,
			preview: {
				status: 'purged',
				contentType: null,
				width: null,
				height: null,
				url: null
			}
		};

		render(SetupPage, { data: purgedData });

		await page.getByRole('button', { name: 'Continue' }).click();
		await expect.element(page.getByText('Per-Object Metadata')).toBeInTheDocument();
		await expect
			.element(page.getByText('Preview unavailable: retention period expired'))
			.toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(2_001);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('marks timed-out preview checks as re-checkable and recovers on demand', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
		vi.stubGlobal('fetch', fetchMock);
		const pendingData = pageData();
		pendingData.existingFiles[0] = {
			...pendingData.existingFiles[0]!,
			preview: {
				status: 'pending',
				contentType: null,
				width: null,
				height: null,
				url: null
			}
		};

		render(SetupPage, { data: pendingData });

		await vi.advanceTimersByTimeAsync(2_001);
		expect(fetchMock).toHaveBeenCalled();

		fetchMock.mockClear();
		await vi.advanceTimersByTimeAsync(18_000);
		await expect
			.element(page.getByRole('button', { name: 'Check again' }).first())
			.toBeInTheDocument();

		fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
		await page.getByRole('button', { name: 'Check again' }).first().click();
		await vi.advanceTimersByTimeAsync(2_001);
		expect(fetchMock).toHaveBeenCalled();
		await expect
			.element(page.getByRole('button', { name: 'Check again' }))
			.not.toBeInTheDocument();
	});

	it('polls a ready preview immediately without the initial two-second delay', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		const pendingData = pageData();
		pendingData.existingFiles[0] = {
			...pendingData.existingFiles[0]!,
			preview: {
				status: 'pending',
				contentType: null,
				width: null,
				height: null,
				url: null
			}
		};

		render(SetupPage, { data: pendingData });

		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(fetchMock).toHaveBeenCalledTimes(1);
		await expect
			.element(page.getByRole('img', { name: 'page-1.jpg' }))
			.toBeInTheDocument();
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

	it('keeps grouped card headers as a single expansion control', async () => {
		vi.stubGlobal('fetch', vi.fn());
		render(SetupPage, { data: pageData() });

		await page.getByRole('button', { name: 'Continue' }).click();

		const header = page.getByRole('button', { name: /Object one/ }).last();
		await expect.element(header).toBeInTheDocument();
		expect(header.element().querySelectorAll('button').length).toBe(0);
		expect(header.element().querySelectorAll('[role="button"]').length).toBe(0);
	});

	it('opens an object-scoped gallery from an expanded grouped card', async () => {
		vi.stubGlobal('fetch', vi.fn());
		const readyData = pageData();
		readyData.existingFiles[0] = {
			...readyData.existingFiles[0]!,
			preview: { status: 'ready', contentType: 'image/jpeg', width: 10, height: 10, url: null }
		};
		readyData.existingFiles[1] = {
			...readyData.existingFiles[1]!,
			preview: { status: 'ready', contentType: 'image/jpeg', width: 10, height: 10, url: null }
		};
		render(SetupPage, { data: readyData });

		const organizeContinue = page.getByRole('button', { name: 'Continue' });
		await expect.element(organizeContinue).not.toBeDisabled();
		await organizeContinue.click();
		await page.getByRole('button', { name: /Object one/ }).last().click();

		await expect.element(page.getByText('2 items')).toBeInTheDocument();
		await page
			.getByRole('button', { name: 'Preview page-2.jpg, 2 of 2' })
			.click();

		await expect.element(page.getByText('2 of 2')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Next file' }))
			.toBeDisabled();
		await expect
			.element(page.getByRole('button', { name: 'Previous file' }))
			.not.toBeDisabled();

		await userEvent.keyboard('{Escape}');
		await expect
			.element(page.getByRole('button', { name: 'Preview page-2.jpg, 2 of 2' }))
			.toHaveFocus();
	});

	it('opens a one-file gallery for standalone files', async () => {
		vi.stubGlobal('fetch', vi.fn());
		const standaloneData = pageData();
		standaloneData.existingFiles = [
			{
				...standaloneData.existingFiles[0]!,
				preview: { status: 'ready', contentType: 'image/jpeg', width: 10, height: 10, url: null }
			}
		];
		standaloneData.items = [];
		render(SetupPage, { data: standaloneData });

		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: /page-1\.jpg/ }).last().click();

		await expect.element(page.getByText('1 item')).toBeInTheDocument();
		await page
			.getByRole('button', { name: 'Preview page-1.jpg, 1 of 1' })
			.click();

		await expect.element(page.getByText('1 of 1')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Next file' }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Previous file' }))
			.not.toBeInTheDocument();
	});

	it('opens a one-file gallery from an organize-step thumbnail', async () => {
		vi.stubGlobal('fetch', vi.fn());
		const readyData = pageData();
		readyData.existingFiles[0] = {
			...readyData.existingFiles[0]!,
			preview: { status: 'ready', contentType: 'image/jpeg', width: 10, height: 10, url: null }
		};
		render(SetupPage, { data: readyData });

		await page
			.getByRole('button', { name: 'Expand preview of page-1.jpg' })
			.click();

		await expect.element(page.getByText('1 of 1')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Next file' }))
			.not.toBeInTheDocument();
	});

	it('shows backend preview failures without a Check again action', async () => {
		vi.stubGlobal('fetch', vi.fn());
		const failedData = pageData();
		failedData.existingFiles[0] = {
			...failedData.existingFiles[0]!,
			preview: {
				status: 'failed',
				contentType: null,
				width: null,
				height: null,
				url: null
			}
		};
		render(SetupPage, { data: failedData });

		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: /Object one/ }).last().click();

		await expect.element(page.getByText('Preview failed')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Check again' }))
			.not.toBeInTheDocument();

		await page
			.getByRole('button', { name: 'Preview page-1.jpg, 1 of 2' })
			.click();
		await expect.element(page.getByRole('dialog')).toBeInTheDocument();
		await expect
			.element(
				page.getByText('The preview could not be generated for this file.')
			)
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Check again' }))
			.not.toBeInTheDocument();
	});

	it('does not poll for purged or unsupported previews', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const purgedData = pageData();
		purgedData.existingFiles[0] = {
			...purgedData.existingFiles[0]!,
			preview: { status: 'purged', contentType: null, width: null, height: null, url: null }
		};
		purgedData.existingFiles[1] = {
			...purgedData.existingFiles[1]!,
			preview: { status: 'unsupported', contentType: null, width: null, height: null, url: null }
		};
		render(SetupPage, { data: purgedData });

		await vi.advanceTimersByTimeAsync(2_001);
		expect(fetchMock).not.toHaveBeenCalled();

		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: /Object one/ }).last().click();
		await expect.element(page.getByText('Preview purged')).toBeInTheDocument();
		await expect
			.element(page.getByText('No visual preview', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Check again' }))
			.not.toBeInTheDocument();
	});

	it('shows localized backend file status labels for server files', async () => {
		vi.stubGlobal('fetch', vi.fn());
		const standaloneData = pageData();
		standaloneData.existingFiles = [standaloneData.existingFiles[0]!];
		standaloneData.items = [];
		render(SetupPage, { data: standaloneData });

		await expect
			.element(page.getByText('Uploaded', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('shows localized backend file status labels in Russian', async () => {
		locale.setLocale('ru');
		vi.stubGlobal('fetch', vi.fn());
		const standaloneData = pageData();
		standaloneData.existingFiles = [standaloneData.existingFiles[0]!];
		standaloneData.items = [];
		render(SetupPage, { data: standaloneData });

		await expect
			.element(page.getByText('Загружен', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('keeps unknown backend file statuses visible as raw values', async () => {
		vi.stubGlobal('fetch', vi.fn());
		const unknownData = pageData();
		unknownData.existingFiles = [
			{ ...unknownData.existingFiles[0]!, status: null, statusRaw: 'Future_File_State' }
		];
		unknownData.items = [];
		render(SetupPage, { data: unknownData });

		await expect
			.element(page.getByText('Future_File_State', { exact: true }))
			.toBeInTheDocument();
	});

	it('labels validated backend files with their own localized status', async () => {
		vi.stubGlobal('fetch', vi.fn());
		const validatedData = pageData();
		validatedData.existingFiles = [
			{ ...validatedData.existingFiles[0]!, status: 'validated', statusRaw: 'VALIDATED' }
		];
		validatedData.items = [];
		render(SetupPage, { data: validatedData });

		await expect
			.element(page.getByText('Validated', { exact: true }).first())
			.toBeInTheDocument();
		await expect
			.element(page.getByText('VALIDATED', { exact: true }))
			.not.toBeInTheDocument();
	});

	it('localizes header, step, and footer copy in Russian', async () => {
		locale.setLocale('ru');
		render(SetupPage, { data: pageData() });

		await expect.element(page.getByText('Загрузка').first()).toBeInTheDocument();
		await expect.element(page.getByText('Черновик · ещё не отправлен')).toBeInTheDocument();
		await expect.element(page.getByText('Отменить')).toBeInTheDocument();
		await expect.element(page.getByText('1 · Организация')).toBeInTheDocument();
		await expect.element(page.getByText('2 · Метаданные')).toBeInTheDocument();
		await expect
			.element(page.getByText('Автогруппировка по имени файла'))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Продолжить/ })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /Назад/ })).toBeInTheDocument();

		await page.getByRole('button', { name: /Продолжить/ }).first().click();
		await expect.element(page.getByText('Метаданные по объектам')).toBeInTheDocument();
	});

	it('localizes mutation failure labels reactively in Russian', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ error: 'Item is locked.' }), {
				status: 409,
				headers: { 'content-type': 'application/json' }
			})
		);
		vi.stubGlobal('fetch', fetchMock);

		render(SetupPage, { data: pageData() });
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: /Object one/ }).last().click();
		await page.getByRole('textbox', { name: 'Title' }).last().fill('Changed title');
		await new Promise((resolve) => setTimeout(resolve, 350));

		await expect
			.element(page.getByText('Object metadata could not be saved'))
			.toBeInTheDocument();

		locale.setLocale('ru');
		await expect
			.element(page.getByText('Не удалось сохранить: Метаданные объекта'))
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Перезагрузите сохранённую настройку перед дальнейшими изменениями.'))
			.toBeInTheDocument();
	});

	it('localizes the empty-batch abandon dialog in Russian', async () => {
		vi.stubGlobal('fetch', vi.fn());
		const emptyData = pageData();
		emptyData.existingFiles = [];
		emptyData.items = [];
		locale.setLocale('ru');
		render(SetupPage, { data: emptyData });
		openEmptyBatchDialog();

		await expect.element(page.getByText('Пустая партия')).toBeInTheDocument();
		await expect.element(page.getByText('Файлы ещё не загружены')).toBeInTheDocument();
		await expect
			.element(page.getByText(/Вы ещё не загрузили ни одного файла/))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Оставить как черновик' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Удалить партию' }))
			.toBeInTheDocument();
	});

	it('localizes organize counts in Russian with plural forms', async () => {
		vi.stubGlobal('fetch', vi.fn());
		locale.setLocale('ru');
		render(SetupPage, { data: pageData() });

		await expect.element(page.getByText('Каждая группа станет')).toBeInTheDocument();
		await expect.element(page.getByText('ОДНИМ объектом')).toBeInTheDocument();
		await expect.element(page.getByText('в вашей библиотеке.')).toBeInTheDocument();
		await expect.element(page.getByText('1 объект', { exact: false }).first()).toBeInTheDocument();
		await expect.element(page.getByText('2 файла', { exact: false }).first()).toBeInTheDocument();
	});
});
