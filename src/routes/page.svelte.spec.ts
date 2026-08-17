import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { locale } from '$lib/i18n/locale';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		render(Page, {
			data: {
				summary: {
					metrics: { activeBatches: 0, needsReview: 0, pendingUploads: 0 },
					roleCopyCode: 'archiver',
					recentActivity: []
				}
			}
		});
		
		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});

	it('formats activity timestamps in UTC and groups metric counts', async () => {
		render(Page, {
			data: {
				summary: {
					metrics: { activeBatches: 1234, needsReview: 3, pendingUploads: 7 },
					roleCopyCode: 'archiver',
					recentActivity: [
						{
							id: 'act-1',
							eventCode: 'INGESTION_COMPLETED',
							typeFallback: 'INGESTION_COMPLETED',
							description: { code: 'raw', text: 'Smoke activity.' },
							timestamp: '2026-08-04T23:59:00.000Z',
							type: 'ingestion_completed',
							ingestionId: null,
							objectId: null,
							actorUserId: null,
							payload: null
						}
					]
				}
			}
		});

		await expect.element(page.getByText('1,234')).toBeInTheDocument();
		await expect.element(page.getByText(/Aug 4, 2026/)).toBeInTheDocument();
		await expect.element(page.getByText(/11:59/)).toBeInTheDocument();
	});

	it('renders the localized unknown fallback for invalid timestamps', async () => {
		locale.setLocale('ru');
		try {
			render(Page, {
				data: {
					summary: {
						metrics: { activeBatches: 0, needsReview: 0, pendingUploads: 0 },
						roleCopyCode: 'archiver',
						recentActivity: [
							{
								id: 'act-2',
								eventCode: null,
								typeFallback: 'Broken activity',
								description: { code: 'raw', text: 'Broken timestamp.' },
								timestamp: 'not-a-date',
								type: 'unknown',
								ingestionId: null,
								objectId: null,
								actorUserId: null,
								payload: null
							}
						]
					}
				}
			});

			await expect.element(page.getByText('—')).toBeInTheDocument();
		} finally {
			locale.setLocale('en');
		}
	});
});
