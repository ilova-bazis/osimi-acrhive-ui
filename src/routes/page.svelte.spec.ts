import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		render(Page, {
			data: {
				summary: {
					metrics: { activeBatches: 0, needsReview: 0, pendingUploads: 0 },
					primaryAction: 'Start ingestion',
					secondaryAction: 'Browse objects',
					roleTagline: 'Archive workspace',
					recentActivity: []
				}
			}
		});
		
		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});
});
