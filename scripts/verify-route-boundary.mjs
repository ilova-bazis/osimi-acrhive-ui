import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = '.svelte-kit/output';
const forbidden = [
	'/prototype',
	'/ingestion-proto',
	'Prototype object not found.',
	'mockObjectViews',
	'src/routes/prototype',
];

const files = [];
const collect = async (directory) => {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) await collect(path);
		else if (entry.name.endsWith('.js') || entry.name.endsWith('.json')) files.push(path);
	}
};

await collect(root);
const violations = [];
for (const file of files) {
	const content = await readFile(file, 'utf8');
	for (const token of forbidden) {
		if (content.includes(token)) violations.push(`${file}: ${token}`);
	}
}

if (violations.length > 0) {
	console.error(`Prototype route boundary failed:\n${violations.join('\n')}`);
	process.exit(1);
}

console.log(`Verified ${files.length} generated files: no prototype routes or loaders.`);
