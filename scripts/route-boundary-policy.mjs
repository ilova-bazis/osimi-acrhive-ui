export const FORBIDDEN_ROUTE_SEGMENTS = ['prototype', 'ingestion-proto', 'components'];

export const FORBIDDEN_SOURCE_ROOTS = [
	'src/routes/prototype',
	'src/routes/ingestion-proto',
	'src/routes/components',
	'src/lib/components/object-view',
	'src/lib/components/object-view-alt',
	'src/lib/prototype'
];

export const FORBIDDEN_SOURCE_FILES = [
	'src/lib/components/object-edit/ObjectEditDetails.svelte',
	'src/lib/components/object-edit/ObjectEditLayout.svelte',
	'src/lib/components/object-edit/ObjectEditPanel.svelte',
	'src/lib/components/object-edit/ObjectEditRights.svelte',
	'src/lib/components/object-edit/ObjectEditSourceText.svelte',
	'src/lib/components/object-edit/ObjectEditTopBar.svelte',
	'src/lib/components/object-edit/ObjectEditTranscript.svelte',
	'src/lib/objectView/mockObjects.ts',
	'src/lib/objectView/mockEditData.ts',
	'src/lib/objectView/types.ts',
	'src/lib/components/BatchIntentPanel.svelte',
	'src/lib/components/DropzonePanel.svelte',
	'src/lib/components/FileListPanel.svelte',
	'src/lib/components/FileOverridePanel.svelte',
	'src/lib/components/FileRow.svelte',
	'src/lib/components/FooterActions.svelte',
	'src/lib/components/PageHeader.svelte',
	'src/lib/components/StatusLegendPanel.svelte',
	'src/lib/data/seed.ts',
	'src/lib/ui/mapBatch.ts'
];

export const FORBIDDEN_IMPORT_PATTERNS = [
	{
		group: ['$lib/objectView', '$lib/objectView/*'],
		message: 'Prototype mock data is not a production dependency.'
	},
	{
		group: ['$lib/components/object-view', '$lib/components/object-view/*'],
		message: 'Use production object-detail components.'
	},
	{
		group: ['$lib/components/object-view-alt', '$lib/components/object-view-alt/*'],
		message: 'Use production object-detail components.'
	},
	{
		group: FORBIDDEN_SOURCE_FILES.filter((path) => path.startsWith('src/lib/components/object-edit/')).map((path) =>
			path.replace('src/lib/', '$lib/')
		),
		message: 'Only production-owned object-edit components may be imported.'
	},
	{
		group: FORBIDDEN_SOURCE_FILES.filter((path) => !path.startsWith('src/lib/components/object-edit/')).map((path) =>
			path.replace('src/lib/', '$lib/').replace(/\.ts$/, '')
		),
		message: 'Removed gallery and prototype source is not a production dependency.'
	},
	{
		group: ['$lib/prototype', '$lib/prototype/*'],
		message: 'Prototype reference code cannot be imported by the application.'
	}
];

export const FORBIDDEN_EMITTED_TOKENS = [
	...FORBIDDEN_SOURCE_ROOTS,
	...FORBIDDEN_SOURCE_FILES,
	'Prototype object not found.',
	'mockObjectViews',
	'mockObjects',
	'mockEditData',
	'object-view-alt',
	'object-view/',
	'ObjectEditDetails',
	'ObjectEditLayout',
	'ObjectEditPanel',
	'ObjectEditRights',
	'ObjectEditSourceText',
	'ObjectEditTopBar',
	'ObjectEditTranscript',
	'BatchIntentPanel',
	'DropzonePanel',
	'FileListPanel',
	'FileOverridePanel',
	'FileRow',
	'FooterActions',
	'PageHeader',
	'StatusLegendPanel',
	'mapBatch'
];
