import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { IngestionDetail } from '$lib/services/ingestionDetail';

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

import IngestionDetailPage from './+page.svelte';

const detail: IngestionDetail = {
	id: 'batch-1',
	batchLabel: 'Batch 1',
	status: 'completed',
	actionCapabilities: {
		canResume: false,
		canRetry: false,
		canCancel: false,
		canRestore: false,
		canDelete: false
	},
	stagingPurge: { state: 'not_scheduled', startedAt: null, purgedAt: null },
	classificationType: 'image',
	itemKind: 'photo',
	languageCode: 'en',
	pipelinePreset: 'auto',
	accessLevel: 'private',
	embargoUntil: null,
	rightsNote: null,
	sensitivityNote: null,
	summary: {
		title: { primary: 'Batch 1', original_script: null, translations: [] },
		classification: { tags: [], summary: null },
		dates: {
			published: { value: null, approximate: false, confidence: 'medium', note: null },
			created: { value: null, approximate: false, confidence: 'medium', note: null }
		}
	},
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-02T00:00:00.000Z',
	processedObjects: 1,
	totalObjects: 1,
	files: [
		{
			id: 'file-1',
			name: 'page-1.jpg',
			status: 'UPLOADED',
			contentType: 'image/jpeg',
			sizeBytes: 100,
			createdAt: '2026-01-01T00:00:00.000Z',
			preview: {
				status: 'purged',
				contentType: null,
				width: null,
				height: null,
				url: null
			}
		}
	],
	items: []
};

describe('/ingestion/[batchId] +page.svelte', () => {
	it('renders retention-purged previews as unavailable', async () => {
		render(IngestionDetailPage, { data: { detail, activity: [], activityError: null } });

		await expect.element(page.getByText('page-1.jpg')).toBeInTheDocument();
		await expect
			.element(page.getByText('Preview unavailable: retention period expired'))
			.toBeInTheDocument();
	});

	it('renders completed with errors without retry or cancel actions', async () => {
		render(IngestionDetailPage, {
			data: {
				detail: { ...detail, status: 'completed_with_errors' },
				activity: [],
				activityError: null
			}
		});

		await expect.element(page.getByText('Completed with errors')).toBeInTheDocument();
		await expect.element(page.getByText('Actions')).not.toBeInTheDocument();
		await expect.element(page.getByText('Retry')).not.toBeInTheDocument();
		await expect.element(page.getByText('Cancel')).not.toBeInTheDocument();
	});

	it('uses explicit capabilities instead of failed status to render actions', async () => {
		render(IngestionDetailPage, {
			data: {
				detail: {
					...detail,
					status: 'failed',
					actionCapabilities: {
						canResume: false,
						canRetry: true,
						canCancel: false,
						canRestore: false,
						canDelete: false
					}
				},
				activity: [],
				activityError: null
			}
		});

		await expect.element(page.getByText('Retry')).toBeInTheDocument();
		await expect.element(page.getByText('Cancel')).not.toBeInTheDocument();
	});

	it('hides actions for a purge-pending failed ingestion', async () => {
		render(IngestionDetailPage, {
			data: {
				detail: {
					...detail,
					status: 'failed',
					stagingPurge: {
						state: 'pending',
						startedAt: '2026-01-03T00:00:00.000Z',
						purgedAt: null
					}
				},
				activity: [],
				activityError: null
			}
		});

		await expect.element(page.getByText('Actions')).not.toBeInTheDocument();
		await expect.element(page.getByText('Retry')).not.toBeInTheDocument();
	});
});
