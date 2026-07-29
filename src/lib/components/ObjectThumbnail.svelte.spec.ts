import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ObjectThumbnail from './ObjectThumbnail.svelte';

describe('ObjectThumbnail', () => {
	it('uses the inline artifact view route for image resources', async () => {
		render(ObjectThumbnail, {
			objectId: 'object-1',
			thumbnailArtifactId: 'artifact-1',
			objectType: 'IMAGE'
		});

		await expect
			.element(page.getByTestId('object-thumbnail-image'))
			.toHaveAttribute('src', '/objects/object-1/artifacts/artifact-1/view');
	});
});
