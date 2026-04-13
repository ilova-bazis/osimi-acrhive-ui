import { error } from '@sveltejs/kit';
import { getMockObjectView } from '$lib/objectView/mockObjects';
import { getMockEditData } from '$lib/objectView/mockEditData';

export const load = ({ params }: { params: { id: string } }) => {
	const object = getMockObjectView(params.id);
	if (!object) {
		throw error(404, { message: 'Prototype object not found.' });
	}

	const editData = getMockEditData(params.id);
	if (!editData) {
		throw error(404, { message: 'Edit data not found for this object.' });
	}

	return { object, editData };
};