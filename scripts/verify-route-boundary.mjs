import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
	FORBIDDEN_EMITTED_TOKENS,
	FORBIDDEN_ROUTE_SEGMENTS,
	FORBIDDEN_SOURCE_FILES,
	FORBIDDEN_SOURCE_ROOTS
} from './route-boundary-policy.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(SCRIPT_DIR, '..');

export const DEPLOYED_ROOT = join(PROJECT_DIR, 'build');
export const INTERMEDIATE_ROOT = join(PROJECT_DIR, '.svelte-kit/output');
export const REQUIRED_ENTRY = join(DEPLOYED_ROOT, 'index.js');
export const REQUIRED_MANIFEST = join(INTERMEDIATE_ROOT, 'server/manifest-full.js');

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

const validateRegularNonemptyFile = async (path, label) => {
	try {
		const details = await stat(path);
		if (!details.isFile()) return `${label} is not a regular file: ${path}`;
		if (details.size === 0) return `${label} is empty: ${path}`;
	} catch {
		return `${label} missing or unreadable: ${path}`;
	}
	return null;
};

const inspectManifest = async (manifestPath, forbiddenRouteSegments) => {
	try {
		const module = await import(`${pathToFileURL(manifestPath).href}?route-boundary=${Date.now()}`);
		const routes = module.manifest?._?.routes;
		if (!Array.isArray(routes)) return { routeCount: 0, violations: ['manifest does not export manifest._.routes'] };

		const routeIds = routes.map((route) => route?.id);
		if (routeIds.length === 0 || routeIds.some((id) => typeof id !== 'string' || id.trim().length === 0)) {
			return { routeCount: 0, violations: ['manifest route IDs must be a nonempty array of nonempty strings'] };
		}

		const violations = [];
		for (const routeId of routeIds) {
			const segments = routeId.split('/').filter(Boolean);
			for (const segment of forbiddenRouteSegments) {
				if (segments.includes(segment)) violations.push(`forbidden route segment "${segment}" in route ID "${routeId}"`);
			}
		}
		return { routeCount: routeIds.length, violations };
	} catch (error) {
		return { routeCount: 0, violations: [`manifest import failed: ${error instanceof Error ? error.message : String(error)}`] };
	}
};

const validateSourceInventory = async (sourceRoot, forbiddenRoots, forbiddenFiles) => {
	const violations = [];
	const containsFile = async (directory) => {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			if (!entry.isDirectory() || (await containsFile(join(directory, entry.name)))) return true;
		}
		return false;
	};
	for (const relativePath of forbiddenRoots) {
		try {
			if (await containsFile(join(sourceRoot, relativePath))) {
				violations.push(`forbidden prototype source root contains files: ${relativePath}`);
			}
		} catch (error) {
			if (error?.code !== 'ENOENT') violations.push(`forbidden source root is unreadable: ${relativePath}`);
		}
	}
	for (const relativePath of forbiddenFiles) {
		try {
			await stat(join(sourceRoot, relativePath));
			violations.push(`forbidden prototype source exists: ${relativePath}`);
		} catch (error) {
			if (error?.code !== 'ENOENT') violations.push(`forbidden source path is unreadable: ${relativePath}`);
		}
	}
	return violations;
};

export const runVerification = async ({
	deployedRoot = DEPLOYED_ROOT,
	intermediateRoot = INTERMEDIATE_ROOT,
	requiredEntry = REQUIRED_ENTRY,
	requiredManifest = REQUIRED_MANIFEST,
	sourceRoot = PROJECT_DIR,
	forbiddenRouteSegments = FORBIDDEN_ROUTE_SEGMENTS,
	forbiddenSourceRoots = FORBIDDEN_SOURCE_ROOTS,
	forbiddenSourceFiles = FORBIDDEN_SOURCE_FILES,
	forbidden = FORBIDDEN_EMITTED_TOKENS
} = {}) => {
	const violations = [];

	const entryViolation = await validateRegularNonemptyFile(requiredEntry, 'deployed adapter entry');
	if (entryViolation) violations.push(entryViolation);
	const manifestViolation = await validateRegularNonemptyFile(requiredManifest, 'intermediate route manifest');
	if (manifestViolation) violations.push(manifestViolation);

	let manifest = { routeCount: 0, violations: [] };
	if (!manifestViolation) manifest = await inspectManifest(requiredManifest, forbiddenRouteSegments);
	for (const violation of manifest.violations) violations.push(`manifest: ${violation}`);
	for (const violation of await validateSourceInventory(sourceRoot, forbiddenSourceRoots, forbiddenSourceFiles)) {
		violations.push(`source: ${violation}`);
	}

	const deployed = await scanTree(deployedRoot, forbidden);
	if (deployed.files === 0 && !deployed.violations.length) {
		deployed.violations.push(`zero generated files scanned under ${deployedRoot}`);
	}
	const intermediate = await scanTree(intermediateRoot, forbidden);
	if (intermediate.files === 0 && !intermediate.violations.length) {
		intermediate.violations.push(`zero generated files scanned under ${intermediateRoot}`);
	}

	for (const violation of deployed.violations) violations.push(`deployed: ${violation}`);
	for (const violation of intermediate.violations) violations.push(`intermediate: ${violation}`);

	return {
		ok: violations.length === 0,
		routeCount: manifest.routeCount,
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
		`Verified ${result.routeCount} routes, ${result.deployedFiles} deployed files, and ${result.intermediateFiles} intermediate files: no prototype routes, source, or loaders.`
	);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}
