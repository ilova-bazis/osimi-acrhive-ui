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
