import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';
import type { IngestionOverviewSummary } from '$lib/services/ingestionOverview';

const { gotoMock, invalidateAllMock } = vi.hoisted(() => ({
	gotoMock: vi.fn(),
	invalidateAllMock: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	goto: gotoMock,
	invalidateAll: invalidateAllMock
}));

vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

import IngestionOverviewPage from './+page.svelte';

const noActions = {
	canResume: false,
	canRetry: false,
	canCancel: false,
	canRestore: false,
	canDelete: false
};

const summary = (): IngestionOverviewSummary => ({
	stats: {
		totalBatches: 2,
		objectsCreated: 0,
		inProgress: 1,
		needsAttention: 0
	},
	activeAndRecent: [
		{
			id: 'ing-1',
			name: 'Known batch',
			createdAt: '2026-02-01T00:00:00.000Z',
			status: 'queued',
			statusRaw: 'QUEUED',
			progress: { completed: 0, total: 1 },
			actionCapabilities: noActions,
			stagingPurge: { state: 'not_scheduled', startedAt: null, purgedAt: null },
			actions: ['view']
		},
		{
			id: 'ing-2',
			name: 'Unknown batch',
			createdAt: '2026-02-02T00:00:00.000Z',
			status: null,
			statusRaw: 'Future_State',
			progress: { completed: 0, total: 1 },
			actionCapabilities: noActions,
			stagingPurge: { state: 'not_scheduled', startedAt: null, purgedAt: null },
			actions: ['view']
		}
	],
	drafts: [],
	nextCursor: null
});

describe('/ingestion +page.svelte', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		locale.setLocale('en');
	});

	it('localizes known batch statuses in English', async () => {
		render(IngestionOverviewPage, {
			data: { summary: summary(), activePage: 1, draftPage: 1 }
		});

		await expect.element(page.getByText('Queued', { exact: true }).first()).toBeInTheDocument();
	});

	it('localizes known batch statuses in Russian', async () => {
		locale.setLocale('ru');
		render(IngestionOverviewPage, {
			data: { summary: summary(), activePage: 1, draftPage: 1 }
		});

		await expect
			.element(page.getByText('В очереди', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('retranslates known statuses without remounting', async () => {
		render(IngestionOverviewPage, {
			data: { summary: summary(), activePage: 1, draftPage: 1 }
		});

		await expect.element(page.getByText('Queued', { exact: true }).first()).toBeInTheDocument();
		locale.setLocale('ru');

		await expect
			.element(page.getByText('В очереди', { exact: true }).first())
			.toBeInTheDocument();
	});

	it('keeps unknown backend statuses visible as raw values', async () => {
		render(IngestionOverviewPage, {
			data: { summary: summary(), activePage: 1, draftPage: 1 }
		});

		await expect
			.element(page.getByText('Future_State', { exact: true }))
			.toBeInTheDocument();
	});

	it('does not change unknown raw values when the locale changes', async () => {
		render(IngestionOverviewPage, {
			data: { summary: summary(), activePage: 1, draftPage: 1 }
		});

		await expect
			.element(page.getByText('Future_State', { exact: true }))
			.toBeInTheDocument();
		locale.setLocale('ru');

		await expect
			.element(page.getByText('Future_State', { exact: true }))
			.toBeInTheDocument();
	});
});

describe('/ingestion action failures', () => {
	const deletableSummary = (): IngestionOverviewSummary => {
		const base = summary();
		return {
			...base,
			activeAndRecent: [
				{
					...base.activeAndRecent[0]!,
					actionCapabilities: { ...noActions, canDelete: true },
					actions: ['delete']
				}
			]
		};
	};

	const renderWithFailure = (body: unknown, status = 409) => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify(body), {
					status,
					headers: { 'content-type': 'application/json' }
				})
			)
		);

		render(IngestionOverviewPage, {
			data: { summary: deletableSummary(), activePage: 1, draftPage: 1 }
		});
	};

	const clickDelete = async (label: string) => {
		const details = document.querySelector('details');
		if (details) details.open = true;
		await page.getByRole('button', { name: label }).click();
	};

	afterEach(() => {
		vi.unstubAllGlobals();
		locale.setLocale('en');
	});

	it('renders a localized message for an explicitly coded failure', async () => {
		renderWithFailure({ error: 'Batch is locked.', errorCode: 'locked' }, 423);

		await clickDelete('Delete');

		await expect
			.element(page.getByText('This item is locked and cannot be changed right now.'))
			.toBeInTheDocument();
	});

	it('renders the failure in Russian', async () => {
		locale.setLocale('ru');
		renderWithFailure({ error: 'Batch is locked.', errorCode: 'locked' }, 423);

		await clickDelete('Удалить');

		await expect
			.element(page.getByText('Элемент заблокирован. Сейчас его нельзя изменить.'))
			.toBeInTheDocument();
	});

	it('never renders the raw server message', async () => {
		renderWithFailure({ error: 'Batch is locked.', errorCode: 'locked' }, 423);

		await clickDelete('Delete');

		await expect.element(page.getByText('Batch is locked.')).not.toBeInTheDocument();
	});

	it('uses the operation fallback when the server did not name the failure', async () => {
		renderWithFailure({ error: 'Batch is locked.' }, 423);

		await clickDelete('Delete');

		await expect
			.element(page.getByText('Failed to delete ingestion Known batch.'))
			.toBeInTheDocument();
	});

	it('retranslates the operation fallback, including the action label', async () => {
		renderWithFailure({ error: 'Batch is locked.' }, 423);

		await clickDelete('Delete');
		await expect
			.element(page.getByText('Failed to delete ingestion Known batch.'))
			.toBeInTheDocument();

		locale.setLocale('ru');

		await expect
			.element(page.getByText('Не удалось удалить загрузку «Known batch».'))
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Failed to delete ingestion Known batch.'))
			.not.toBeInTheDocument();
	});

	it('retranslates a visible failure when the locale changes', async () => {
		renderWithFailure({ error: 'Batch is locked.', errorCode: 'locked' }, 423);

		await clickDelete('Delete');
		await expect
			.element(page.getByText('This item is locked and cannot be changed right now.'))
			.toBeInTheDocument();

		locale.setLocale('ru');

		await expect
			.element(page.getByText('Элемент заблокирован. Сейчас его нельзя изменить.'))
			.toBeInTheDocument();
	});
});
