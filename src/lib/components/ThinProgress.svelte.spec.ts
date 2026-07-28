import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

import ThinProgress from './ThinProgress.svelte';

describe('ThinProgress', () => {
	it('exposes bounded progress semantics', async () => {
		render(ThinProgress, { value: 3, total: 5 });

		const progress = page.getByRole('progressbar');

		await expect.element(progress).toHaveAttribute('aria-valuemin', '0');
		await expect.element(progress).toHaveAttribute('aria-valuemax', '5');
		await expect.element(progress).toHaveAttribute('aria-valuenow', '3');
	});

	it('clamps out-of-range values', async () => {
		render(ThinProgress, { value: -2, total: 5 });

		await expect.element(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
	});
});
