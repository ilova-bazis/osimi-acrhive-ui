import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(SCRIPT_DIR, '..');

export const DEPLOYED_ROOT = join(PROJECT_DIR, 'build');
export const INTERMEDIATE_ROOT = join(PROJECT_DIR, '.svelte-kit/output');
export const REQUIRED_ENTRY = join(DEPLOYED_ROOT, 'index.js');

export const FORBIDDEN = [
	'/prototype',
	'/ingestion-proto',
	'src/routes/prototype',
	'src/routes/ingestion-proto',
	'src/routes/components',
	'routes/components',
	'Prototype object not found.',
	'mockObjectViews',
	'mockEditData',
	'object-view-alt',
	'object-view/',
	'src/lib/data/seed',
	'src/lib/ui/mapBatch',
	'DropzonePanel',
	'FileListPanel'
];

const SCAN_EXTENSIONS = new Set(['.js', '.mjs', '.json', '.html']);

export const collectFiles = async (root) => {
	const files = [];
	const walk = async (directory) => {
		const entries = await readdir(directory, { withFileTypes: true });
		for (const entry of entries) {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) await walk(path);
			else if (SCAN_EXTENSIONS.has(extname(entry.name))) files.push(path);
		}
	};
	await walk(root);
	return files;
};

export const scanTree = async (root, forbidden) => {
	try {
		const files = await collectFiles(root);
		const violations = [];
		for (const file of files) {
			const content = await readFile(file, 'utf8');
			for (const token of forbidden) {
				if (content.includes(token)) violations.push(`${file}: ${token}`);
			}
		}
		return { files: files.length, violations };
	} catch {
		return { files: 0, violations: [`missing or unreadable tree: ${root}`] };
	}
};

export const runVerification = async ({
	deployedRoot = DEPLOYED_ROOT,
	intermediateRoot = INTERMEDIATE_ROOT,
	requiredEntry = REQUIRED_ENTRY,
	forbidden = FORBIDDEN
} = {}) => {
	const violations = [];

	const entryExists = await stat(requiredEntry).then(
		() => true,
		() => false
	);
	if (!entryExists) {
		violations.push(`deployed adapter entry missing: ${requiredEntry}`);
	}

	const deployed = await scanTree(deployedRoot, forbidden);
	if (deployed.files === 0 && !deployed.violations.length) {
		deployed.violations.push(`zero generated files scanned under ${deployedRoot}`);
	}
	const intermediate = await scanTree(intermediateRoot, forbidden);

	for (const violation of deployed.violations) violations.push(`deployed: ${violation}`);
	for (const violation of intermediate.violations) violations.push(`intermediate: ${violation}`);

	return {
		ok: violations.length === 0,
		deployedFiles: deployed.files,
		intermediateFiles: intermediate.files,
		violations
	};
};

const main = async () => {
	const result = await runVerification();
	if (!result.ok) {
		console.error(`Prototype route boundary failed:\n${result.violations.join('\n')}`);
		process.exit(1);
	}
	console.log(
		`Verified ${result.deployedFiles} deployed files and ${result.intermediateFiles} intermediate files: no prototype routes or loaders.`
	);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}
