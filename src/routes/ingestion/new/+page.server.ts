import { fail, redirect } from '@sveltejs/kit';
import { ingestionNewService } from '$lib/services';

export const actions = {
	default: async ({ request }: { request: Request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();

		if (!name) {
			return fail(400, { error: 'Batch name is required.' });
		}

		const result = await ingestionNewService.createDraft({
			name,
			description: description.length ? description : undefined
		});

		throw redirect(303, `/ingestion/${result.batchId}/setup`);
	}
};
