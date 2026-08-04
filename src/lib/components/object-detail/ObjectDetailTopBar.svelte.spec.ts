import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import ObjectDetailTopBar from './ObjectDetailTopBar.svelte';

describe('ObjectDetailTopBar', () => {
	it('uses declarative production back navigation', async () => {
		render(ObjectDetailTopBar, {
			backHref: '/objects?q=ledger', title: 'Ledger', objectId: 'OBJ-20260804-LEDGER1',
			processingLabel: 'Indexed', processingTone: 'approved', availabilityLabel: 'Available',
			accessLevelLabel: 'Private', reviewLabel: 'Reviewed', onInfoToggle: vi.fn(), onResync: vi.fn(),
		});

		await expect.element(page.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/objects?q=ledger');
	});
});
