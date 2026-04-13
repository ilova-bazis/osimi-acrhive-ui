<script lang="ts">
	import ObjectEditLayout from '$lib/components/object-edit/ObjectEditLayout.svelte';
	import type { ObjectViewRecord } from '$lib/objectView/types';
	import type { ObjectEditData } from '$lib/objectView/mockEditData';

	let {
		data
	} = $props<{
		data: {
			object: ObjectViewRecord;
			editData: ObjectEditData;
		};
	}>();
</script>

<svelte:head>
	<title>Edit: {data.object.title} — Prototype</title>
</svelte:head>

<ObjectEditLayout object={data.object} initialEditData={data.editData} />