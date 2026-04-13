import { error } from '@sveltejs/kit';
import { getMockObjectView, mockObjectViews } from '$lib/objectView/mockObjects';
import { getMockEditData } from '$lib/objectView/mockEditData';

export const load = ({ params }: { params: { objectid: string } }) => {
	const object = getMockObjectView(params.objectid);
	if (!object) {
		throw error(404, { message: 'Prototype object not found.' });
	}

	const editData = getMockEditData(params.objectid);
	if (!editData) {
		throw error(404, { message: 'Edit data not found for this object.' });
	}

	return {
		object,
		editData,
		reviewItems: mockObjectViews.map((item) => ({
			id: item.id,
			title: item.title,
			mediaType: item.mediaType
		}))
	};
};
