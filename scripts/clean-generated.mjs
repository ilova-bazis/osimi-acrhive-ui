import { rm } from 'node:fs/promises';

await Promise.all([
	rm('.svelte-kit', { recursive: true, force: true }),
	rm('build', { recursive: true, force: true }),
]);
