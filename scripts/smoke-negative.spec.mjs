import { spawn } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SKIP = process.env.RUN_SMOKE_NEGATIVE !== '1';

const spawned = [];

const runSmoke = (env) =>
	new Promise((resolve) => {
		const child = spawn(process.execPath, ['scripts/smoke-auth.mjs'], {
			cwd: new URL('..', import.meta.url).pathname,
			env: { ...process.env, ...env },
			stdio: ['ignore', 'pipe', 'pipe']
		});
		spawned.push(child);
		let output = '';
		child.stdout.on('data', (chunk) => {
			output += chunk.toString();
		});
		child.stderr.on('data', (chunk) => {
			output += chunk.toString();
		});
		child.on('exit', (code) => resolve({ code, output }));
	});

const portsFree = () =>
	import('node:net').then((net) =>
		Promise.all(
			[4600, 4601].map(
				(port) =>
					new Promise((resolve, reject) => {
						const socket = net.createServer();
						socket.once('error', reject);
						socket.listen(port, '127.0.0.1', () => socket.close(resolve));
					})
			)
		)
	);

const stopSpawned = () =>
	Promise.all(
		spawned.splice(0).map(
			(child) =>
				new Promise((resolve) => {
					if (child.exitCode !== null) {
						resolve();
						return;
					}
					child.once('exit', resolve);
					try {
						process.kill(-child.pid, 'SIGTERM');
					} catch {
						child.kill('SIGTERM');
					}
					setTimeout(() => {
						try {
							child.kill('SIGKILL');
						} catch {
							// already gone
						}
					}, 5000).unref();
				})
		)
	);

describe.skipIf(SKIP)('smoke negative gating', () => {
	beforeAll(async () => {
		await portsFree();
	});

	afterAll(async () => {
		await stopSpawned();
		await portsFree();
	});

	it(
		'exits nonzero for scoped interaction and settled browser faults',
		async () => {
			const { code, output } = await runSmoke({
				SMOKE_FAULTS: [
					'route-origin',
					'visible-localization',
					'tag-removal-stuck',
					'info-drawer-absent',
					'support-sheet-stale',
					'resync-http',
					'publish-close-stuck',
					'console-error',
					'page-error',
					'request-abort',
					'http-error'
				].join(',')
			});
			expect(output).toMatch(/FAIL mobile en \/objects: stays on route.*expected origin/);
			expect(output).toContain('FAIL mobile en /: localized copy renders');
			expect(output).toMatch(/FAIL desktop interaction new-ingestion tag removal: exercised.*tag still present/);
			expect(output).toMatch(/FAIL desktop interaction info drawer: exercised.*did not open/);
			expect(output).toMatch(/FAIL desktop interaction support sheet: exercised.*did not render/);
			expect(output).toMatch(/FAIL desktop interaction resync confirmation: exercised.*status 503/);
			expect(output).toMatch(/FAIL desktop interaction publish dialog: exercised.*did not close/);
			expect(output).toContain('SMOKE_FAULT console-error');
			expect(output).toContain('SMOKE_FAULT page-error');
			expect(output).toContain('/smoke-fault-request-abort');
			expect(output).toContain('503 http://127.0.0.1:4600/smoke-fault-http-error');
			expect(output).toContain('manifest: every route/viewport/locale visited');
			expect(code).not.toBe(0);
		},
		900_000
	);

	it(
		'rejects a stuck drawer close outcome',
		async () => {
			const { code, output } = await runSmoke({ SMOKE_FAULTS: 'info-drawer-close-stuck' });
			expect(output).toMatch(/FAIL desktop interaction info drawer: exercised.*did not close/);
			expect(code).not.toBe(0);
		},
		900_000
	);

	it(
		'propagates an unexpected child exit and releases ports',
		async () => {
			const { code, output } = await runSmoke({ SMOKE_FAULTS: 'child-exit' });
			expect(output).toContain('[smoke fault] child-exit: terminating fixture unexpectedly');
			expect(output).toContain('child process exited unexpectedly');
			expect(code).not.toBe(0);
		},
		900_000
	);

	it(
		'keeps the highest exit code across repeated shutdown requests',
		async () => {
			const { code, output } = await runSmoke({ SMOKE_FAULTS: 'shutdown-race' });
			expect(output).toContain('[smoke fault] shutdown-race: requesting exit codes 1 then 7');
			expect(code).toBe(7);
		},
		900_000
	);
});
