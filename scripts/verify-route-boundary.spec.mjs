import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { FORBIDDEN_IMPORT_PATTERNS } from './route-boundary-policy.mjs';
import { runVerification, scanTree } from './verify-route-boundary.mjs';

const tempRoots = [];

const makeTree = async (routeIds = ['/', '/objects/[objectId]']) => {
	const root = await mkdtemp(join(tmpdir(), 'verify-boundary-'));
	tempRoots.push(root);
	const deployed = join(root, 'build');
	const intermediate = join(root, 'output');
	const manifest = join(intermediate, 'server/manifest-full.js');
	await mkdir(deployed);
	await mkdir(join(intermediate, 'server'), { recursive: true });
	await writeFile(join(deployed, 'index.js'), 'server entry');
	await writeFile(join(deployed, 'server.js'), 'server chunk');
	await writeFile(join(intermediate, 'client.json'), '{}');
	await writeFile(manifest, `export const manifest = { _: { routes: ${JSON.stringify(routeIds.map((id) => ({ id })))} } };`);
	return { root, deployed, intermediate, manifest };
};

const verify = ({ root, deployed, intermediate, manifest }, overrides = {}) =>
	runVerification({
		deployedRoot: deployed,
		intermediateRoot: intermediate,
		requiredEntry: join(deployed, 'index.js'),
		requiredManifest: manifest,
		sourceRoot: root,
		...overrides
	});

afterEach(async () => {
	for (const root of tempRoots.splice(0)) await rm(root, { recursive: true, force: true });
});

