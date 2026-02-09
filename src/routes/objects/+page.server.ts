import { objectsService } from '$lib/services';

export const load = async () => {
	const [recent, list] = await Promise.all([
		objectsService.listRecent(),
		objectsService.listObjects({ page: 1, pageSize: 25, sort: 'updated_desc' })
	]);

	return {
		recent,
		list
	};
};
