import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

import { runVerification, scanTree } from './verify-route-boundary.mjs';

const tempRoots = [];

const makeTree = async () => {
	const root = await mkdtemp(join(tmpdir(), 'verify-boundary-'));
	tempRoots.push(root);
	const deployed = join(root, 'build');
	const intermediate = join(root, 'output');
	await mkdir(deployed);
	await mkdir(intermediate);
	await writeFile(join(deployed, 'index.js'), 'server entry');
	await writeFile(join(deployed, 'server.js'), 'server chunk');
	await writeFile(join(intermediate, 'client.json'), '{}');
	return { root, deployed, intermediate };
};

afterEach(async () => {
	for (const root of tempRoots.splice(0)) {
		await rm(root, { recursive: true, force: true });
	}
});

describe('runVerification', () => {
	it('passes for clean deployed and intermediate trees', async () => {
		const { deployed, intermediate } = await makeTree();
		const result = await runVerification({
			deployedRoot: deployed,
			intermediateRoot: intermediate,
			requiredEntry: join(deployed, 'index.js')
		});
		expect(result.ok).toBe(true);
		expect(result.deployedFiles).toBe(2);
		expect(result.intermediateFiles).toBe(1);
		expect(result.violations).toEqual([]);
	});

	it('fails when the deployed tree is missing', async () => {
		const { intermediate } = await makeTree();
		const result = await runVerification({
			deployedRoot: join(tempRoots[tempRoots.length - 1], 'missing'),
			intermediateRoot: intermediate,
			requiredEntry: join(tempRoots[tempRoots.length - 1], 'missing', 'index.js')
		});
		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('adapter entry missing'))).toBe(true);
		expect(result.violations.some((violation) => violation.includes('missing or unreadable tree'))).toBe(true);
	});

	it('fails when the deployed adapter entry is missing', async () => {
		const { deployed, intermediate } = await makeTree();
		await rm(join(deployed, 'index.js'));
		const result = await runVerification({
			deployedRoot: deployed,
			intermediateRoot: intermediate,
			requiredEntry: join(deployed, 'index.js')
		});
		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('adapter entry missing'))).toBe(true);
	});

	it('fails closed when zero files are scanned in the deployed tree', async () => {
		const { deployed, intermediate } = await makeTree();
		await rm(deployed, { recursive: true });
		await mkdir(deployed);
		await writeFile(join(deployed, 'README'), 'unscanned extension');
		const result = await runVerification({
			deployedRoot: deployed,
			intermediateRoot: intermediate,
			requiredEntry: join(deployed, 'README')
		});
		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('zero generated files'))).toBe(true);
	});

	it('rejects prototype routes in the deployed artifact', async () => {
		const { deployed, intermediate } = await makeTree();
		await writeFile(join(deployed, 'leak.js'), 'route /prototype/object rendered');
		const result = await runVerification({
			deployedRoot: deployed,
			intermediateRoot: intermediate,
			requiredEntry: join(deployed, 'index.js')
		});
		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('/prototype'))).toBe(true);
	});

	it('rejects component-gallery routes in the intermediate tree', async () => {
		const { deployed, intermediate } = await makeTree();
		await writeFile(join(intermediate, 'routes.json'), JSON.stringify({ src: 'src/routes/components/+page.svelte' }));
		const result = await runVerification({
			deployedRoot: deployed,
			intermediateRoot: intermediate,
			requiredEntry: join(deployed, 'index.js')
		});
		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('src/routes/components'))).toBe(true);
	});

	it('rejects documented mock and seed modules when bundled', async () => {
		const { deployed, intermediate } = await makeTree();
		await writeFile(join(deployed, 'mock.js'), 'import { mockEditData } from "src/lib/objectView/mockEditData"');
		const result = await runVerification({
			deployedRoot: deployed,
			intermediateRoot: intermediate,
			requiredEntry: join(deployed, 'index.js')
		});
		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('mockEditData'))).toBe(true);
	});

	it('scans html and mjs files', async () => {
		const { deployed, intermediate } = await makeTree();
		await writeFile(join(deployed, 'index.html'), '<a href="/ingestion-proto">proto</a>');
		const result = await runVerification({
			deployedRoot: deployed,
			intermediateRoot: intermediate,
			requiredEntry: join(deployed, 'index.js')
		});
		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('/ingestion-proto'))).toBe(true);
	});
});

describe('scanTree', () => {
	it('returns a missing-tree violation for absent roots', async () => {
		const result = await scanTree(join(tmpdir(), 'does-not-exist-' + Date.now()), []);
		expect(result.files).toBe(0);
		expect(result.violations[0]).toContain('missing or unreadable tree');
	});
});