describe('runVerification', () => {
	it('passes clean source, manifest, deployed, and intermediate inventories', async () => {
		const result = await verify(await makeTree());

		expect(result).toMatchObject({ ok: true, routeCount: 2, deployedFiles: 2, intermediateFiles: 2 });
		expect(result.violations).toEqual([]);
	});

	it.each([
		['missing', async (path) => rm(path)],
		['empty', async (path) => writeFile(path, '')],
		['not a regular file', async (path) => {
			await rm(path);
			await mkdir(path);
		}]
	])('rejects a %s deployed adapter entry', async (_label, mutate) => {
		const tree = await makeTree();
		await mutate(join(tree.deployed, 'index.js'));

		const result = await verify(tree);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('deployed adapter entry'))).toBe(true);
	});

	it.each([
		['missing', async (path) => rm(path)],
		['empty', async (path) => writeFile(path, '')],
		['not a regular file', async (path) => {
			await rm(path);
			await mkdir(path);
		}]
	])('rejects a %s intermediate route manifest', async (_label, mutate) => {
		const tree = await makeTree();
		await mutate(tree.manifest);

		const result = await verify(tree);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('intermediate route manifest'))).toBe(true);
	});

	it.each(['deployed', 'intermediate'])('rejects a missing %s artifact tree', async (treeName) => {
		const tree = await makeTree();
		await rm(treeName === 'deployed' ? tree.deployed : tree.intermediate, { recursive: true });

		const result = await verify(tree);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes(`${treeName}: missing or unreadable tree`))).toBe(true);
	});

	it.each([
		['an unimportable manifest', 'not valid JavaScript', 'manifest import failed'],
		['a missing routes export', 'export const manifest = {};', 'manifest does not export manifest._.routes'],
		['an empty route inventory', 'export const manifest = { _: { routes: [] } };', 'nonempty array'],
		['an empty route ID', 'export const manifest = { _: { routes: [{ id: "" }] } };', 'nonempty strings']
	])('rejects %s', async (_label, source, expected) => {
		const tree = await makeTree();
		await writeFile(tree.manifest, source);

		const result = await verify(tree);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes(expected))).toBe(true);
	});

	it.each(['/prototype', '/objects/prototype/[id]', '/ingestion-proto', '/components/base-button'])(
		'rejects the forbidden route segment in %s',
		async (routeId) => {
			const result = await verify(await makeTree([routeId]));

			expect(result.ok).toBe(false);
			expect(result.violations.some((violation) => violation.includes(`route ID "${routeId}"`))).toBe(true);
		}
	);

	it('matches route IDs segment-wise rather than by substring', async () => {
		const result = await verify(await makeTree(['/prototype-notes', '/ui-components-guide']));

		expect(result.ok).toBe(true);
		expect(result.routeCount).toBe(2);
	});

	it.each(['deployed', 'intermediate'])('fails closed when zero %s files are scanned', async (treeName) => {
		const tree = await makeTree();
		const scanRoot = treeName === 'deployed' ? tree.deployed : tree.intermediate;
		await rm(scanRoot, { recursive: true });
		await mkdir(scanRoot, { recursive: true });
		await writeFile(join(scanRoot, 'README'), 'unscanned extension');
		const overrides = treeName === 'deployed'
			? { requiredEntry: join(scanRoot, 'README') }
			: { requiredManifest: join(scanRoot, 'README') };

		const result = await verify(tree, overrides);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes(`${treeName}: zero generated files`))).toBe(true);
	});

	it('rejects files under a forbidden source root while allowing an empty remnant directory', async () => {
		const tree = await makeTree();
		const forbiddenRoot = join(tree.root, 'src/routes/prototype');
		await mkdir(forbiddenRoot, { recursive: true });
		expect((await verify(tree)).ok).toBe(true);
		await writeFile(join(forbiddenRoot, '+page.svelte'), '<h1>Prototype</h1>');

		const result = await verify(tree);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('src/routes/prototype'))).toBe(true);
	});

	it('rejects an exact forbidden source file', async () => {
		const tree = await makeTree();
		const forbiddenFile = join(tree.root, 'src/lib/components/object-edit/ObjectEditPanel.svelte');
		await mkdir(join(forbiddenFile, '..'), { recursive: true });
		await writeFile(forbiddenFile, '<div>prototype editor</div>');

		const result = await verify(tree);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('ObjectEditPanel.svelte'))).toBe(true);
	});

	it('retains deployed and intermediate artifact token scans', async () => {
		const tree = await makeTree();
		await writeFile(join(tree.deployed, 'mock.js'), 'const data = mockEditData;');
		await writeFile(join(tree.intermediate, 'legacy.html'), '<script src="src/routes/components/+page.svelte"></script>');

		const result = await verify(tree);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('deployed:') && violation.includes('mockEditData'))).toBe(true);
		expect(result.violations.some((violation) => violation.includes('intermediate:') && violation.includes('src/routes/components'))).toBe(true);
	});
});

describe('centralized import policy', () => {
	it('blocks removed modules without blocking production exceptions', () => {
		const restricted = FORBIDDEN_IMPORT_PATTERNS.flatMap(({ group }) => group);

		expect(restricted).toContain('$lib/components/object-edit/ObjectEditPanel.svelte');
		expect(restricted).not.toContain('$lib/components/object-edit/SourceTextDiff.svelte');
		expect(restricted).not.toContain('$lib/components/object-detail/MediaRequestBanner.svelte');
	});
});

describe('scanTree', () => {
	it('scans JavaScript, MJS, JSON, and HTML artifacts', async () => {
		const root = await mkdtemp(join(tmpdir(), 'verify-scan-'));
		tempRoots.push(root);
		for (const extension of ['js', 'mjs', 'json', 'html']) await writeFile(join(root, `artifact.${extension}`), 'forbidden-token');
		await writeFile(join(root, 'README'), 'forbidden-token');

		const result = await scanTree(root, ['forbidden-token']);

		expect(result.files).toBe(4);
		expect(result.violations).toHaveLength(4);
	});

	it('returns a missing-tree violation for an absent root', async () => {
		const result = await scanTree(join(tmpdir(), `does-not-exist-${Date.now()}`), []);

		expect(result).toMatchObject({ files: 0 });
		expect(result.violations[0]).toContain('missing or unreadable tree');
	});
});
