import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import Stepper from './Stepper.svelte';

const steps = [
	{ id: 'intent', label: 'Intent' },
	{ id: 'files', label: 'Files' },
	{ id: 'review', label: 'Review' }
];

describe('Stepper', () => {
	it('disables completed steps when no jump handler is provided', async () => {
		render(Stepper, { steps, current: 1 });

		const completedStep = page.getByRole('button', { name: 'Intent, step 1 of 3' });
		const currentStep = page.getByRole('button', { name: 'Files, step 2 of 3' });

		await expect.element(completedStep).toBeDisabled();
		await expect.element(currentStep).toHaveAttribute('aria-current', 'step');
	});

	it('allows completed steps to jump when a handler is provided', async () => {
		const onJump = vi.fn();
		render(Stepper, { steps, current: 2, onJump });

		const completedStep = page.getByRole('button', { name: 'Files, step 2 of 3' });
		await expect.element(completedStep).not.toBeDisabled();

		await completedStep.click();

		expect(onJump).toHaveBeenCalledWith(1);
	});
});
