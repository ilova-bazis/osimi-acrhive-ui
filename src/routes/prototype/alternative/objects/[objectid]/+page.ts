import { error } from '@sveltejs/kit';
import { getMockObjectView, mockObjectViews } from '$lib/objectView/mockObjects';

export const load = ({ params }: { params: { objectid: string } }) => {
	const object = getMockObjectView(params.objectid);

	if (!object) {
		throw error(404, { message: 'Prototype object not found.' });
	}

	return {
		object,
		reviewItems: mockObjectViews.map((item) => ({ id: item.id, title: item.title, mediaType: item.mediaType }))
	};
};
